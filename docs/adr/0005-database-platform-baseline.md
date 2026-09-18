# ADR-0005: PostgreSQL and Prisma data platform

- Status: Accepted
- Date: 2026-09-18

## Context

Mercure needs one canonical persistence platform before product modules begin storing domain data. Database access must remain behind backend infrastructure boundaries, migrations must be reproducible, and local/CI/production workflows must behave consistently.

## Decision

### Database baseline

- PostgreSQL 18.6 is the production database baseline.
- PostgreSQL 19 is not adopted while it remains pre-release.
- Prisma ORM 7.10.0 is the ORM/migration baseline. Prisma 8 is not adopted while its stable production surface is still release-candidate status.
- PostgreSQL access uses Prisma's `@prisma/adapter-pg` over `pg`.

### Ownership and boundaries

Database infrastructure lives in `libs/platform/backend/database/` with `scope:platform`, `side:backend`, and `type:infrastructure`.

Prisma, generated Prisma Client code, connection pooling, database lifecycle, transactions, and low-level health checks are backend infrastructure concerns. They must not be imported by:

- `apps/web`
- frontend libraries
- controllers directly
- backend domain libraries
- backend application libraries except through explicit repository/transaction ports

Product repositories belong to their product module infrastructure library and use the platform database capability. Prisma models do not become domain entities automatically.

### Schema organization

The Prisma schema root is `prisma/`:

```text
prisma/
├── schema.prisma
├── models/
├── migrations/
└── seed/
```

`schema.prisma` owns the datasource and client generator. Domain-specific model files are added under `models/` only when that domain is introduced. Empty directories are not committed solely for appearance.

Generated Prisma Client code is emitted into the database platform library and is ignored by Git. CI and builds generate it deterministically from the committed schema.

### Naming and identifiers

- PostgreSQL tables and columns use `snake_case`.
- Prisma models use `PascalCase`.
- TypeScript properties use `camelCase`.
- Application-owned entity identifiers use UUIDs by default.
- UUID generation is database-backed with PostgreSQL `gen_random_uuid()` unless a domain has a documented reason to generate identifiers before persistence.
- Natural identifiers may receive unique constraints but do not replace stable internal IDs by default.
- Timestamps are stored as PostgreSQL `timestamptz` and represented as UTC instants.

### Lifecycle fields

New mutable aggregate tables normally include `created_at` and `updated_at`. Immutable event/snapshot tables use timestamps appropriate to their semantics and do not receive meaningless update columns.

Soft deletion is not a global convention. A module may introduce it only when retention/recovery requirements justify it; otherwise rows are deleted or retained according to explicit domain policy.

### Relational integrity

- Foreign keys are required for relational references unless an external-system identifier makes that impossible.
- Cascade behavior must be chosen deliberately per relation; broad cascade deletion is not a default.
- Unique constraints encode real invariants.
- Indexes are added for demonstrated access paths, foreign-key joins, ordering/filtering hot paths, and uniqueness—not speculatively on every field.
- Database constraints remain authoritative for invariants that can be expressed safely at the persistence layer.

### JSONB and enums

JSONB is reserved for schemaless provenance, external payloads, or data whose structure is not the primary query contract. Searchable business fields are modeled relationally rather than buried in JSONB.

PostgreSQL enums are used only for values that are genuinely stable at the database boundary. Frequently evolving product states use constrained strings or reference data instead of migration-heavy enums.

### Transactions

Transactions are defined at application use-case boundaries. Repositories do not silently open nested business transactions. The database platform may expose an explicit transaction runner/context abstraction so multiple repositories can participate in one unit of work.

Long-running network calls, archive parsing, or external-service calls must not occur while a database transaction is held unless a specific consistency design requires it.

### Migrations

- `prisma migrate dev` is development-only.
- `prisma migrate deploy` is the staging/production application mechanism.
- `prisma db push` is not a production deployment strategy.
- Migration files are source-controlled and immutable after merge. Corrections are new migrations.
- CI applies the complete migration history to a clean PostgreSQL 18.6 database.
- Schema validation and client generation are blocking CI steps.
- Production migration execution belongs to the release/deployment pipeline, not application startup.

### Connection management

The API process owns one Prisma client/driver pool lifecycle through the platform database module.

Pool size, connection timeout, and idle timeout are typed configuration. Defaults are conservative and can be tuned from deployment capacity rather than hard-coded per repository.

### Health

`/api/v1/health/live` remains process-only. `/api/v1/health/ready` includes a bounded database connectivity probe once this platform is wired. A database outage must make readiness fail without making the liveness endpoint fail.

## Consequences

- PostgreSQL is the single canonical persistence technology for current platform data.
- Database technology does not leak into frontend, domain, or controller code.
- Product modules can add models and repositories without inventing their own connection lifecycle.
- Migration history is reproducible from an empty database and safe to deploy through CI/CD.
- No placeholder users, authentication tables, or artificial product models are introduced merely to prove the database stack.
