# ADR-0007: Rules bounded-context migration foundation

- Status: Accepted
- Date: 2026-09-18
- Legacy behavioral reference: `M74JJI/m-rules@21b1f5d9d4d91ecfd297ac211ce50ac5cd2e2028`

## Context

Mercure's first product capability is the Rules bounded context. The existing standalone `m-rules` application already contains useful Wazuh parsing, validation, diffing, XML round-trip, graph, quality, field-intelligence, archive-source, use-case, authentication, and UI behavior. The legacy repository is a behavioral reference, not an architecture template.

Mercure must preserve valuable behavior without importing Next.js server routes, filesystem persistence, authentication, or the monolithic frontend into the new platform.

## Decision

### M5 scope

M5 establishes and validates the reusable backend Rules core:

- pure Rules domain records and inference policies;
- an application use case and parser port;
- a Wazuh XML parser/validator infrastructure adapter;
- NestJS Rules feature composition imported by the single `apps/api` application;
- golden fixtures and regression tests for parser/validation behavior;
- blocking workspace tests in CI.

M5 intentionally exposes no public Rules HTTP endpoint and persists no Rules data. A parser must be behaviorally trustworthy before ingestion, persistence, or UI workflows depend on it.

### Nx projects

The initial backend project set is:

- `rules-backend-domain` — `scope:rules`, `side:backend`, `type:domain`;
- `rules-backend-application` — `scope:rules`, `side:backend`, `type:application`;
- `rules-backend-infrastructure` — `scope:rules`, `side:backend`, `type:infrastructure`;
- `rules-backend-feature` — `scope:rules`, `side:backend`, `type:feature`.

Presentation is not created until a real HTTP contract exists. Frontend Rules libraries are not created until the first migrated Rules workflow is ready to consume a real API.

### Domain boundary

The domain owns technology-neutral concepts such as:

- ruleset source metadata;
- Wazuh rule records;
- decoder records;
- dependencies and field conditions;
- use-case identity/confidence;
- validation issues;
- analysis statistics;
- severity/role/status/use-case inference rules that are independent of XML mechanics.

The domain imports no NestJS, Prisma, Fastify, filesystem, process, XML parser, or browser APIs.

### Application boundary

Application code defines the `RulesetAnalyzer` port and the `AnalyzeRuleset` use case. It depends only on Rules domain code.

The use case accepts normalized source-file inputs. It does not know whether future inputs came from filesystem archives, uploads, S3, SFTP, Wazuh API, or another source adapter.

### Infrastructure boundary

`WazuhXmlRulesetAnalyzer` implements the application port. It owns Wazuh XML extraction mechanics and validation that depends on parsed XML relationships.

The first implementation intentionally preserves the legacy parser's externally visible behavior for:

- rule ID/level/description/group extraction;
- rule status/role/severity and Jira visibility derivation;
- MITRE technique extraction;
- rule dependencies;
- field/match/same-field/different-field extraction;
- correlation attributes and options;
- decoder parent/prematch/regex/order extraction;
- source-section detection;
- duplicate rule/decoder validation;
- missing use-case, missing SID/group/decoder, Jira-without-MITRE, helper-with-MITRE, high-level, external decoder-parent, and unknown-file issues;
- summary statistics.

Behavioral changes require explicit tests and a documented reason rather than silent cleanup during migration.

### Testing

Vitest 5.0.0 is the unit/integration test baseline for M5. Version 5.0.1 is not adopted because it is still inside the workspace's seven-day dependency quarantine. Vite 8.3.0 is pinned explicitly as Vitest's supported peer; Mercure keeps `autoInstallPeers: false` and strict peer enforcement.

Golden fixtures live under `tests/fixtures/rules/` and represent Wazuh XML behavior, not implementation details.

Workspace CI runs `pnpm test` as a blocking gate before production builds.

### Explicitly excluded from M5

The following legacy concerns are not copied in M5:

- NextAuth, sign-in, roles, guards, proxy/auth middleware;
- Next.js API routes;
- filesystem JSON persistence for use cases;
- server archive scanning/extraction;
- streaming NDJSON endpoints;
- the monolithic `WazuhRulesHub.tsx` UI;
- Tailwind/shadcn/Radix component inventory;
- AI-labeled rule intelligence;
- field intelligence, quality scoring, graphing, diffing, XML rewrite/report generation;
- use-case CRUD;
- Rules persistence.

Excluded does not mean rejected permanently. These behaviors are migrated or redesigned in later milestones when their correct Mercure boundary is ready.

## Consequences

- The first product module validates the domain-first Nx architecture with real behavior.
- Legacy parser behavior becomes testable independently from React, Next.js, auth, and filesystem state.
- Future ingestion sources can reuse the same application use case.
- Future persistence can store normalized results without coupling parsing to Prisma.
- M5 does not create a fake API merely to demonstrate wiring.
