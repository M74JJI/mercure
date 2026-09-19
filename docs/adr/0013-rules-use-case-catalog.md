# ADR-0013: PostgreSQL-backed Rules use-case catalog

- Status: Accepted
- Date: 2026-09-19
- Extends: ADR-0007, ADR-0009, ADR-0010

## Context

The legacy Rules Hub stored custom use cases in `data/use-cases.json` and exposed authenticated Next.js CRUD around that file. Mercure already persists immutable snapshot-local copies of active use cases, but those rows are historical provenance and cannot serve as the canonical editable catalog.

The parser accepts a use-case catalog during analysis. Without a canonical catalog, imported snapshots cannot consistently validate explicit or inferred use-case IDs against centrally managed metadata.

Mercure does not yet have an identity/authorization bounded context. Reintroducing public mutating CRUD before that exists would weaken the legacy security posture, because the legacy write routes required an authenticated user.

## Decision

### Canonical catalog

Add a dedicated PostgreSQL `rules_use_case_catalog` table.

It is separate from `ruleset_snapshot_use_cases`:

- `rules_use_case_catalog` is current canonical metadata;
- `ruleset_snapshot_use_cases` remains an immutable copy of the active catalog records used by one historical snapshot.

Deleting or updating a catalog entry never rewrites prior snapshots.

### Catalog identity

Use-case IDs are stable business identifiers and remain the primary key.

IDs must:

- start with `uc_`;
- contain only lowercase ASCII letters, digits, and underscores;
- remain at most 255 characters.

M11 does not generate IDs inside PostgreSQL. Callers provide the stable ID explicitly, matching the legacy contract and avoiding race-prone list-then-generate behavior.

### Provenance

Catalog entries retain the existing domain fields:

- name;
- short name;
- description;
- component;
- vendor;
- product;
- domain;
- category;
- source (`system` or `custom`);
- created-by identity;
- created timestamp.

The canonical table additionally stores an `updated_at` timestamp for operational auditing. `updated_at` is persistence metadata and is not added to the existing `RulesUseCase` parser-domain record.

### Mutation policy

Application use cases may create/update/delete `custom` entries.

`system` entries are read-only through the custom-management application interface. This prevents a future seeded/system catalog from being overwritten by user-level catalog management.

The database owns creation/update timestamps. Client input cannot set `source`, `created_at`, or `updated_at`.

### Import integration

`ImportArchivedRuleset` loads the canonical catalog when no explicit catalog override is supplied.

Explicit `useCases` passed by trusted application callers remain supported for deterministic tests and specialized internal workflows.

Every normal manager import therefore validates rules against the PostgreSQL catalog and copies only active referenced catalog records into the immutable snapshot.

### Application boundary

The Rules application layer owns the catalog port and use cases for:

- list;
- get;
- save custom entry;
- delete custom entry.

Prisma remains confined to Rules infrastructure.

### Presentation and security

M11 does not expose public mutating HTTP endpoints.

The legacy CRUD endpoints required authentication, while Mercure intentionally has no identity/authorization context yet. Public write routes are deferred until a dedicated identity/security decision can enforce authorization and audit actor identity.

A future read or management API can compose the M11 application use cases without redesigning persistence.

### Scope exclusions

M11 does not include:

- public catalog CRUD endpoints;
- frontend catalog management;
- authentication or authorization;
- automatic system-use-case seeding with invented metadata;
- snapshot backfill or mutation;
- catalog versioning/history beyond immutable snapshot copies.

## Consequences

- PostgreSQL becomes the canonical Rules use-case store.
- Normal imports automatically use catalog metadata and registry validation.
- Historical snapshots remain stable when catalog metadata later changes.
- Legacy filesystem JSON persistence is fully retired.
- Public mutation remains blocked until Mercure has an authorization model at least as strong as the legacy authenticated routes.
