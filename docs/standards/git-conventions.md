# Git conventions

## Commit format

Every commit subject MUST match:

`<type>:<scope>:<description>`

The description is lowercase kebab-case and should state one logical change.

Allowed types:

- `feature`
- `fix`
- `security`
- `config`
- `refactor`
- `test`
- `docs`
- `build`
- `ci`
- `perf`
- `chore`
- `revert`

Initial allowed scopes:

- `workspace`
- `nx`
- `web`
- `api`
- `rules`
- `database`
- `prisma`
- `github`
- `ci`
- `dependencies`
- `security`
- `docker`
- `docs`
- `testing`

New product-module scopes are added deliberately as modules are introduced.

Examples:

- `feature:rules:add-snapshot-import`
- `fix:api:reject-malformed-archive`
- `config:nx:enforce-module-boundaries`
- `security:ci:add-secret-scanning`
- `docs:architecture:add-module-boundary-adr`

## Branch format

Branches use `<type>/<kebab-case-description>` with an approved commit type where meaningful, for example `feature/rules-snapshot-import`, `fix/archive-validation`, or `security/dependency-policy`.

## Pull requests

PR titles use the same `<type>:<scope>:<description>` syntax. `main` is intended to be protected by repository rules with required CI and pull requests once ruleset configuration is enabled.

## Attribution and tooling residue

Do not add AI/tool attribution trailers or local agent metadata to commits. Commit authorship should reflect the configured developer/repository identity. Tool-specific prompt/config files are prohibited by repository hygiene policy.
