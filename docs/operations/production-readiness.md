# Production readiness and release runbook

This runbook defines the minimum release and deployment validation for Mercure.

It is intentionally separate from Wazuh configuration deployment. Mercure currently imports manager archives, analyzes immutable snapshots, and supports controlled Rules authoring through **draft → validate → approve → export**. It does not write approved XML back to a Wazuh manager, SSH/SFTP target, Git repository, or deployment pipeline.

## Release gate

Do not label a Mercure revision production-ready until all of the following are true:

1. the intended pull requests are merged in stack order and required GitHub checks are green;
2. the release commit passes a frozen dependency install;
3. formatting, lint, generated API contract, typecheck, tests, and production builds pass;
4. the complete Prisma migration history applies successfully to a disposable PostgreSQL instance;
5. Rules PostgreSQL integration tests pass;
6. production environment parsing succeeds with explicit OIDC/Auth.js configuration;
7. a real Keycloak login is tested for both a normal user and an administrator;
8. API authorization is verified with valid issued tokens;
9. database backup and restore have been tested for the target environment;
10. the target environment passes liveness, readiness, login, Rules read, snapshot import, and controlled-authoring smoke tests.

A green code review without these environment checks is a release candidate, not a validated production deployment.

## Runtime prerequisites

- Node.js: version from `.node-version` (`24.21.0` at the time of this runbook).
- pnpm: version pinned by `packageManager` in `package.json`.
- PostgreSQL compatible with the repository migration history; CI validates against PostgreSQL 18.6.
- Keycloak or a compatible OIDC issuer configured according to `docs/standards/keycloak-identity.md`.
- A reverse proxy / ingress that provides HTTPS for the web application and API in production. Its request-body limit must be at least 4 MiB so the bounded authoring transport envelope is not truncated or rejected before Next/Fastify validation; keep the proxy limit explicitly bounded rather than unlimited.
- Read access from the API runtime to the configured `RULES_MANAGER_ARCHIVE_DIR`.

The repository contains a local PostgreSQL compose file only. It does not currently define production application containers, Kubernetes resources, or a production process-supervisor manifest. Those are deployment-environment concerns and must not be inferred from `deploy/local/postgres.compose.yml`.

After `pnpm build`, run `pnpm release:prepare`. This runs the API `prune` target, verifies the API entrypoint, and creates a self-contained Next standalone tree at `dist/apps/web-standalone`, including the generated static assets required by the minimal Next server. The exact web `server.js` location is written to `dist/release-manifest.json` so deployment automation does not hard-code monorepo output depth.

