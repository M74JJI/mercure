# Rules migration inventory

Legacy reference: `M74JJI/m-rules@21b1f5d9d4d91ecfd297ac211ce50ac5cd2e2028`.

## M5 migration matrix

| Legacy capability                | Legacy location                   | M5 disposition                             | Mercure target                              |
| -------------------------------- | --------------------------------- | ------------------------------------------ | ------------------------------------------- |
| Rules/decoder records            | `lib/types.ts`                    | Migrate and normalize                      | Rules domain                                |
| Severity/status/role derivation  | `lib/parser.ts`                   | Migrate with parity tests                  | Rules domain                                |
| Use-case inference heuristics    | `lib/parser.ts`                   | Migrate as pure policy                     | Rules domain                                |
| Wazuh XML extraction             | `lib/parser.ts`                   | Migrate with golden fixtures               | Rules infrastructure                        |
| Dependency validation            | `lib/parser.ts`                   | Migrate with parity tests                  | Rules infrastructure                        |
| Parser statistics                | `lib/parser.ts`                   | Migrate with parity tests                  | Rules infrastructure                        |
| Browser File reading/hash        | `lib/parser.ts`                   | Do not copy                                | Future source adapter                       |
| Manager archive discovery/import | `lib/manager-archive-source.ts`   | Migrated with hardened direct-read adapter | Rules infrastructure source adapter         |
| Archive streaming API            | Next `manager-files/stream` route | Redesign later                             | Nest presentation/application               |
| Use-case filesystem JSON store   | `lib/use-case-store.ts`           | Migrated to canonical PostgreSQL catalog   | Rules application/infrastructure            |
| Use-case HTTP CRUD               | Next `api/use-cases`              | Migrated with admin capability enforcement | Rules presentation/application              |
| Collection diff                  | `lib/diff.ts`                     | Migrated with tenant-safe regressions      | Rules domain/application                    |
| XML round-trip/reporting         | `lib/xml-roundtrip.ts`            | Migrated as internal read-only analysis    | Rules domain/application/infrastructure     |
| Rule quality scoring             | `lib/rule-quality.ts`             | Migrated with tenant-safe scoring          | Rules domain/application                    |
| Field intelligence               | `lib/field-intelligence.ts`       | Migrated with tenant-scoped lineage        | Rules domain/application                    |
| Dependency/field graph           | `lib/graph-engine.ts`             | Migrated as layout-free semantic graph     | Rules domain/application                    |
| AI rule intelligence             | `lib/ai-rule-intelligence.ts`     | Exclude                                    | Requires separate product/ADR decision      |
| NextAuth/RBAC/sign-in            | `src/auth.ts`, `src/lib/auth/**`  | Replaced by Keycloak/OIDC                  | Platform identity + web server session      |
| Monolithic Rules Hub UI          | `WazuhRulesHub.tsx`               | Do not copy                                | Later feature-by-feature frontend migration |

## M5 parser parity cases

Golden tests must prove at least:

1. Rule extraction including ID, level, description, groups and source section.
2. MITRE, dependency, decoded-as, field, match, same-field, different-field, frequency, timeframe and options extraction.
3. Decoder parent, prematch, regex and order-field extraction.
4. Severity, status, role, Jira visibility and use-case confidence derivation.
5. Duplicate rule IDs and decoder names.
6. Missing rule/group/decoder dependencies and external decoder parents.
7. Unknown XML file classification.
8. Jira-visible rules without MITRE.
9. Level-zero helper rules carrying MITRE.
10. Aggregate counts matching the normalized records.

## Migration sequence

Completed:

1. M5 — parser/domain/application foundation;
2. M6 — manager archive source adapter and import orchestration;
3. M7 — immutable configuration snapshots and normalized PostgreSQL persistence;
4. M8 — Nest Rules snapshot import/query endpoints and regenerated frontend API contract;
5. M9 — Rules frontend data-access, UI, feature composition, and read-only routes;
6. M10 — tenant-safe snapshot diff and internal read-only XML round-trip analysis;
7. M11 — canonical PostgreSQL-backed use-case catalog with catalog-backed imports;
8. M12 — tenant-scoped field intelligence, quality scoring, and layout-free semantic dependency graph over immutable snapshots.

Post-migration state:

1. the approved non-AI Rules migration scope is implemented across backend, persistence, authenticated presentation, and frontend exploration;
2. Keycloak/OIDC identity and capability enforcement, intelligence presentation, PostgreSQL-backed use-case administration, authenticated snapshot import, and record-level exploration are implemented;
3. controlled Rules authoring is implemented within ADR-0018 as a PostgreSQL-backed draft → validate → approve → export workflow;
4. direct Wazuh manager mutation/deployment and AI-assisted authoring remain outside the approved boundary and require separate decisions.
