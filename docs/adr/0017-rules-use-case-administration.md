# ADR-0017: Custom Rules use-case administration

- Status: Accepted
- Date: 2026-09-19
- Depends on: ADR-0013, ADR-0015
- Presentation dependency: ADR-0016

## Context

ADR-0013 established PostgreSQL as the canonical Rules use-case catalog and intentionally kept create/update/delete application use cases internal until Mercure had a real identity and authorization boundary.

ADR-0015 now defines that boundary:

- Keycloak is the external identity provider;
- NestJS is the authoritative authorization boundary;
- product APIs are protected by default;
- Rules reads require `rules:read`;
- mutating Rules administration requires `rules:admin`.

ADR-0016 exposes the catalog as a bounded read-only product surface.

The backend already contains transport-independent application use cases for creating, updating and deleting custom catalog entries. Exposing those operations must not weaken the immutable-snapshot model, permit system catalog mutation, accept spoofed actor identity from request bodies, or move bearer tokens into the browser.

## Decision

### Scope

Mercure will expose administration for **custom Rules use-case catalog entries only**.

The milestone includes:

- create custom use case;
- update custom use case;
- delete custom use case;
- role-aware frontend administration for those operations.

The existing list/detail surfaces remain readable with `rules:read`.

Every mutating API introduced by this ADR requires `rules:admin`.

### Resource policy

System catalog entries remain immutable through public administration.

A caller may:

- read system entries;
- read custom entries;
- create a new custom entry;
- fully replace editable metadata on an existing custom entry;
- delete an existing custom entry.

A caller may not:

- convert a system entry to custom;
- convert a custom entry to system;
- change the stable use-case ID during update;
- set creation timestamps;
- set update timestamps;
- set `source`;
- set creator identity.

Historical snapshot-local use-case rows remain immutable. Catalog update or deletion never rewrites old snapshots.

### Actor attribution

The create request body does **not** contain `createdBy`.

NestJS derives the actor from the authenticated `MercurePrincipal`.

The canonical creator identifier stored for a newly created custom use case is the authenticated principal subject. A display username may be used in UI/audit presentation but is not trusted as the stable creator identity.

A request body attempting to supply `createdBy`, `source`, `createdAt`, `updatedAt`, roles, capabilities, or other server-owned fields is rejected by strict DTO validation rather than silently accepted.

### API contract

Public administration uses resource-oriented endpoints under the existing versioned Rules API.

Expected operations are equivalent to:

- `POST /api/v1/rules/use-cases`;
- `PUT /api/v1/rules/use-cases/{useCaseId}`;
- `DELETE /api/v1/rules/use-cases/{useCaseId}`.

Create uses a caller-supplied stable ID because ADR-0013 already defines use-case IDs as business identifiers.

Update is a full editable-metadata replacement rather than an ambiguous partial patch. The path ID is authoritative and is not duplicated as an independently mutable body field.

Delete returns no resource body.

### HTTP outcomes

Presentation translates the existing application/domain outcomes consistently:

- successful create: `201 Created`;
- successful update: `200 OK`;
- successful delete: `204 No Content`;
- malformed/bounded-input validation failure: `400 Bad Request`;
- missing catalog entry: `404 Not Found`;
- duplicate ID on create: `409 Conflict`;
- attempt to update/delete a system entry: `409 Conflict`;
- authenticated principal without `rules:admin`: `403 Forbidden`;
- unauthenticated request: `401 Unauthorized`.

No application error exposes database details, filesystem paths, tokens or internal stack traces.

### Input bounds

Presentation DTOs are strict and bounded before invoking application logic.

Initial public limits are:

- ID: existing canonical `uc_[a-z0-9_]+` rule, maximum 255 characters;
- name: 255 characters;
- short name: 120 characters;
- description: 4,096 characters;
- component: 255 characters;
- vendor: 255 characters;
- product: 255 characters;
- domain: 255 characters;
- category: 255 characters.

All text remains required and is trimmed by the application boundary.

These limits are transport-abuse bounds; they do not move business normalization out of the application layer.

### Frontend mutation boundary

The browser continues to receive no Keycloak bearer token.

Administration is implemented through authenticated Next.js server-side mutation actions. Those actions obtain the current server session and call NestJS through the existing authenticated server fetch adapter.

Management controls may be hidden for non-admin presentation roles, but UI visibility is never treated as authorization. NestJS `rules:admin` checks remain authoritative.

The frontend provides:

- create form;
- edit form for custom entries;
- explicit immutable state for system entries;
- destructive confirmation before delete;
- field-level validation feedback;
- duplicate/protected/not-found conflict feedback;
- successful mutation redirect back to a stable read/detail surface.

### Delete consequences

Deleting a custom catalog entry removes it only from the current canonical catalog.

It does not delete or rewrite immutable historical snapshots.

A future import that references a deleted catalog entry is analyzed against the then-current catalog and may surface missing/unassigned use-case findings according to existing Rules analysis policy.

The UI must state this consequence before destructive confirmation.

### Audit behavior

Every public catalog mutation must produce a structured application log event containing, at minimum:

- authenticated principal subject;
- operation: create, update or delete;
- use-case ID;
- success/failure outcome.

The audit event must not include access tokens, refresh tokens, cookies, authorization headers or other secrets.

This milestone does not add a new audit database/event-sourcing subsystem. If durable compliance-grade audit retention is required, that becomes a dedicated platform decision.

### Concurrency

Catalog administration is expected to be low-volume operator metadata management.

This milestone retains the existing full-replacement, last-write-wins update behavior and does not expose `updated_at` as a public concurrency token.

If concurrent administration becomes an operational problem, optimistic concurrency/versioning requires a separate measured change rather than leaking persistence timestamps into the current domain solely for speculative concurrency.

### Testing

Implementation must include deterministic coverage for:

- `rules:admin` required on every mutating endpoint;
- a `rules:read`-only principal receiving 403 for create/update/delete;
- creator identity derived from authenticated principal rather than request input;
- strict rejection of server-owned/spoofed fields;
- create success and duplicate-ID conflict;
- update success;
- delete success;
- missing-entry 404;
- system-entry update/delete conflict;
- bounded DTO validation;
- no mutation of immutable snapshot rows;
- frontend create/edit/delete server-action paths;
- frontend system-entry immutable state;
- destructive confirmation behavior;
- 401/403 redirects and stable post-mutation navigation.

Tests remain local/deterministic and do not require live Keycloak.

## Consequences

- Mercure gains the first deliberately bounded public Rules administration workflow.
- The existing catalog persistence and application use cases are reused instead of duplicated.
- Creator attribution becomes trustworthy because it is derived from authenticated identity.
- System use cases remain protected.
- Historical snapshots remain immutable.
- The browser still never handles API bearer tokens.
- Rules administration capability becomes meaningfully distinct from ordinary Rules read access.

## Deferred

This ADR does not approve:

- rule creation/editing/deletion;
- decoder creation/editing/deletion;
- direct manager filesystem writes;
- XML source editing;
- XML patch application;
- snapshot mutation;
- import/publish approval workflows;
- tenant-level RBAC;
- bulk catalog mutation;
- durable audit-event persistence;
- AI-assisted generation or remediation.

Those require separate product/security decisions.
