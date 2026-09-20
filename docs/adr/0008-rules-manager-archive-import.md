# ADR-0008: Rules manager archive import

- Status: Accepted
- Date: 2026-09-18
- Supersedes: no prior ADR
- Extends: ADR-0007
- Refined by: ADR-0019

## Context

ADR-0007 established a framework-independent Rules parser core and deferred source ingestion until the parser contract was stable.

The next migration step is to ingest Wazuh manager archive files from a configured server directory and pass their XML content into the existing `AnalyzeRuleset` application use case.

The legacy implementation extracts selected archive members into a temporary directory before reading them. Mercure should preserve the useful archive-discovery behavior without copying filesystem-extraction risks or coupling the application layer to `tar`, Node filesystem APIs, or a fixed storage source.

## Decision

### Application boundary

The Rules application layer owns:

- `RulesetArchiveSource`, a source port that returns normalized archive metadata and source-file inputs;
- `ImportArchivedRuleset`, which loads one archive snapshot and delegates parsing to `AnalyzeRuleset`;
- source-independent result metadata such as archive summaries, fingerprint, load time, and non-fatal source errors.

The application layer does not know about filesystem paths beyond an opaque source-root string and does not invoke operating-system commands.

### Infrastructure adapter

`FilesystemManagerArchiveSource` is the first implementation of `RulesetArchiveSource`.

It:

- discovers only regular `.tar.gz` and `.tgz` files in the configured manager archive directory;
- lists members using the system `tar` executable with argument-array spawning, never shell interpolation;
- accepts only normalized `rules/*.xml` and `decoders/*.xml` members;
- rejects absolute paths, Windows drive-root paths, NUL-containing names, and `..` path segments;
- rejects duplicate accepted XML member identities;
- preserves the archive's exact member name for reads while exposing a normalized Mercure source path;
- reads accepted members through `tar -xO` directly to bounded stdout;
- never extracts archive contents into a temporary or persistent directory;
- reports archive/member failures as source errors so one damaged archive does not crash unrelated ingestion.

### Resource limits

Archive ingestion is bounded by typed startup configuration:

- `RULES_ARCHIVE_MAX_FILES`;
- `RULES_ARCHIVE_MAX_ENTRY_BYTES`;
- `RULES_ARCHIVE_MAX_TOTAL_BYTES`.

These limits protect the API process from excessive file-count and decompression-output memory use. Defaults are deliberately conservative and can be adjusted through validated configuration.

The archive listing itself also has a fixed stdout bound.

### Configuration

The configured archive root is `RULES_MANAGER_ARCHIVE_DIR`.

Rules infrastructure does not read `process.env` directly. The Nest feature composes the adapter from `PlatformConfig`, preserving the platform rule that environment input is parsed and validated centrally.

### Runtime dependency

The filesystem adapter requires a compatible `tar` executable on the API host/container. A missing or failing executable is surfaced as an archive-source error.

No additional JavaScript archive dependency is introduced in this milestone.

### Scope

This milestone adds source ingestion and application orchestration only.

It does not add:

- Rules persistence;
- immutable database snapshots;
- public HTTP import/query endpoints;
- background jobs or queues;
- frontend Rules workflows;
- authentication or authorization changes;
- archive uploads;
- S3, SFTP, or Wazuh API source adapters.

Those concerns remain later milestones.

## Consequences

- Archive parsing reuses the already-tested Rules parser instead of duplicating parsing logic.
- The source port can later be implemented by S3, SFTP, uploads, or Wazuh APIs without changing `ImportArchivedRuleset`.
- Archive path traversal and symlink extraction risks are reduced because Mercure writes no archive members to disk.
- Memory and file-count exposure are explicitly bounded.
- Runtime environments that use the filesystem adapter must provide `tar`.
