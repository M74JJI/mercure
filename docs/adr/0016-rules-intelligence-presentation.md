# ADR-0016: Read-only Rules intelligence presentation

- Status: Accepted
- Date: 2026-09-19
- Depends on: ADR-0015 identity/OIDC/authorization
- Internal foundations: ADR-0012, ADR-0013, ADR-0014

## Context

Mercure has completed the approved non-AI Rules migration through M12. The backend already contains deterministic application/domain capabilities for:

- immutable snapshot comparison;
- XML round-trip diagnostics;
- Rules use-case catalog reads;
- field lineage and field-health analysis;
- rule/use-case quality scoring;
- semantic Rules graph construction.

Those capabilities are intentionally internal today. The public Rules frontend exposes immutable snapshot history and snapshot rule/decoder/issue views, but not the higher-value analysis already available behind the application boundary.

ADR-0015 establishes authenticated, capability-protected product APIs. That makes it possible to expose selected read-only intelligence without introducing frontend-only authorization or mutating administration.

The presentation layer must avoid turning internal analysis results into unbounded payloads, leaking raw reconstructed XML, coupling graph layout to the backend, or creating another persistence model for deterministic data that can already be derived from immutable snapshots.

## Decision

### Scope

Mercure will expose the existing deterministic, non-AI Rules analysis capabilities through bounded NestJS read APIs and role-aware Next.js presentation.

This milestone is read-only.

All endpoints introduced by this ADR require the existing `rules:read` capability. The frontend may use the mapped role for presentation, but NestJS remains authoritative.

### Public analysis surfaces

The presentation layer may expose the following read-only resources.

#### Field intelligence

A snapshot field-intelligence endpoint exposes:

- aggregate field statistics;
- paginated field-lineage rows;
- tenant, field, canonical field, family, health, criticality and risk score;
- bounded decoder/rule/use-case references;
- alias hints.

The public DTO must support filtering by tenant and useful field attributes without changing the tenant-scoped identity semantics of the domain model.

#### Quality scoring

A snapshot quality endpoint exposes:

- aggregate quality statistics;
- paginated rule-quality rows;
- paginated use-case quality rows;
- dimensions, grade, warnings, strengths and recommendations already produced by deterministic policy.

The endpoint may filter by tenant, grade, use case or query text.

#### Semantic graph

A snapshot graph endpoint exposes semantic nodes, edges and graph statistics from the existing layout-free graph builder.

Public query validation must bound graph size more tightly than the internal domain maximum. Initial API defaults are conservative:

- default entity limit: 200;
- maximum entity limit: 500.

The API exposes semantic graph data only. Node positioning, clustering layout, zoom state and other visualization concerns remain frontend responsibilities.

Supported graph filters remain aligned with the existing domain model, including mode, tenant, use case, status, role, Jira visibility, external references and text query.

#### Snapshot comparison

A comparison endpoint exposes a structured comparison between two immutable snapshots.

The public response must separate a compact summary from bounded detail collections. A caller must not receive an arbitrarily large full-snapshot diff in one HTTP response.

The comparison keeps tenant identity in all rule/decoder keys and must not conflate equal rule IDs or decoder names belonging to different tenants.

#### XML round-trip diagnostics

The public round-trip surface exposes safe diagnostic projections only, including:

- aggregate summary;
- source-section metadata;
- group-flow status;
- bounded metadata for commented rules;
- bounded metadata describing missing use-case suggestions.

The initial public API must not return:

- reconstructed split-file XML;
- full suggested XML patches;
- raw rule XML;
- source-file contents;
- arbitrary XML snippets.

Those internal analysis values remain available to backend application code for future explicitly approved export/edit workflows.

#### Use-case catalog reads

Mercure exposes read-only use-case catalog endpoints for:

- list;
- get by ID.

System/custom origin and catalog metadata may be presented where already available in the canonical domain model.

The existing create/update/delete application use cases remain internal. Public use-case mutation requires a separate administration decision and mutating capability.

### API organization

