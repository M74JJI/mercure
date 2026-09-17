# ADR-0001: Monorepo topology and composition roots

- Status: Accepted
- Date: 2026-09-17

## Context

Mercure will grow into a multi-module security platform. The repository needs clear deployable boundaries while keeping product modules independently understandable and enforceable by Nx.

## Decision

Mercure uses one Nx monorepo with two deployable applications:

- `apps/web`: Next.js frontend composition root.
- `apps/api`: NestJS backend composition root.

Product capabilities live under `libs/modules/<module>/`. A module may provide frontend and backend libraries. These libraries are compiled into the two applications; they are not independent deployables.

Platform-wide capabilities live under `libs/platform/`. Truly cross-domain, technology-neutral code may live under `libs/shared/`, which must remain intentionally small.

## Consequences

- Deployable topology stays simple while source ownership remains domain-first.
- Nx can enforce side, scope, and type dependency boundaries.
- Product teams can own complete domains without scattering implementation across giant application folders.
- A future worker or additional deployable can reuse module libraries without moving domain logic, but no extra deployable is created until justified.
