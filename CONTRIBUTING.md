# Contributing to Mercure

Mercure is a security-sensitive Nx monorepo. Changes should preserve the architectural and security invariants documented under `docs/architecture`, `docs/adr`, and `docs/standards`.

## Development setup

Use the repository-pinned Node.js and pnpm versions.

```bash
corepack enable
pnpm install --frozen-lockfile
docker compose -f deploy/local/postgres.compose.yml up -d
pnpm db:migrate:deploy
```

Before opening a pull request, run the same core gates used by CI:

```bash
pnpm format
pnpm lint
pnpm api:client:check
pnpm typecheck
pnpm test
pnpm build
pnpm release:prepare
```

## Git policy

Branches use `<type>/<kebab-case-description>`. Authored commit subjects and pull-request titles use:

```text
<type>:<scope>:<description>
```

The allowed types/scopes and merge-commit exception are defined in `docs/standards/git-conventions.md` and enforced by Governance CI.

Do not push directly to `main`. Changes must pass the protected-branch ruleset and required checks.

## Architecture

- Keep `apps/web` and `apps/api` thin composition roots.
- Product capabilities belong under `libs/modules/<module>/`.
- Do not bypass Nx module boundaries.
- Do not move backend business logic, persistence, filesystem processing, or authorization into the browser.
- Architecture changes that weaken or alter a locked principle require an ADR.

## Security-sensitive changes

Preserve deny-by-default authentication/authorization behavior and the repository's critical regression tests. Do not introduce test-only production bypasses for Keycloak, capabilities, tenant isolation, archive bounds, authoring approval, or rate limiting.

Report suspected vulnerabilities according to `SECURITY.md`; do not publish exploit details in an ordinary issue.

## Dependencies

Dependencies are exact-version pinned, lifecycle scripts are denied by default, and normal version updates observe a seven-day release quarantine. Follow `docs/standards/dependency-management.md` and update the corresponding policy file when a new lifecycle-script approval or release-age exception is genuinely required.

Do not weaken frozen installs, audit gates, action SHA pinning, or advisory handling merely to make CI green.

## Database changes

Use forward-only Prisma migrations. Never edit a migration that may already have been deployed. Database changes must pass migration deployment and the relevant PostgreSQL integration tests.

## Repository hygiene

Do not commit credentials, local environment files, generated build output, editor/agent metadata, prompt files, or AI/tool attribution residue. Secret scanning and repository hygiene checks are blocking controls.

Keep each pull request focused on one logical outcome and explain rollout, security, migration, and operational implications when they exist.
