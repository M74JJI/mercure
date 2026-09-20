# ADR-0016: Controlled Rules authoring and export boundary

- Status: Accepted
- Date: 2026-09-20
- Supersedes: none
- Related: ADR-0012, ADR-0015

## Context

Mercure can now import immutable Rules snapshots, inspect normalized rules and decoders, compare snapshots, calculate deterministic intelligence, administer the canonical use-case catalog, and enforce Keycloak-backed capabilities at the NestJS boundary.

The next high-value capability is authoring. This is materially different from read-only analysis: a malformed or unauthorized change can weaken detections, create alert floods, break decoder chains, or affect multiple Wazuh managers. The legacy system contains XML round-trip helpers and source material, but Mercure must not turn those internals into an unrestricted filesystem editor.

Authoring therefore needs an explicit product and security boundary before any public mutation API is introduced.

## Decision

### Workflow

Mercure will implement authoring as a controlled state machine:

1. **draft** — an admin creates a working copy from an immutable snapshot source file or creates a new bounded XML source;
2. **validate** — Mercure analyzes the exact draft content with the existing Wazuh parser and the current canonical use-case catalog;
3. **approve** — an admin explicitly approves the exact validated revision;
4. **export** — Mercure produces the approved artifact for an operator or external deployment system.

Editing an approved draft creates a new revision and returns it to **draft**. Validation never implies approval.

### No direct manager writes

This boundary does **not** write to:

- Wazuh manager rules or decoder directories;
- manager archive directories;
- SSH/SFTP destinations;
- Wazuh APIs;
- Git repositories;
- production deployment pipelines.

Mercure is the authoring, validation and approval system. Deployment remains a separate operational action until a dedicated deployment ADR defines trust, rollback, target selection and change-control requirements.

### Authorization

All draft mutation, validation, approval and export APIs require `rules:admin`.

Read-only snapshot APIs remain `rules:read`.

Frontend visibility is convenience only; NestJS remains the authoritative authorization boundary.

### Persistence and provenance

Drafts are PostgreSQL-backed and application-owned. Each draft records at minimum:

- stable draft UUID;
- source snapshot ID when cloned;
- source file position/name/tenant/type when cloned;
- current revision number;
- state;
- current XML content and SHA-256 fingerprint;
- creator and last editor subject;
- created/updated timestamps;
- last validation metadata;
- approver and approval timestamp for the approved revision.

An append-only draft event history records creation, edits, validation and approval transitions with actor subject, revision and timestamp.

Immutable imported snapshots are never modified by authoring.

### Optimistic concurrency

Draft updates require the caller's expected revision. A stale revision is rejected with conflict rather than silently overwriting another administrator's work.

Every successful content edit increments the revision, clears prior approval, and invalidates validation for the older content.

### Validation

Validation reuses Mercure's existing deterministic `AnalyzeRuleset` path. The server does not trust browser-side XML checks.

Before record analysis, the deterministic analyzer validates XML-fragment structure. It accepts Wazuh's legitimate multi-root decoder fragments but reports malformed/unclosed markup, invalid or duplicated attributes, unescaped entities, invalid comments/CDATA/processing instructions, and declaration markup such as `DOCTYPE` as error-severity findings. A file can therefore not become approvable merely because regex extraction still finds a rule or decoder inside malformed surrounding XML.

Validation operates on the exact persisted revision and stores a bounded summary plus the validated content fingerprint. Approval is allowed only when:

- the draft still matches the validated revision and fingerprint;
- parser analysis completed;
- validation contains no error-severity findings.

Warnings may be approved deliberately; they remain visible in the validation summary.

### XML exposure

Draft XML is sensitive configuration data. It is exposed only through authenticated `rules:admin` endpoints and must never appear in logs, error payloads, telemetry attributes or unauthenticated pages.

Snapshot raw XML remains private under the existing read-only APIs. Cloning from a snapshot happens server-side.

### Input limits

Draft XML has an explicit bounded maximum size. The limit is enforced before persistence and validation.

File names are logical names, not arbitrary filesystem paths. Path traversal, absolute paths, NUL bytes and control characters are rejected.

Source type is constrained to the existing Rules source types.

### Export

Only an approved, unchanged revision may be exported.

The export response includes:

- logical file name;
- source type;
- XML content;
- SHA-256 fingerprint;
- draft ID and revision.

The web application proxies approved export server-side so Keycloak bearer tokens remain out of browser JavaScript.

Export is not deployment and does not mutate the source snapshot or any manager.

### Audit logging

Controllers emit structured mutation events with actor subject, draft ID, revision, operation and outcome. XML content, tokens and sensitive source bodies are never logged.

Database event history provides durable product-level provenance; structured logs provide operational observability.

### Deletion

Initial authoring does not hard-delete drafts. Abandonment, retention and administrative deletion require an explicit lifecycle/retention decision. This avoids losing approval evidence while the feature is new.

### AI

AI-generated rule or decoder content remains excluded. If AI assistance is introduced later, it must create or propose drafts and can never bypass deterministic validation or human approval.

## Consequences

- Mercure can support practical rule/decoder authoring without becoming an uncontrolled production configuration writer.
- Imported snapshots remain immutable evidence.
- Exact revision/fingerprint checks prevent approving content different from what was validated.
- Admin authorization, bounded XML exposure and append-only history create a defensible audit trail.
- Deployment automation can be added later behind a separate adapter and ADR without weakening the authoring model.
- The model supports future pull-request/GitOps export because export is separated from authoring state.

## Deferred

This ADR does not approve:

- direct Wazuh manager deployment;
- SSH/SFTP write-back;
- manager archive mutation;
- Git push or pull-request creation;
- automatic approval;
- AI-generated changes;
- multi-person mandatory approval/quorum;
- retention/deletion policy;
- tenant-specific approval policy;
- scheduled rollout or rollback automation.

Those require concrete operational requirements and separate decisions.
