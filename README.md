# Mercure

Mercure is a modular security platform built as an Nx monorepo with a Next.js frontend, a NestJS backend, PostgreSQL persistence, and Keycloak/OIDC authentication.

The implemented Rules workflow covers immutable manager-archive snapshots, normalized rule/decoder exploration, diff and intelligence views, PostgreSQL-backed use-case administration, authenticated snapshot import, and controlled authoring through **draft → validate → approve → export**.

Mercure deliberately does **not** deploy approved XML directly to Wazuh managers. Manager write-back, SSH/SFTP deployment, GitOps publishing, automatic approval, and AI-assisted authoring remain separate decision-gated capabilities.

## Development

Use the pinned Node.js and pnpm versions:

~~~bash
corepack enable
pnpm install --frozen-lockfile
~~~

For local PostgreSQL:

~~~bash
docker compose -f deploy/local/postgres.compose.yml up -d
pnpm db:migrate:deploy
~~~

Copy `.env.example` to an untracked local environment file and replace values as appropriate. Never commit real credentials or secrets.

Common workspace checks:

~~~bash
pnpm format
pnpm lint
pnpm api:client:check
pnpm typecheck
pnpm test
pnpm build
~~~

## Identity

Mercure uses Keycloak/OIDC with a server-side web session and backend-enforced capabilities. See:

- `docs/adr/0015-identity-oidc-authorization.md`;
- `docs/standards/keycloak-identity.md`.

## Rules

Rules architecture and migration decisions are documented under `docs/adr` and `docs/migrations/rules-migration-inventory.md`.

Controlled authoring is defined by `docs/adr/0016-rules-controlled-authoring.md`.

## Production readiness

A successful build is not by itself a production approval. Follow `docs/operations/production-readiness.md` for the required CI, database migration, backup/restore, Keycloak, authorization, health, snapshot import, and authoring validation gates.
