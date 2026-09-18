# Rules migration inventory

Legacy reference: `M74JJI/m-rules@21b1f5d9d4d91ecfd297ac211ce50ac5cd2e2028`.

## M5 migration matrix

| Legacy capability                    | Legacy location                   | M5 disposition                         | Mercure target                              |
| ------------------------------------ | --------------------------------- | -------------------------------------- | ------------------------------------------- |
| Rules/decoder records                | `lib/types.ts`                    | Migrate and normalize                  | Rules domain                                |
| Severity/status/role derivation      | `lib/parser.ts`                   | Migrate with parity tests              | Rules domain                                |
| Use-case inference heuristics        | `lib/parser.ts`                   | Migrate as pure policy                 | Rules domain                                |
| Wazuh XML extraction                 | `lib/parser.ts`                   | Migrate with golden fixtures           | Rules infrastructure                        |
| Dependency validation                | `lib/parser.ts`                   | Migrate with parity tests              | Rules infrastructure                        |
| Parser statistics                    | `lib/parser.ts`                   | Migrate with parity tests              | Rules infrastructure                        |
| Browser File reading/hash            | `lib/parser.ts`                   | Do not copy                            | Future source adapter                       |
| Manager archive discovery/import     | `lib/manager-archive-source.ts`   | Migrated with hardened direct-read adapter | Rules infrastructure source adapter         |
| Archive streaming API                | Next `manager-files/stream` route | Redesign later                         | Nest presentation/application               |
| Use-case filesystem JSON store       | `lib/use-case-store.ts`           | Do not copy                            | Future PostgreSQL repository                |
| Use-case HTTP CRUD                   | Next `api/use-cases`              | Defer                                  | Future Nest presentation/application        |
| Collection diff                      | `lib/diff.ts`                     | Defer after normalized model is stable | Rules domain/application                    |
| XML round-trip/reporting             | `lib/xml-roundtrip.ts`            | Defer                                  | Rules application/infrastructure            |
| Rule quality scoring                 | `lib/rule-quality.ts`             | Defer                                  | Rules domain/application                    |
| Field intelligence                   | `lib/field-intelligence.ts`       | Defer                                  | Rules domain/application                    |
| Dependency/field graph               | `lib/graph-engine.ts`             | Defer                                  | Rules application/frontend                  |
| AI rule intelligence                 | `lib/ai-rule-intelligence.ts`     | Exclude                                | Requires separate product/ADR decision      |
| NextAuth/RBAC/sign-in                | `src/auth.ts`, `src/lib/auth/**`  | Exclude                                | Future identity bounded context             |
| Monolithic Rules Hub UI              | `WazuhRulesHub.tsx`               | Do not copy                            | Later feature-by-feature frontend migration |

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
2. M6 — manager archive source adapter and import orchestration.

Next:

1. immutable configuration snapshots and normalized PostgreSQL persistence;
2. Nest Rules query/import endpoints plus regenerated frontend contract;
3. Rules frontend feature/data-access/UI libraries;
4. diff and XML round-trip;
5. use-case catalog backed by PostgreSQL;
6. graph, field intelligence and quality scoring;
7. only then consider any AI-assisted feature through a separate product/security decision.
