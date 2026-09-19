# ADR-0014: Rules intelligence foundation

- Status: Accepted
- Date: 2026-09-19
- Extends: ADR-0007, ADR-0012

## Context

The remaining high-value legacy Rules capabilities are dependency/field graphing, field intelligence, and rule quality scoring.

The legacy implementations are useful behavioral references but mix concerns:

- graph construction also owns browser-oriented coordinates, sizes, and color tones;
- rule IDs, decoder names, produced groups, and fields are matched globally, which can create false relationships when multiple manager tenants reuse names or IDs;
- quality dimension `noiseRisk` is numerically higher when noise control is healthier, making the name misleading;
- field alias health is effectively unreachable for most real fields because alias detection happens after mutually exclusive production/usage health branches.

Mercure already has an immutable snapshot-analysis source that reconstructs complete `ParsedRuleset` aggregates. Intelligence can therefore remain pure domain computation over one snapshot without adding persistence.

## Decision

### Domain capabilities

M12 adds three pure Rules domain capabilities:

1. field intelligence and lineage;
2. rule/use-case quality scoring;
3. semantic dependency graph construction.

No capability depends on NestJS, Prisma, filesystem APIs, browser APIs, React, or layout libraries.

### Tenant isolation

All rule, decoder, produced-group, and field relationships are scoped by tenant before matching.

Rule references use `tenant + rule ID`; decoder references use `tenant + decoder name`; field lineage uses `tenant + normalized field`.

Global semantic concepts such as MITRE technique IDs and use-case IDs may be represented as shared graph nodes, but they never cause rule/decoder dependency resolution across tenants.

### Field intelligence

Field intelligence preserves the legacy built-in field dictionary and risk heuristics while:

- normalizing `same_field` / `different_field` markers to the field they reference;
- excluding generic `<match>` pseudo-fields;
- producing tenant-scoped lineage;
- making alias-candidate health reachable for otherwise healthy fields where competing aliases coexist;
- reporting decoder producers, rule consumers, use cases, Jira-visible consumers, critical consumers, and decoder-direct rule links.

### Quality scoring

Quality scoring preserves the legacy scoring weights and grade thresholds where meaningful.

Every dimension is a health/readiness score from 0 to 100 where higher is better.

The legacy `noiseRisk` dimension is renamed `noiseControl` because the underlying algorithm rewards correlation and penalizes noisy single-event behavior.

Dependency, decoder, produced-field, and group checks are tenant-scoped.

Rule quality results carry tenant identity so duplicate Wazuh rule IDs from different managers remain distinct.

Use-case aggregates are tenant-scoped to avoid one manager masking another manager's weak implementation of the same use case.

### Semantic graph

The backend graph contains semantic nodes/edges and weights only.

It does not contain:

- x/y coordinates;
- viewport dimensions;
- CSS/UI color tones;
- browser layout decisions.

Frontend layout is a presentation concern and may later use layered, radial, force-directed, or other rendering without changing graph semantics.

Supported semantic graph modes remain aligned with legacy behavior: rules, decoders, decoder-to-rule, use cases, MITRE, fields, and all.

External dependency nodes are optional.

### Application boundary

M12 exposes internal application use cases that load one immutable snapshot through the existing `RulesetSnapshotAnalysisSource` and produce:

- field intelligence;
- quality summary;
- semantic graph data.

Unknown snapshots reuse `RulesetSnapshotNotFoundError`.

### Presentation

M12 does not add public intelligence HTTP endpoints or frontend visualization.

The outputs can be exposed later through bounded DTOs once payload limits, graph pagination/filtering, and UI requirements are known.

### Scope exclusions

M12 does not include:

- graph visual layout;
- graph persistence;
- quality-score persistence/history;
- public intelligence APIs;
- frontend graph/field/quality screens;
- AI-assisted recommendations;
- external MITRE enrichment.

## Consequences

- Mercure gains deterministic, testable Rules intelligence over immutable snapshots.
- Multi-manager snapshots cannot silently cross-link rule IDs, decoder names, groups, or fields.
- Frontend visualization can evolve independently from backend graph semantics.
- Quality scores have consistent directionality and stable tenant-scoped identities.
- Future API/UI work can expose bounded intelligence results without reimplementing analysis in Next.js.
