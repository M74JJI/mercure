# Dependency release-age exceptions

Mercure applies a seven-day minimum release age to npm dependencies. An exception is permitted only when delaying adoption creates a greater, documented security or compatibility risk than installing the young release.

## Active exceptions

### NestJS 11.2.5 security patch family

- Added: 2026-09-17
- Packages: `@nestjs/common@11.2.5`, `@nestjs/core@11.2.5`, `@nestjs/platform-fastify@11.2.5`
- Required transitive patch package: `@fastify/middie@9.3.4`
- Reason: NestJS security advisory GHSA-9c5c-9qcx-q35q affects `@nestjs/platform-fastify` versions earlier than 11.2.4 and documents 11.2.5 as the recommended 11.x upgrade. The vulnerability can bypass path-scoped middleware when absolute-form request targets are used.
- Review: remove these entries from `minimumReleaseAgeExclude` after the versions have aged past the workspace threshold and the lockfile has been regenerated successfully.

### Fastify 5.12.5 security release

- Added: 2026-09-17
- Package: `fastify@5.12.5`
- Reason: Fastify advisory GHSA-4mh8-r7rc-xpvc affects versions earlier than 5.12.5 and can terminate an HTTP/2 server through an uncaught exception when response trailers are used. Fastify 5.12.5 is the patched release. It also remains above the 5.12.2 floor that fixes the high-severity header-validation bypass GHSA-9q9j-q6p8-xq58.
- Resolution policy: `pnpm-workspace.yaml` overrides Fastify to this exact version so NestJS and all Fastify plugins use one patched runtime/type version rather than retaining Nest's older transitive 5.x patch.
- Review: remove the release-age exception after 5.12.5 has aged past the workspace threshold. Keep or update the single-version override until the selected NestJS release resolves an equally patched Fastify version by default.

Exceptions are exact-version scoped. Do not replace them with broad package-name or namespace exclusions.
