# ADR-0010: Rules snapshot API contract

- Status: Accepted
- Date: 2026-09-18
- Extends: ADR-0007, ADR-0008, ADR-0009

## Context

Mercure now imports manager archives, analyzes Rules content, and persists immutable normalized configuration snapshots. The next step is a stable HTTP contract that can support the frontend without exposing persistence internals or reviving the legacy Next.js archive-streaming API.

The legacy application exposed manager archive content and filesystem-backed use-case CRUD directly. Mercure instead has an immutable PostgreSQL snapshot model with normalized Rules records.

## Decision

### Resource model

The first Rules HTTP surface is snapshot-oriented.

It exposes:

- `POST /api/v1/rules/snapshots/import` to import the configured manager archive source and persist one immutable snapshot;
- `GET /api/v1/rules/snapshots` to list snapshots newest-first;
- `GET /api/v1/rules/snapshots/:snapshotId` to retrieve snapshot metadata and aggregate statistics;
- `GET /api/v1/rules/snapshots/:snapshotId/rules` to page and filter normalized rules;
- `GET /api/v1/rules/snapshots/:snapshotId/decoders` to page and filter normalized decoders;
- `GET /api/v1/rules/snapshots/:snapshotId/issues` to page and filter validation issues.

### Query boundaries

The application layer owns snapshot-query ports and use cases. Prisma remains in Rules infrastructure. Nest controllers and transport documents live in a dedicated `rules-backend-presentation` library.

Presentation code may depend on Rules application/domain and shared platform presentation utilities, but never on Prisma.

### Pagination

Snapshot child resources use offset/limit pagination in this milestone.

Snapshots are immutable after creation, so stable ordering by snapshot-local position makes offset pagination deterministic for one snapshot. Defaults are conservative and limits are capped.

### Filters

Rules may be filtered by tenant, severity, status, use-case ID, rule ID, and Jira visibility.

Decoders may be filtered by tenant and name.

Issues may be filtered by severity and type.

Filters are exact-match in this milestone. Search semantics and full-text indexing are deferred until demonstrated product need.

### Data exposure

List/query endpoints expose normalized analysis fields and source-file names, but do not expose:

- raw XML;
- complete source XML file content;
- server filesystem source roots;
- database row positions or Prisma-specific fields.

Snapshot detail may expose immutable provenance fingerprints, import timestamps, archive/file counts, completeness, source-error count, and parser statistics.

### Import behavior

The import endpoint uses the configured manager archive source. The server chooses filesystem paths; clients cannot submit arbitrary paths.

Import is synchronous for this milestone. Background jobs/queues are deferred until archive size or latency demonstrates a need.

A successful import returns `201 Created` with the new snapshot identity and a compact snapshot summary.

### Validation and errors

Path/query inputs use the platform strict Zod validation pipeline.

Unknown snapshot IDs return `404 Not Found`.

Unexpected failures continue through the platform problem-details filter.

### Contract generation

The Nest OpenAPI document is the source of truth. Generated frontend API types remain committed and drift-checked in CI.

## Consequences

- The frontend can build against a stable Rules API without importing backend types.
- Prisma schema details remain replaceable behind application ports.
- Raw configuration content is not accidentally exposed by broad query endpoints.
- Legacy filesystem/archive streaming does not become the new product contract.
- The next milestone can build Rules frontend data-access and UI libraries against generated types.
