# ADR-0009: Immutable Rules configuration snapshots

- Status: Accepted
- Date: 2026-09-18
- Extends: ADR-0005 and ADR-0008

## Context

The Rules parser and manager-archive source now produce a normalized configuration analysis, but the result is ephemeral. Mercure needs durable configuration history before it exposes query/import APIs or builds frontend workflows.

Persistence must preserve enough information to reconstruct an imported configuration, compare snapshots later, and trace findings back to their exact source XML without leaking Prisma into the Rules domain or application layers.

Archive metadata alone is not a content identity: archive timestamps, names, or sizes can change independently of configuration content, and identical metadata does not prove identical bytes.

## Decision

### Snapshot semantics

Each successful persistence operation creates a new immutable Rules configuration snapshot.

Snapshots are observations, not mutable "current state" rows. Importing identical content again creates a new snapshot so Mercure does not lose observation history.

Each snapshot stores two fingerprints:

- `source_fingerprint`: provenance fingerprint supplied by the archive source;
- `content_fingerprint`: SHA-256 over a deterministic ordering of normalized source-file identity and hashes.

Fingerprints are indexed for comparison and lookup but are not unique constraints.

### Application boundary

The Rules application layer owns a `RulesetSnapshotStore` port and a `PersistImportedRuleset` use case.

`PersistImportedRuleset` performs archive loading/parsing first and only then asks the store to persist the finished aggregate. Long-running archive parsing therefore occurs outside the database transaction.

The store contract requires the infrastructure implementation to persist one snapshot atomically.

### Relational model

The persisted aggregate is normalized into dedicated PostgreSQL tables for:

- snapshots and fixed parser statistics;
- source archives;
- source XML files including content and SHA-256;
- rules;
- ordered rule groups, MITRE IDs, dependencies, fields, decoded-as values, and options;
- decoders;
- ordered decoder prematches, regex values, and order fields;
- validation issues;
- active use-case records.

Searchable business fields remain relational. Source XML and raw rule/decoder XML are stored as `text` provenance, not JSONB.

Ordered child values use snapshot-local integer positions and composite keys. They are value rows inside an immutable aggregate, not independently addressable entities, so they do not receive artificial UUIDs.

The snapshot itself uses a database-generated UUID.

### Referential integrity and deletion

Source files are the parent records for parsed rules and decoders. Snapshot-owned rows use foreign keys.

Cascade deletion is deliberately limited to deleting an entire immutable snapshot aggregate. This is an ownership lifecycle rule, not a general platform cascade convention.

No application workflow for deleting snapshots is introduced in this milestone.

### Transaction boundary

`PrismaRulesetSnapshotStore` performs one short PostgreSQL transaction containing only database writes.

Archive discovery, decompression, XML parsing, hashing of source files, and external I/O complete before the transaction starts.

Bulk `createMany` operations are used for normalized child records. Snapshot-local positions make all relation keys known after the database creates the snapshot UUID, avoiding client-generated entity UUIDs solely for batching.

### Query posture

This milestone creates indexes for demonstrated upcoming access paths:

- snapshot creation time;
- source and content fingerprint lookup;
- rule ID, tenant, severity, status, and use-case within a snapshot;
- decoder name and tenant within a snapshot;
- source-file tenant/type/hash;
- validation severity/type.

It does not add speculative full-text indexes or search infrastructure.

### Scope

This milestone adds durable persistence and database integration validation only.

It does not add:

- public Rules HTTP endpoints;
- mutable "current configuration" pointers;
- retention/deletion workflows;
- background imports or queues;
- frontend Rules screens;
- diff materialization;
- use-case catalog ownership;
- authentication or authorization changes.

## Consequences

- Mercure can retain an auditable history of Rules configurations without mutating prior observations.
- Future diff/query APIs can operate on stable snapshot IDs and content fingerprints.
- The normalized schema can answer common filters without decoding JSONB.
- Raw/source XML remains available for later round-trip and forensic provenance work.
- Persistence stays replaceable behind an application port and Prisma remains confined to backend infrastructure.
