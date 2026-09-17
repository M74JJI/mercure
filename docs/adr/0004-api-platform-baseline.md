# ADR-0004: API platform baseline

- Status: Accepted
- Date: 2026-09-17

## Context

Mercure needs one production-grade NestJS API foundation before product modules are migrated. Cross-cutting HTTP, configuration, logging, validation, error, health, and API-description behavior must be consistent and must not accumulate inside `apps/api` or individual product modules.

## Decision

### Composition and ownership

`apps/api` remains a thin deployable composition root. Cross-cutting backend behavior lives under `libs/platform/backend/` and is composed through a `type:feature` platform entrypoint that the API application is allowed to import.

The initial backend platform is split only where the boundary has architectural value:

- `feature`: NestJS composition and application bootstrap entrypoint.
- `config`: typed, fail-fast environment configuration.
- `logging`: structured request/application logging and redaction policy.
- `http`: Fastify-specific HTTP/security/bootstrap infrastructure.
- `presentation`: transport concerns such as health endpoints and the global problem-details exception filter.

These are platform libraries, not independent services or deployables.

### HTTP runtime

- NestJS remains the sole backend framework.
- Fastify remains the sole HTTP adapter.
- The public API prefix is `/api/v1`.
- JSON request bodies are globally size-limited; large archive/file ingestion will use explicit route-specific upload limits later rather than increasing the global body limit.
- CORS is allowlist-only. Wildcard origin reflection is not accepted as a production default.
- Security headers are provided by Fastify Helmet.
- Proxy trust is disabled unless deployment architecture explicitly enables it.
- Graceful shutdown hooks are enabled.

### Configuration

Environment input is untrusted configuration and is validated at process startup. Invalid or missing required values abort startup before the server listens. Configuration access is typed and centralized; arbitrary `process.env` reads outside the configuration platform are prohibited.

### Logging and request identity

Pino is the structured logging implementation through `nestjs-pino`. Logs are JSON by default. Credentials, authorization headers, cookies, tokens, secrets, and common credential-shaped request fields are redacted before serialization.

Every request receives a server-generated UUID request ID. Client-provided request IDs are not trusted as the canonical ID. The ID is returned in `x-request-id` and is included in request-scoped logs and error responses.

### Validation and errors

Zod is the schema language for HTTP DTO validation and configuration validation. Nest transport DTOs use the Nest/Zod integration rather than introducing parallel class-validator schemas.

HTTP errors use an RFC 9457-style `application/problem+json` envelope extended with stable Mercure `code` and `requestId` fields. Unexpected errors do not expose stack traces or internal exception details to clients.

### Health

The API exposes:

- `GET /api/v1/health/live` for process liveness.
- `GET /api/v1/health/ready` for readiness.

The readiness contract is intentionally extensible. PostgreSQL readiness is added when the database platform is introduced; product modules do not create competing health routes.

### OpenAPI

NestJS OpenAPI is the canonical HTTP contract source. In environments where documentation is enabled:

- Swagger UI is served at `/api/docs`.
- The machine-readable document is served at `/api/openapi.json`.

The document is later used to generate the frontend API client; handwritten duplicate request/response contracts are not the long-term integration model.

### Build

The NestJS application uses Nx esbuild for the Node production artifact. Internal workspace libraries are bundled into the API artifact while runtime third-party packages remain external. Type checking remains a separate blocking task; bundling never replaces TypeScript validation.

## Consequences

- Product modules receive one consistent production runtime and cannot invent competing bootstrap conventions.
- `apps/api` stays small even as the platform grows.
- Server logs, request IDs, errors, validation, health, and API documentation are uniform from the first product endpoint.
- New cross-cutting behavior is added to the platform layer rather than copied into feature modules.
- Authentication and authorization remain intentionally out of scope for this baseline.