The exact Nest controller split may evolve during implementation, but public paths remain under the versioned Rules API and use resource-oriented naming.

Expected resources are equivalent to:

- `GET /api/v1/rules/snapshots/{snapshotId}/intelligence/fields`;
- `GET /api/v1/rules/snapshots/{snapshotId}/intelligence/quality`;
- `GET /api/v1/rules/snapshots/{snapshotId}/intelligence/graph`;
- `GET /api/v1/rules/snapshots/compare`;
- `GET /api/v1/rules/snapshots/{snapshotId}/roundtrip`;
- `GET /api/v1/rules/use-cases`;
- `GET /api/v1/rules/use-cases/{useCaseId}`.

Controllers translate HTTP validation/pagination concerns only. Existing application use cases remain transport-independent.

### Bounded responses

Any collection exposed by this milestone must have deterministic ordering and an explicit public bound.

Pagination DTOs use the existing Rules API conventions where practical. Presentation code may project an internal analysis object into multiple separately paginated collections rather than returning the entire internal object.

A request exceeding a public maximum is rejected or normalized through typed validation; it must not silently trigger an unbounded response.

### Persistence and computation

No new database tables, cache service or background worker are introduced for these deterministic projections.

Analysis is computed from the canonical immutable snapshot through the existing `RulesetSnapshotAnalysisSource` and use-case catalog infrastructure.

If production evidence later shows unacceptable latency, caching or persisted derived views require measurement and a separate bounded design decision.

### Frontend presentation

The Rules frontend will present these capabilities as progressive read-only views rather than recreating the legacy monolithic Rules Hub.

Expected composition includes:

- snapshot quality;
- field intelligence;
- semantic graph;
- snapshot comparison;
- diagnostic/round-trip summary;
- read-only use-case catalog.

The UI must preserve current platform design-system, responsive and accessibility requirements.

Large tables use pagination/filtering. Graph visualization receives semantic nodes/edges and owns layout entirely in the frontend.

### Security and data handling

- All new product routes require `rules:read`.
- No route becomes anonymous.
- No mutation is introduced.
- No raw Keycloak token/session data enters Rules DTOs.
- No raw/reconstructed XML is exposed by this milestone.
- Application errors are translated without leaking filesystem paths or source contents.
- Existing tenant-safe semantic keys are preserved.

This ADR does not introduce tenant-level authorization. A mapped Mercure user with `rules:read` retains the current platform-wide Rules read scope. Per-tenant access control requires a separate identity/authorization decision.

### Testing

Implementation must add deterministic coverage for:

- authentication and `rules:read` enforcement on every new route;
- 404 behavior for missing snapshots/use cases;
- query validation and public response limits;
- stable pagination/order;
- tenant-safe field, quality, graph and diff projections;
- graph mode/filter behavior;
- safe round-trip projection proving raw/suggested XML is absent;
- API-client regeneration;
- frontend loading, empty, unavailable, forbidden and not-found states;
- representative responsive/accessibility behavior for tables and graph controls.

Fixtures remain local and deterministic. No live Keycloak or external AI service is required by these tests.

## Consequences

- Mercure exposes the value of M10-M12 without duplicating analysis logic.
- The frontend gains richer investigation workflows while remaining read-only.
- API responses are purpose-built and bounded instead of serializing internal analysis objects wholesale.
- XML reconstruction remains an internal backend capability until an explicit export/edit workflow is approved.
- The semantic graph stays portable because visualization layout remains outside the backend.
- Identity/RBAC from ADR-0015 becomes the mandatory access boundary for the new product routes.

## Deferred

This ADR does not approve:

- Rules import UI;
- use-case create/update/delete APIs or UI;
- rule/decoder editing;
- XML download/export or patch application;
- raw source-file browsing;
- approval/publishing workflows;
- tenant-level RBAC;
- AI-assisted analysis, generation or remediation;
- persistence/caching of derived intelligence.

Each mutating or AI-assisted capability requires a separate concrete product/security decision.
