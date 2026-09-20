# ADR-0019: Streaming Rules archive ingestion

- Status: Accepted
- Date: 2026-09-20
- Refines: ADR-0008

## Context

ADR-0008 intentionally avoided extracting manager archives to disk and bounded accepted XML file counts and byte sizes.

Its first infrastructure adapter used the system `tar` executable twice conceptually:

1. one archive listing pass;
2. one `tar -xO` process per accepted XML member.

That design is path-safe and memory-bounded, but the per-member process model causes avoidable CPU/process amplification because compressed archives are reopened and decompressed repeatedly. With a high configured XML-file limit, one import can therefore consume disproportionate host resources even when every individual member stays within its byte limit.

## Decision

`FilesystemManagerArchiveSource` now reads each `.tar.gz` / `.tgz` archive exactly once through:

- Node.js filesystem streaming;
- Node.js gzip decompression;
- exact-pinned `tar-stream` archive parsing.

The adapter still never writes archive members to disk.

Accepted members remain restricted to normalized top-level `rules/*.xml` and `decoders/*.xml` paths. Absolute paths, Windows drive-root paths, NUL-containing names, parent-directory traversal, duplicate normalized member identities, and non-regular accepted members are rejected or reported.

The existing limits remain authoritative:

- `RULES_ARCHIVE_MAX_FILES`;
- `RULES_ARCHIVE_MAX_ENTRY_BYTES`;
- `RULES_ARCHIVE_MAX_TOTAL_BYTES`.

Per-entry size checks use archive metadata before buffering accepted XML, and collected byte counts are verified while reading. Rejected/unrelated members are drained without being retained in memory.

Archive reads retain a fixed wall-clock timeout.

## Runtime dependency

The API runtime no longer requires an operating-system `tar` executable for Rules ingestion.

`tar-stream` is a normal exact-pinned production dependency and is included in Mercure's pruned API deployment dependency graph and security audit.

## Consequences

- each manager archive is decompressed once instead of once per accepted XML member;
- archive ingestion no longer creates one external `tar` process per XML file;
- the no-disk-extraction security property is preserved;
- supported tar metadata is handled by the library parser, including USTAR/PAX-compatible archives;
- dependency review and runtime security scanning now include the archive parser as application supply chain;
- malformed/corrupt archives remain non-fatal to unrelated manager archives.
