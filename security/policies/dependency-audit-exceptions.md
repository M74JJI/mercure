# Dependency audit exceptions

Mercure treats high and critical dependency advisories as blocking for deployable runtime artifacts unless an exception is explicitly documented and mechanically constrained.

## Prisma CLI optional-peer advisories

The API currently uses Prisma ORM 7.10.0 with the `prisma-client` generator, a generated client imported from the repository source tree, `@prisma/adapter-pg`, and PostgreSQL.

The pruned pnpm dependency graph still carries the Prisma CLI optional-peer closure required by `@prisma/client` packaging. Two high-severity advisories occur only inside that CLI/tooling closure:

- `GHSA-ggr8-5vv4-36mx` — `deepmerge-ts < 8.0.0`, reached through `prisma > @prisma/config`.
- `GHSA-3f6p-5ww8-9rcr` — `mysql2 < 3.22.0`, reached through `prisma`.

Mercure does not use MySQL, and the API bundle must not import `prisma`, `@prisma/config`, `deepmerge-ts`, or `mysql2`. The Security workflow verifies that condition before applying the two GHSA-specific audit ignores. Any other high or critical advisory remains blocking.

These are not blanket package exceptions. Remove each GHSA ignore as soon as the supported Prisma release removes the affected optional-peer path or resolves the advisory without requiring an incompatible transitive override.

## Review rules

- Do not add an audit ignore without a repository policy entry.
- Prefer a patched direct dependency or supported upstream release over an exception.
- Do not force incompatible transitive major versions solely to silence an audit.
- Keep exceptions advisory-specific and pair them with a machine-checkable reachability or usage constraint.
