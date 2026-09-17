# Dependency release-age exceptions

Mercure applies a seven-day minimum release age to npm dependencies. An exception is permitted only when delaying adoption creates a greater, documented security or compatibility risk than installing the young release.

## Active exceptions

### NestJS 11.2.5 security patch family

- Added: 2026-09-17
- Packages: `@nestjs/common@11.2.5`, `@nestjs/core@11.2.5`, `@nestjs/platform-fastify@11.2.5`
- Required transitive patch packages: `@fastify/middie@9.3.4`, `fastify@5.12.4`
- Reason: NestJS security advisory GHSA-9c5c-9qcx-q35q affects `@nestjs/platform-fastify` versions earlier than 11.2.4 and documents 11.2.5 as the recommended 11.x upgrade. The vulnerability can bypass path-scoped middleware when absolute-form request targets are used.
- Review: remove these entries from `minimumReleaseAgeExclude` after the versions have aged past the workspace threshold and the lockfile has been regenerated successfully.

Exceptions are exact-version scoped. Do not replace them with broad package-name or namespace exclusions.