The API bundle at `dist/apps/api/main.js` externalizes third-party runtime packages. The Nx `prune-lockfile` and `copy-workspace-modules` targets therefore emit a production `package.json`, pruned `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and any required `workspace_modules/` beside the bundle. A deployment can copy `dist/apps/api`, run `pnpm install --prod --frozen-lockfile` inside that artifact, and then start `node main.js`. Do not replace the pruned lock/settings files or copied workspace modules with ad-hoc dependency installation.

For the web artifact, use the `web.startCommand` written to `dist/release-manifest.json`; do not run `next start` against the standalone tree. Set `HOSTNAME=0.0.0.0` (or the deployment-specific bind address) and `PORT` to the intended web listener. The manifest records safe defaults of `0.0.0.0:3000`, but the deployment platform remains responsible for TLS termination, routing, and health supervision.

## Required configuration

Start from `.env.example`, but do not use example secrets in production.

### API

At minimum configure:

- `NODE_ENV=production`;
- `API_HOST`;
- `API_PORT`;
- `API_CORS_ORIGINS` with explicit HTTPS web origins;
- `DATABASE_URL`;
- `DATABASE_DIRECT_URL` for Prisma migration operations when required by the deployment;
- `OIDC_ISSUER_URL` using HTTPS;
- `OIDC_AUDIENCE`;
- `OIDC_CLIENT_ID`;
- `OIDC_ADMIN_AUTHORITIES` with application-specific administrator roles/groups;
- `OIDC_USER_AUTHORITIES` with application-specific user roles/groups;
- `RULES_MANAGER_ARCHIVE_DIR`.

Review the bounded database, JWKS, HTTP body, and Rules archive limits in `.env.example` before deployment. The Rules authoring domain remains capped at 1 MiB of XML, while the HTTP and Server Action transport envelope is 4 MiB so form/JSON framing and escaping cannot reject a valid near-limit draft before domain validation. Do not configure `API_BODY_LIMIT_BYTES` below 4 MiB.

`OPENAPI_ENABLED` should normally be `false` in production unless the deployment explicitly intends to publish the OpenAPI document.

### Web

Production requires explicit:

- `AUTH_SECRET` with at least 32 random characters;
- `AUTH_URL` using the canonical HTTPS web origin;
- `AUTH_TRUST_HOST=true` only behind the trusted proxy/host boundary;
- `AUTH_KEYCLOAK_ID`;
- `AUTH_KEYCLOAK_SECRET`;
- `AUTH_KEYCLOAK_ISSUER` using HTTPS;
- `WEB_AUTH_AUTHORITY_CLIENT_ID`;
- `WEB_AUTH_ADMIN_AUTHORITIES`;
- `WEB_AUTH_USER_AUTHORITIES`;
- `NEXT_PUBLIC_API_BASE_URL` pointing to the intended API origin.

Keep frontend and backend authority mappings aligned. Frontend role mapping controls presentation and routing only; NestJS capability enforcement is authoritative.

## Keycloak validation

Follow `docs/standards/keycloak-identity.md`.

Before release:

1. confirm the confidential web client uses the authorization-code flow;
2. restrict redirect URIs and web origins to the deployed Mercure web origin;
3. ensure tokens issued to the web client contain the API audience configured by `OIDC_AUDIENCE`;
4. ensure the configured client-role namespace matches `OIDC_CLIENT_ID` and `WEB_AUTH_AUTHORITY_CLIENT_ID`;
5. verify the admin mapping grants `rules:import` and `rules:admin`;
6. verify the normal user mapping grants `rules:read` but not mutation capabilities;
7. verify an authenticated identity with no mapped Mercure role is denied.

Do not weaken issuer, audience, or signature validation to accommodate a misconfigured Keycloak client.

## Rules archive boundary

`RULES_MANAGER_ARCHIVE_DIR` is an import source, not a deployment target.

Production permissions should allow the Mercure API process to read the intended manager archive directory and should not grant write permission unless a separate future deployment design explicitly requires it.

Before enabling snapshot import:

- confirm the directory is the intended source;
- confirm archive ownership and permissions;
- confirm archive size/file-count limits are appropriate;
- import a known fixture or approved archive;
- verify the resulting snapshot is immutable and has the expected tenant, rule, decoder, and validation counts.

Source paths and XML bodies must not be exposed through browser-visible errors or operational logs.

## Database release procedure

Take a database backup before applying a new migration history to an existing environment.

For a release checkout:

```bash
pnpm install --frozen-lockfile
pnpm db:validate
pnpm db:generate
pnpm db:migrate:deploy
```

After migrations, verify:

- `/api/v1/health/ready` reports ready;
- snapshot reads succeed for an authorized user;
- authoring list/detail operations succeed for an administrator;
- stale authoring revisions are rejected;
- only an approved unchanged authoring revision can be exported.

Never edit a previously deployed migration file. New schema changes after release must use a new migration.

## Repository quality gate

The same release revision must pass:

```bash
pnpm install --frozen-lockfile
pnpm format
pnpm exec nx run-many -t lint --verbose
pnpm api:client:check
pnpm typecheck
pnpm test
pnpm build
pnpm release:prepare
```

The GitHub Workspace workflow is authoritative for repository validation. The Database integration job additionally validates Prisma, deploys migrations to disposable PostgreSQL, runs Rules persistence integration tests, builds the API, and checks readiness.

Do not merge around a required check. If a GitHub Actions job fails before executing any steps, treat it as CI infrastructure failure and rerun or repair the runner rather than marking the code green manually.

## Runtime health validation

The API exposes:

- `GET /api/v1/health/live` — process liveness;
- `GET /api/v1/health/ready` — dependency readiness.

After deployment, verify both endpoints from the deployment network.

Also verify a protected Rules endpoint without authentication returns 401. Authentication must be enforced before route input validation, so an unauthenticated request must not gain information about protected resources.

## Real authentication and authorization smoke test

Use real Keycloak-issued sessions/tokens in the target environment.

For a read-only API capability smoke test, set the API origin and short-lived real access tokens without printing them:

```bash
export MERCURE_API_BASE_URL=https://api.mercure.example
export MERCURE_USER_ACCESS_TOKEN='<normal-user-access-token>'
export MERCURE_ADMIN_ACCESS_TOKEN='<administrator-access-token>'
pnpm ops:verify-auth
unset MERCURE_USER_ACCESS_TOKEN MERCURE_ADMIN_ACCESS_TOKEN
```

The script is deliberately read-only. It verifies unauthenticated denial, normal-user read access, normal-user denial of the admin-only authoring surface, and administrator read access to that protected surface. Snapshot-import mutation authorization remains covered by automated capability tests and should be exercised with real tokens only in a controlled staging environment or approved change window, because a broken authorization boundary could otherwise turn the smoke test itself into a production mutation.

### Normal user

Confirm a mapped normal user can:

- sign in;
- load the protected application shell;
- list and inspect Rules snapshots;
- inspect normalized rules, decoders, findings, intelligence, and use cases.

Confirm the same user cannot:

- import a Rules snapshot;
- create or mutate custom use cases;
- list, create, edit, validate, approve, or export Rules authoring drafts.

Expected API result for prohibited authenticated operations: HTTP 403.

### Administrator

Confirm a mapped administrator can:

- perform all normal read operations;
- import the configured Rules manager snapshot;
- administer custom use cases;
- clone a snapshot source file into an authoring draft;
- create a bounded standalone rules/decoder draft;
- edit with optimistic revision control;
- validate;
- approve an error-free exact revision;
- export the unchanged approved XML.

Confirm editing an approved draft returns it to draft state and makes the old approval non-exportable.

## Controlled authoring validation

For at least one rules draft and one decoder draft:

1. create or clone the source;
2. save an edit and note the revision increment;
3. attempt a stale update and confirm it is rejected;
4. validate the exact current revision;
5. confirm malformed XML structure (for example an unclosed/mismatched tag) is reported as an error and blocks approval;
6. confirm other validation errors block approval;
7. correct the content and validate again;
8. approve the error-free revision;
9. export it and verify the SHA-256 matches the approved draft;
10. edit the draft again and verify export is blocked until the new revision is validated and approved;
11. inspect the audit timeline and confirm create/edit/validate/approve actor attribution.

Export is an artifact handoff only. Do not copy the artifact to a Wazuh manager as part of this runbook.

## Backup and rollback

Before a production migration:

- take a PostgreSQL backup using the organization-approved backup mechanism;
- record the deployed Git commit;
- record the applied Prisma migration set;
- verify restore into a non-production PostgreSQL instance.

Application rollback must use a revision compatible with the already-applied database schema. Do not roll back database migration files destructively or manually delete authoring provenance.

Imported Rules snapshots and authoring audit history are evidence/provenance data and should be preserved through rollback unless a separately approved retention policy says otherwise.

## Logging and secrets

Operational logs may contain identifiers such as draft IDs, revisions, actor subjects, and operation outcomes.

They must not contain:

- Keycloak access/refresh tokens;
- Auth.js secrets;
- database passwords;
- raw Rules/decoder XML;
- complete manager source bodies;
- private filesystem contents.

Route errors exposed to browsers must remain bounded and generic.

## Final deployment record

For each production release, record:

- Git commit SHA;
- deployment timestamp;
- operator;
- database backup reference;
- applied migration set;
- Keycloak realm/client configuration version or change reference;
- results of liveness/readiness checks;
- normal-user authorization smoke result;
- administrator import/authoring smoke result;
- rollback reference.

## Explicitly deferred

The current approved Mercure boundary does not include:

- direct Wazuh manager writes;
- SSH/SFTP write-back;
- manager archive mutation;
- Git push/pull-request deployment;
- automatic approval;
- automatic rollout or rollback;
- AI-generated rule/decoder changes.

Any of those requires a separate architecture/security decision before implementation.
