# ADR-0011: Rules frontend foundation

- Status: Accepted
- Date: 2026-09-18
- Extends: ADR-0006, ADR-0010

## Context

M8 established a stable snapshot-oriented Rules HTTP contract and committed generated frontend types. The next milestone is the first product frontend for Rules without collapsing domain-specific UI, API access, and Next.js routing into `apps/web` or the platform shell.

## Decision

### Library boundaries

M9 introduces three Rules frontend libraries:

- `rules-frontend-data-access` — typed access to the generated Mercure API contract;
- `rules-frontend-ui` — presentational Rules components with no network access;
- `rules-frontend-feature` — async feature composition that joins Rules data access and UI.

`apps/web` remains a thin composition root and imports only the Rules feature library.

### Initial routes

The first Rules frontend exposes:

- `/rules` — immutable snapshot history and aggregate health/status;
- `/rules/[snapshotId]` — one snapshot summary plus bounded previews of normalized rules, decoders, and validation issues.

The routes are dynamically rendered so production builds do not require a reachable API.

### Data access

Rules data access uses `@mercure/platform-frontend-api-client` and the generated OpenAPI types. It does not duplicate backend DTO interfaces by hand.

Data-access methods:

- list snapshots;
- get one snapshot;
- list snapshot rules;
- list snapshot decoders;
- list snapshot issues.

The adapter normalizes transport failures into a frontend-safe error type. `404` for snapshot detail returns `null` so the feature can render a stable not-found state without exposing transport internals.

### UI and presentation

Rules UI components receive already-loaded data through props. They do not create API clients, read environment variables, or depend on Next.js routing internals.

The feature layer may compose platform design-system primitives and Rules UI components. Product-specific styles live with the Rules frontend libraries rather than in the platform design system.

### Mutation scope

M9 is read-only.

The existing snapshot import endpoint is intentionally not surfaced as a UI control until identity/authorization and mutation policy are defined. This avoids introducing unauthenticated state-changing controls into the first product frontend.

### Navigation

The platform navigation gains a `Rules` destination at `/rules`. This is navigation metadata only; the platform shell does not import the Rules module.

### Pagination

The overview requests the newest 25 snapshots.

Snapshot detail requests bounded first-page previews:

- up to 50 rules;
- up to 30 decoders;
- up to 30 validation issues.

Interactive pagination/filtering is deferred to the next Rules UI iteration once the read-only foundation is proven.

### Error behavior

Feature components render explicit API-unavailable states for expected transport failures. Unexpected programming errors are allowed to reach the existing application error boundary.

## Consequences

- Product frontend code obeys the same domain-first boundaries as the backend.
- `apps/web` stays composition-only.
- Generated OpenAPI types remain the contract source of truth.
- Builds remain independent of API availability.
- The first Rules UI is useful for SOC inspection without prematurely adding mutation or auth behavior.
- Later filtering, pagination, import controls, diffing, and editing can build on these libraries without reworking the architecture.
