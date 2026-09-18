# ADR-0012: Rules snapshot diff and XML round-trip analysis

- Status: Accepted
- Date: 2026-09-18
- Extends: ADR-0007, ADR-0009, ADR-0010, ADR-0011

## Context

Mercure now retains immutable Rules configuration snapshots, exposes safe normalized query APIs, and has a read-only frontend. The next migration step is configuration comparison and XML round-trip analysis.

The legacy implementation compares in-memory collections and performs raw XML analysis directly in frontend-oriented code. It also keys rules only by rule ID and decoders only by name, which is not safe for Mercure snapshots containing multiple manager tenants.

Round-trip analysis requires source XML and raw rule/decoder XML that M8 intentionally excludes from public query models.

## Decision

### Domain behavior

Rules diff and XML round-trip analysis are pure Rules domain capabilities.

Snapshot diff compares normalized records without framework, database, filesystem, or transport dependencies.

Rules are keyed by `tenant + rule ID`; decoders are keyed by `tenant + decoder name`. This prevents false matches between managers that reuse IDs or decoder names.

File comparison uses normalized source-file name and SHA-256/content metadata.

Diff results preserve added, removed, and changed records plus summary counters for Jira visibility, severity, MITRE, use-case, files, issues, and decoder changes.

### Round-trip analysis

Round-trip analysis may inspect persisted source XML and raw rule XML to:

- reconstruct source sections;
- detect commented/disabled rules;
- analyze group producer/consumer flow;
- detect source-section ID-range mismatches;
- build deterministic split-file reconstructions;
- create read-only use-case metadata patch suggestions.

Generated XML and patch suggestions are analysis artifacts only. M10 does not write modified XML back to disk, archives, Wazuh managers, or PostgreSQL.

### Application boundary

The application layer owns a `RulesetSnapshotAnalysisSource` port that reconstructs a complete immutable `ParsedRuleset` by snapshot ID.

Application use cases:

- compare two persisted snapshots;
- analyze XML round-trip behavior for one persisted snapshot.

Unknown snapshot IDs use a typed application error.

### Infrastructure

`PrismaRulesetSnapshotAnalysisSource` reconstructs the complete domain aggregate from normalized snapshot tables, including source content, raw XML, ordered child values, issues, use cases, and fixed snapshot statistics.

Prisma remains confined to Rules infrastructure.

### Security and exposure

M10 does not add public HTTP endpoints or frontend routes for raw XML, reconstructed XML, or patch suggestions.

Those artifacts can contain sensitive configuration details. Any future external exposure requires an explicit presentation/security decision and, where mutation is involved, identity/authorization policy.

### Scope exclusions

M10 does not include:

- XML write-back or deployment;
- archive mutation;
- Rules editing;
- public raw-XML download endpoints;
- diff persistence/materialization;
- frontend diff UI;
- authentication or authorization changes.

## Consequences

- Snapshot comparison is correct across multiple tenants.
- Domain diff/round-trip behavior can be tested independently of PostgreSQL.
- Persisted snapshots can be reconstructed losslessly enough for analysis without weakening M8's safe public query model.
- Future diff UI or guarded round-trip tooling can build on stable application use cases without moving raw XML into general API responses.
