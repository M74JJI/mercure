# ADR-0006: Web platform foundation and API client contract

- Status: Accepted
- Date: 2026-09-18

## Context

Mercure needs a frontend platform foundation before product modules are migrated. The Next.js application must remain a thin composition root, platform navigation and presentation primitives must be reusable across modules, and frontend API typing must come from the NestJS OpenAPI contract rather than duplicated handwritten request/response interfaces.

## Decision

### Project boundaries

The platform frontend is split into four Nx libraries with distinct architectural responsibilities:

- `libs/platform/frontend/design-system` — `scope:platform`, `side:frontend`, `type:ui`.
- `libs/platform/frontend/navigation` — `scope:platform`, `side:frontend`, `type:util`.
- `libs/platform/frontend/api-client` — `scope:platform`, `side:frontend`, `type:data-access`.
- `libs/platform/frontend/shell` — `scope:platform`, `side:frontend`, `type:feature`.

No additional frontend library is created until it represents a real ownership, dependency, testing, or reuse boundary.

`apps/web` remains composition-only and imports the platform shell feature. Product screens will later be composed from `libs/modules/<module>/frontend/*`; they do not move into the platform shell.

### Route composition

The root Next.js layout owns document metadata and global stylesheet import only.

Authenticated/identity concerns are not introduced. The current application surface is composed through a `(platform)` route group so a future identity/public route tree can exist without forcing the application shell around every route.

The shell owns responsive navigation and application chrome. Routes own only route composition.

### Design system

The design system is implemented with React, semantic HTML, CSS custom properties, and locally-scoped CSS modules. No component framework is introduced merely for visual convenience.

Design tokens cover:

- color roles rather than page-specific colors;
- typography scale;
- spacing and radii;
- elevation/surfaces;
- focus state;
- reduced-motion behavior.

Accessibility requirements include visible keyboard focus, semantic landmarks, sufficient contrast, touch-sized interactive controls where applicable, and reduced-motion support.

### Navigation

Navigation metadata is plain TypeScript and framework-neutral. It contains stable IDs, labels, hrefs, and icon keys; React components and Next.js routing implementations do not leak into the navigation registry.

Dead navigation links are not added for modules that do not exist yet.

### API contract generation

Mercure uses:

- `openapi-typescript@7.13.0` to generate TypeScript path/component types from the NestJS OpenAPI document.
- `openapi-fetch@0.17.0` as the thin runtime client over native `fetch`.

The generated TypeScript contract is committed because it is a deterministic reviewable interface consumed by frontend source. It is generated only from the running NestJS OpenAPI document and must never be edited manually.

CI regenerates the client contract and fails on drift. This makes backend/OpenAPI changes that forget to update the frontend contract merge-blocking.

A generation tool starts the API through the repository's supported Nx execution target on an ephemeral localhost port, fetches the OpenAPI JSON, generates the TypeScript contract, and terminates the child process. A real database connection is not required merely to construct OpenAPI metadata.

### API client behavior

The API client accepts an explicit base URL and defaults to `NEXT_PUBLIC_API_BASE_URL` for application use. The base URL must be absolute HTTP(S); wildcard or relative production API origins are not accepted by the platform helper.

No authentication middleware is added. Future identity work may register auth middleware through a dedicated ADR without rewriting generated endpoint types.

The client preserves OpenAPI's typed success/error result model instead of wrapping every request in custom handwritten generics.

### Error/loading states

Global Next.js `error.tsx`, `loading.tsx`, and `not-found.tsx` remain thin composition files and delegate presentation to the platform shell/design system.

No backend error details, stack traces, or internal request data are rendered to users by default.

## Consequences

- Product frontend modules gain a stable shell and reusable visual foundation without owning platform chrome.
- The web application remains a thin deployable/composition root.
- API request/response typing is generated from one backend contract instead of duplicated manually.
- OpenAPI drift becomes a CI failure.
- The frontend remains dependency-light and can adopt product-specific UI components later without replacing its architecture.
- Authentication remains intentionally absent.
