# Add a Mercure module

This guide is the canonical implementation path for a new Mercure product capability. It keeps the Next.js and NestJS applications thin, preserves module boundaries, and gives every module the same entry points.

Prepare a workstation once with `pnpm dev:setup`, then run the API and web application together with `pnpm dev`.

## 1. Generate the module

Choose a durable product capability name in kebab case. Do not use a screen name, implementation technology, client name, or temporary project code.

Preview without writing:

```bash
pnpm module:new client-inventory --dry-run
```

Create the module:

```bash
pnpm module:new client-inventory
pnpm install --frozen-lockfile=false
pnpm format:write
```

The generator fails before writing when the module, route, or required composition marker already exists. It validates names and rolls back generated output when a write fails.

## 2. Understand the generated structure

```text
libs/modules/client-inventory/
├── backend/
│   ├── domain/          # Framework-independent business types and rules
│   ├── application/     # Use cases and ports
│   ├── presentation/    # HTTP controllers and DTO boundaries
│   └── feature/         # NestJS composition for this module
└── frontend/
    ├── data-access/     # API calls, query mapping, client-side data contracts
    ├── ui/              # Module-specific presentational components
    └── feature/         # Page-level orchestration and server/client boundaries

apps/web/src/app/(platform)/client-inventory/page.tsx
```

The generator also:

- registers `ClientInventoryBackendModule` in `apps/api`;
- adds the module feature package to the web application;
- adds the backend feature package to the API application;
- creates a navigation item using the generic module icon;
- applies `scope:client-inventory`, side, and type Nx tags;
- creates a backend application smoke test;
- creates valid package exports, TypeScript configuration, and lint configuration.

## 3. Implement backend capability

Use this dependency direction:

```text
HTTP controller
      ↓
application use case
      ↓
domain contract
      ↑
infrastructure adapter (only when persistence or external I/O is required)
```

### Domain

Place business concepts and invariants under `backend/domain`. Domain code must not import NestJS, Prisma, Fastify, filesystem APIs, or frontend code.

Good domain responsibilities:

- entities and value objects;
- domain errors;
- policy decisions;
- pure validation and calculations;
- typed contracts shared by application use cases.

### Application

Place use cases and ports under `backend/application`. Each use case should represent one business operation and expose an explicit input/output contract.

```ts
export interface InventoryReader {
  findAll(): Promise<readonly InventoryAsset[]>;
}

export class ListInventoryAssets {
  constructor(private readonly reader: InventoryReader) {}

  execute(): Promise<readonly InventoryAsset[]> {
    return this.reader.findAll();
  }
}
```

Application code may depend on domain code. It must not depend directly on Prisma or HTTP.

### Infrastructure

Add `backend/infrastructure` only when the module needs PostgreSQL, filesystem access, queues, or an external service. The adapter implements an application port.

For PostgreSQL:

1. Add models under `prisma/models/`.
2. Create a forward-only migration.
3. Generate the Prisma client.
4. Implement the application port in infrastructure.
5. Wire the implementation in the backend feature module.
6. Add PostgreSQL integration tests.

Never import Prisma from domain, application, presentation, or frontend libraries.

### Presentation

Controllers translate HTTP input into use-case input and use-case output into the documented response. Keep business decisions out of controllers.

- validate request data;
- document OpenAPI contracts;
- use centralized authentication and capability authorization;
- return platform problem details for failures;
- never trust frontend authorization checks.

After changing an API contract:

```bash
pnpm api:client:generate
pnpm api:client:check
```

Commit the generated client changes with the API contract.

### Backend feature

The feature module is the only module-owned NestJS composition point. Register controllers, providers, ports, and infrastructure adapters here. `apps/api` imports the feature module but contains no module business logic.

## 4. Implement frontend capability

Use this dependency direction:

```text
Next.js route
      ↓
frontend feature
   ↙       ↘
data access  UI
      ↓
generated platform API client
```

### Data access

Place API interaction, transport-to-view-model mapping, and query state in `frontend/data-access`. Use the generated API client. Do not duplicate backend DTOs manually when the generated contract exists.

Handle all states explicitly:

- loading;
- empty result;
- authorization failure;
- validation failure;
- service failure;
- success.

### UI

Module UI owns product-specific visuals such as inventory rows, ticket timelines, or client-contact cards. It composes platform design-system primitives rather than recreating them.

Use global components from:

```ts
import { Button } from '@mercure/platform-frontend-design-system/ui/button';
import { PageLayout, Section, StatusIndicator } from '@mercure/platform-frontend-design-system';
```

Check `/design-system` before creating any visual primitive. Add a component to the platform design system only when at least two unrelated modules need the same semantic UI contract.

### Feature

Feature code coordinates data access, permissions, actions, and module UI. Keep reusable presentation in `ui` and transport details in `data-access`.

### Route

The generated route is intentionally thin:

```tsx
import { ClientInventoryOverviewFeature } from '@mercure/client-inventory-frontend-feature';

export default function ClientInventoryPage() {
  return <ClientInventoryOverviewFeature />;
}
```

Do not move feature behavior into `apps/web`.

## 5. Authorization

Define capabilities around business actions rather than pages. Examples:

- `inventory:read`;
- `inventory:create`;
- `inventory:update`;
- `inventory:delete`.

Backend enforcement is mandatory. Frontend checks only control presentation. Update Keycloak role/capability mapping documentation when adding permissions.

Test at minimum:

- anonymous request denied;
- authenticated user without capability denied;
- authorized user allowed;
- privileged action cannot be reached through an alternate endpoint.

## 6. Logging and audit

Use platform logging. Include stable identifiers and structured fields, never secrets or raw tokens.

Audit events should answer:

- who performed the action;
- what changed;
- which resource was affected;
- when it happened;
- whether it succeeded;
- which request/correlation ID connects related records.

## 7. Tests

Expected test placement:

```text
backend/domain          pure invariant tests
backend/application     use-case tests with port fakes
backend/infrastructure  PostgreSQL/external-adapter integration tests
backend/presentation    controller, DTO, auth and error-mapping tests
frontend/data-access    API mapping and error-state tests
frontend/ui             behavior and accessibility tests
frontend/feature        orchestration and authorization-state tests
```

Test behavior rather than implementation details. Every defect fix receives a regression test at the narrowest useful boundary.

## 8. Validation

Run affected checks during development, then the full merge gates:

```bash
pnpm format
pnpm lint
pnpm api:client:check
pnpm typecheck
pnpm test
pnpm test:coverage:critical
pnpm build
pnpm release:prepare
```

Inspect dependency direction when adding a new library:

```bash
pnpm graph
```

## 9. Completion checklist

- [ ] Module name represents a durable capability.
- [ ] Applications remain thin composition roots.
- [ ] Domain code is framework independent.
- [ ] Business operations are explicit application use cases.
- [ ] Persistence implements an application port.
- [ ] API contracts are validated and regenerated.
- [ ] Backend capabilities enforce authorization.
- [ ] UI uses the Mercure design system.
- [ ] Loading, empty, error, forbidden, and success states exist.
- [ ] Logs and audit events contain safe structured context.
- [ ] Unit, integration, and regression tests cover changed behavior.
- [ ] Database migration is forward-only when applicable.
- [ ] Operational impact and rollback are documented.
- [ ] Full repository gates pass.

## 10. Removing a mistaken scaffold

Do not manually delete fragments after other work has been added. Revert the generator commit while it is isolated:

```bash
git revert <generator-commit>
```

Generate one module per commit before implementing business behavior. This keeps rollback reviewable and avoids partial composition changes.
