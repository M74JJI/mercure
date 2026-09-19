# Mercure Engineering Constitution

## Purpose

Mercure is a modular security platform. Engineering decisions optimize for correctness, security, maintainability, scalability, reproducibility, observability, and developer experience without introducing complexity that is not justified by a concrete requirement.

## Locked architectural principles

1. The repository is a single Nx monorepo.
2. `apps/web` is the single Next.js frontend deployable and remains a thin composition root.
3. `apps/api` is the single NestJS backend deployable and remains a thin composition root.
4. Product capabilities live under `libs/modules/<module>/` and may expose `frontend/` and `backend/` libraries.
5. Product modules are peers. `rules` is the first module, not the architectural center of the platform.
6. All server-side business logic, persistence access, filesystem/archive processing, and external-service integration execute behind NestJS.
7. PostgreSQL is canonical persistence unless an ADR explicitly approves another persistence technology for a bounded purpose.
8. Database access is restricted to backend infrastructure libraries.
9. Frontend code cannot import backend implementation libraries.
10. Backend domain code remains framework-independent where practical and must not depend on NestJS, Prisma, Fastify, HTTP, or filesystem implementations.
11. Nx project tags and lint rules enforce architectural boundaries in CI.
12. Authentication and authorization follow ADR-0015: external OIDC identity, server-side web sessions, backend-enforced bearer authentication and centralized capability-based authorization.
13. New distributed infrastructure such as queues, workers, caches, microservices, or Kubernetes requires a demonstrated requirement and an ADR.

## Engineering quality policy

- TypeScript strictness is never weakened to make a build pass.
- `any`, blanket lint disables, ignored tests, and unchecked type assertions require explicit technical justification.
- Public contracts are typed and versioned deliberately.
- Application errors, logs, configuration, API behavior, database migrations, and tests follow workspace-wide standards.
- Security controls that are intended to protect merges must be blocking; decorative scans are not accepted as controls.
- Build inputs and CI dependencies are pinned for reproducibility and supply-chain safety.
- Comments explain intent, invariants, security-sensitive choices, or non-obvious behavior; they do not narrate obvious code.

## Repository provenance policy

Developer-tool residue is not product source. AI-agent/editor configuration, generated attribution trailers, local prompt files, and similar artifacts must not be tracked. Legitimate product functionality involving machine learning or AI is unaffected by this policy.

## Change control

Architecture changes that alter a locked principle require an Architecture Decision Record (ADR). A pull request that weakens an invariant without an approved ADR is invalid even when tests pass.
