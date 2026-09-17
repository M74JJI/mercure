# ADR-0003: Nx project boundaries

- Status: Accepted
- Date: 2026-09-17

## Context

Mercure will contain many product modules while deploying only one Next.js frontend and one NestJS backend. Folder conventions alone are insufficient because they decay as a repository grows. The workspace therefore needs machine-enforced dependency rules.

## Decision

Every Nx project carries three independent tag dimensions:

- `scope:*` identifies ownership or bounded context, for example `scope:rules`, `scope:platform`, `scope:shared`, and the deployable-only `scope:composition`.
- `side:*` identifies runtime side: `side:frontend`, `side:backend`, or `side:neutral`.
- `type:*` identifies architectural role: `type:app`, `type:feature`, `type:presentation`, `type:application`, `type:domain`, `type:infrastructure`, `type:data-access`, `type:ui`, or `type:util`.

The deployable applications use `scope:composition`; they are not platform libraries. This allows them to compose approved top-level feature modules from many product scopes without giving platform libraries permission to depend on product modules.

### Side rules

- Frontend projects may depend only on frontend or neutral workspace projects and cannot import NestJS, Prisma, Fastify, or PostgreSQL client packages.
- Backend projects may depend only on backend or neutral workspace projects and cannot import Next.js or React runtime packages.
- Neutral projects may depend only on neutral workspace projects.

### Scope rules

- Shared projects may depend only on shared projects.
- Platform projects may depend only on platform or shared projects.
- A product module may depend on itself, platform, and shared projects. Cross-module internal imports are prohibited. Each newly introduced module scope must add an explicit constraint.
- Composition roots are intentionally not scope-restricted; their `type:app` and `side:*` constraints remain restrictive.

### Type rules

- Apps may import feature entrypoints only.
- Features are composition libraries and may wire the layers valid for their side.
- Presentation depends inward on application/domain/util.
- Application depends on application/domain/util.
- Domain depends only on domain/util and may not import external npm packages.
- Infrastructure may implement application/domain ports and use infrastructure-specific dependencies.
- Frontend data-access and UI stay separated; UI cannot reach data-access.
- Utility libraries remain dependency-light and framework-independent.

Nx's `@nx/enforce-module-boundaries` rule is blocking in lint and CI. The boundary model is a security and maintainability invariant, not guidance.

## Consequences

Illegal dependencies fail before merge. New module scaffolding must apply the tag taxonomy automatically. An exception that changes dependency direction requires an ADR rather than an ESLint disable.
