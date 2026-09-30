# Mercure

Mercure is a modular security platform built as an Nx monorepo with a Next.js frontend, a NestJS backend, PostgreSQL persistence, and Keycloak/OIDC authentication.

The implemented Rules workflow covers immutable manager-archive snapshots, normalized rule/decoder exploration, diff and intelligence views, PostgreSQL-backed use-case administration, authenticated snapshot import, and controlled authoring through **draft → validate → approve → export**.

Mercure deliberately does **not** deploy approved XML directly to Wazuh managers. Manager write-back, SSH/SFTP deployment, GitOps publishing, automatic approval, and AI-assisted authoring remain separate decision-gated capabilities.

## Development

Use the pinned Node.js and pnpm versions:

```bash
corepack enable
pnpm install --frozen-lockfile
```

Start the complete local PostgreSQL and Keycloak foundation, generate the database client, and apply migrations:

```bash
pnpm dev:setup
pnpm dev
```

`dev:setup` creates an untracked `.env.local` from `.env.local.example` when one does not already exist. Never commit real credentials or secrets. Stop local infrastructure with `pnpm dev:services:down`.

Common workspace checks:

```bash
pnpm format
pnpm lint
pnpm api:client:check
pnpm typecheck
pnpm test
pnpm build
```

## Identity

Mercure uses Keycloak/OIDC with a server-side web session and backend-enforced capabilities. See:

- `docs/adr/0015-identity-oidc-authorization.md`;
- `docs/standards/keycloak-identity.md`.

## Rules

Rules architecture and migration decisions are documented under `docs/adr` and `docs/migrations/rules-migration-inventory.md`.

Controlled authoring is defined by `docs/adr/0018-rules-controlled-authoring.md`.

## Security

Security vulnerabilities should be reported privately according to `SECURITY.md`. Repository secret scanning, dependency audit, CodeQL, critical-regression inventory, and protected-branch checks are blocking controls.

## Production readiness

A successful build is not by itself a production approval. Follow `docs/operations/production-readiness.md` for the required CI, database migration, backup/restore, Keycloak, authorization, health, snapshot import, authoring, release-integrity, and rollback validation gates.

The production observability expectations are defined in `docs/operations/observability.md`.

Contribution and repository workflow requirements are documented in `CONTRIBUTING.md`.

New product capabilities must start with the module generator and follow
`docs/development/add-module.md`.
