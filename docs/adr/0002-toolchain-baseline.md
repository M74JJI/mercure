# ADR-0002: Toolchain baseline

- Status: Accepted
- Date: 2026-09-17

## Context

Mercure requires a reproducible, security-conscious JavaScript/TypeScript toolchain that stays current without adopting unsupported combinations or pre-release software merely to maximize version numbers.

## Decision

The initial workspace baseline is pinned to:

- Node.js 24.21.0 LTS
- pnpm 12.4.2
- Nx 23.2.1
- TypeScript 6.0.3
- Prettier 3.9.0

Framework versions are pinned separately when their deployable applications are introduced. Production dependencies use exact versions rather than floating ranges. The workspace uses pnpm's minimum release age guardrail to quarantine newly published dependency versions for seven days by default.

TypeScript 7 is intentionally not adopted in the initial baseline. It is newer, but the current Nx ecosystem explicitly supports TypeScript 6 and some surrounding tooling has not yet established the same compatibility guarantees for TypeScript 7. The repository prefers the newest supported production combination over unsupported novelty.

## Consequences

- Builds are reproducible across developer machines and CI.
- Toolchain upgrades are deliberate changes with visible diffs and validation.
- Emergency dependency upgrades may bypass the release-age quarantine only through an explicit, documented exception.
- Major toolchain upgrades require compatibility verification before merge.
