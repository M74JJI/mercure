import { Module } from '@nestjs/common';

import { PlatformConfig } from '@mercure/platform-backend-config';
import { PlatformDatabaseModule, PrismaService } from '@mercure/platform-backend-database';
import {
  AnalyzeRuleset,
  AnalyzeRulesetSnapshotFields,
  AnalyzeRulesetSnapshotRoundtrip,
  ApproveRulesAuthoringDraft,
  BuildRulesetSnapshotGraph,
  CompareRulesetSnapshots,
  CreateRulesAuthoringDraft,
  CreateCustomRulesUseCase,
  DeleteCustomRulesUseCase,
  ExportRulesAuthoringDraft,
  GetRulesAuthoringDraft,
  GetRulesUseCase,
  ImportArchivedRuleset,
  ListRulesAuthoringDrafts,
  ListRulesUseCases,
  PersistImportedRuleset,
  QueryRulesetSnapshots,
  ScoreRulesetSnapshotQuality,
  RULESET_ANALYZER,
  RULESET_ARCHIVE_SOURCE,
  RULESET_SNAPSHOT_ANALYSIS_SOURCE,
  RULESET_SNAPSHOT_QUERY_STORE,
  RULESET_SNAPSHOT_STORE,
  RULES_AUTHORING_DRAFT_STORE,
  RULES_AUTHORING_SOURCE,
  RULES_USE_CASE_CATALOG,
  UpdateCustomRulesUseCase,
  UpdateRulesAuthoringDraft,
  ValidateRulesAuthoringDraft,
  type RulesAuthoringDraftStore,
  type RulesAuthoringSource,
  type RulesetArchiveSource,
  type RulesetSnapshotAnalysisSource,
  type RulesetSnapshotQueryStore,
  type RulesetSnapshotStore,
  type RulesUseCaseCatalog,
  type RulesUseCaseCatalogReader,
} from '@mercure/rules-backend-application';
import {
  FilesystemManagerArchiveSource,
  PrismaRulesetSnapshotAnalysisSource,
  PrismaRulesetSnapshotQueryStore,
  PrismaRulesAuthoringStore,
  PrismaRulesetSnapshotStore,
  PrismaRulesUseCaseCatalog,
  WazuhXmlRulesetAnalyzer,
} from '@mercure/rules-backend-infrastructure';
import {
  RulesAuthoringController,
  RulesIntelligenceController,
  RulesSnapshotsController,
  RulesUseCaseAdministrationController,
  RulesUseCasesController,
} from '@mercure/rules-backend-presentation';

@Module({
  imports: [PlatformDatabaseModule],
  controllers: [
    RulesSnapshotsController,
    RulesAuthoringController,
    RulesIntelligenceController,
    RulesUseCasesController,
    RulesUseCaseAdministrationController,
  ],
  providers: [
    WazuhXmlRulesetAnalyzer,
    {
      provide: RULESET_ANALYZER,
      useExisting: WazuhXmlRulesetAnalyzer,
    },
    {
      provide: AnalyzeRuleset,
      useFactory: (analyzer: WazuhXmlRulesetAnalyzer) => new AnalyzeRuleset(analyzer),
      inject: [WazuhXmlRulesetAnalyzer],
    },
    {
      provide: PrismaRulesUseCaseCatalog,
      useFactory: (database: PrismaService) => new PrismaRulesUseCaseCatalog(database),
      inject: [PrismaService],
    },
    {
      provide: RULES_USE_CASE_CATALOG,
      useExisting: PrismaRulesUseCaseCatalog,
    },
    {
      provide: PrismaRulesAuthoringStore,
      useFactory: (database: PrismaService) => new PrismaRulesAuthoringStore(database),
      inject: [PrismaService],
    },
    {
      provide: RULES_AUTHORING_DRAFT_STORE,
      useExisting: PrismaRulesAuthoringStore,
    },
    {
      provide: RULES_AUTHORING_SOURCE,
      useExisting: PrismaRulesAuthoringStore,
    },
    {
      provide: ListRulesAuthoringDrafts,
      useFactory: (store: RulesAuthoringDraftStore) => new ListRulesAuthoringDrafts(store),
      inject: [RULES_AUTHORING_DRAFT_STORE],
    },
    {
      provide: GetRulesAuthoringDraft,
      useFactory: (store: RulesAuthoringDraftStore) => new GetRulesAuthoringDraft(store),
      inject: [RULES_AUTHORING_DRAFT_STORE],
    },
    {
      provide: CreateRulesAuthoringDraft,
      useFactory: (source: RulesAuthoringSource, store: RulesAuthoringDraftStore) =>
        new CreateRulesAuthoringDraft(source, store),
      inject: [RULES_AUTHORING_SOURCE, RULES_AUTHORING_DRAFT_STORE],
    },
    {
      provide: UpdateRulesAuthoringDraft,
      useFactory: (store: RulesAuthoringDraftStore) => new UpdateRulesAuthoringDraft(store),
      inject: [RULES_AUTHORING_DRAFT_STORE],
    },
    {
      provide: ValidateRulesAuthoringDraft,
      useFactory: (
        store: RulesAuthoringDraftStore,
        analyzeRuleset: AnalyzeRuleset,
        catalog: RulesUseCaseCatalogReader,
      ) => new ValidateRulesAuthoringDraft(store, analyzeRuleset, catalog),
      inject: [RULES_AUTHORING_DRAFT_STORE, AnalyzeRuleset, RULES_USE_CASE_CATALOG],
    },
    {
      provide: ApproveRulesAuthoringDraft,
      useFactory: (store: RulesAuthoringDraftStore) => new ApproveRulesAuthoringDraft(store),
      inject: [RULES_AUTHORING_DRAFT_STORE],
    },
    {
      provide: ExportRulesAuthoringDraft,
      useFactory: (store: RulesAuthoringDraftStore) => new ExportRulesAuthoringDraft(store),
      inject: [RULES_AUTHORING_DRAFT_STORE],
    },
    {
      provide: RULESET_ARCHIVE_SOURCE,
      useFactory: (config: PlatformConfig) =>
        new FilesystemManagerArchiveSource({
          rootPath: config.rulesManagerArchiveDir,
          maxFiles: config.rulesArchiveMaxFiles,
          maxEntryBytes: config.rulesArchiveMaxEntryBytes,
          maxTotalBytes: config.rulesArchiveMaxTotalBytes,
        }),
      inject: [PlatformConfig],
    },
    {
      provide: ImportArchivedRuleset,
      useFactory: (
        source: RulesetArchiveSource,
        analyzeRuleset: AnalyzeRuleset,
        catalog: RulesUseCaseCatalogReader,
      ) => new ImportArchivedRuleset(source, analyzeRuleset, catalog),
      inject: [RULESET_ARCHIVE_SOURCE, AnalyzeRuleset, RULES_USE_CASE_CATALOG],
    },
    {
      provide: PrismaRulesetSnapshotStore,
      useFactory: (database: PrismaService) => new PrismaRulesetSnapshotStore(database),
      inject: [PrismaService],
    },
    {
      provide: RULESET_SNAPSHOT_STORE,
      useExisting: PrismaRulesetSnapshotStore,
    },
    {
      provide: PersistImportedRuleset,
      useFactory: (importer: ImportArchivedRuleset, store: RulesetSnapshotStore) =>
        new PersistImportedRuleset(importer, store),
      inject: [ImportArchivedRuleset, RULESET_SNAPSHOT_STORE],
    },
    {
      provide: PrismaRulesetSnapshotQueryStore,
      useFactory: (database: PrismaService) => new PrismaRulesetSnapshotQueryStore(database),
      inject: [PrismaService],
    },
    {
      provide: RULESET_SNAPSHOT_QUERY_STORE,
      useExisting: PrismaRulesetSnapshotQueryStore,
    },
    {
      provide: QueryRulesetSnapshots,
      useFactory: (store: RulesetSnapshotQueryStore) => new QueryRulesetSnapshots(store),
      inject: [RULESET_SNAPSHOT_QUERY_STORE],
    },
    {
      provide: PrismaRulesetSnapshotAnalysisSource,
      useFactory: (database: PrismaService) => new PrismaRulesetSnapshotAnalysisSource(database),
      inject: [PrismaService],
    },
    {
      provide: RULESET_SNAPSHOT_ANALYSIS_SOURCE,
      useExisting: PrismaRulesetSnapshotAnalysisSource,
    },
    {
      provide: CompareRulesetSnapshots,
      useFactory: (source: RulesetSnapshotAnalysisSource) => new CompareRulesetSnapshots(source),
      inject: [RULESET_SNAPSHOT_ANALYSIS_SOURCE],
    },
    {
      provide: AnalyzeRulesetSnapshotRoundtrip,
      useFactory: (source: RulesetSnapshotAnalysisSource) =>
        new AnalyzeRulesetSnapshotRoundtrip(source),
      inject: [RULESET_SNAPSHOT_ANALYSIS_SOURCE],
    },
    {
      provide: AnalyzeRulesetSnapshotFields,
      useFactory: (source: RulesetSnapshotAnalysisSource) =>
        new AnalyzeRulesetSnapshotFields(source),
      inject: [RULESET_SNAPSHOT_ANALYSIS_SOURCE],
    },
    {
      provide: ScoreRulesetSnapshotQuality,
      useFactory: (source: RulesetSnapshotAnalysisSource) =>
        new ScoreRulesetSnapshotQuality(source),
      inject: [RULESET_SNAPSHOT_ANALYSIS_SOURCE],
    },
    {
      provide: BuildRulesetSnapshotGraph,
      useFactory: (source: RulesetSnapshotAnalysisSource) => new BuildRulesetSnapshotGraph(source),
      inject: [RULESET_SNAPSHOT_ANALYSIS_SOURCE],
    },
    {
      provide: ListRulesUseCases,
      useFactory: (catalog: RulesUseCaseCatalogReader) => new ListRulesUseCases(catalog),
      inject: [RULES_USE_CASE_CATALOG],
    },
    {
      provide: GetRulesUseCase,
      useFactory: (catalog: RulesUseCaseCatalogReader) => new GetRulesUseCase(catalog),
      inject: [RULES_USE_CASE_CATALOG],
    },
    {
      provide: CreateCustomRulesUseCase,
      useFactory: (catalog: RulesUseCaseCatalog) => new CreateCustomRulesUseCase(catalog),
      inject: [RULES_USE_CASE_CATALOG],
    },
    {
      provide: UpdateCustomRulesUseCase,
      useFactory: (catalog: RulesUseCaseCatalog) => new UpdateCustomRulesUseCase(catalog),
      inject: [RULES_USE_CASE_CATALOG],
    },
    {
      provide: DeleteCustomRulesUseCase,
      useFactory: (catalog: RulesUseCaseCatalog) => new DeleteCustomRulesUseCase(catalog),
      inject: [RULES_USE_CASE_CATALOG],
    },
  ],
  exports: [
    AnalyzeRuleset,
    ListRulesAuthoringDrafts,
    GetRulesAuthoringDraft,
    CreateRulesAuthoringDraft,
    UpdateRulesAuthoringDraft,
    ValidateRulesAuthoringDraft,
    ApproveRulesAuthoringDraft,
    ExportRulesAuthoringDraft,
    ImportArchivedRuleset,
    PersistImportedRuleset,
    QueryRulesetSnapshots,
    CompareRulesetSnapshots,
    AnalyzeRulesetSnapshotRoundtrip,
    AnalyzeRulesetSnapshotFields,
    ScoreRulesetSnapshotQuality,
    BuildRulesetSnapshotGraph,
    ListRulesUseCases,
    GetRulesUseCase,
    CreateCustomRulesUseCase,
    UpdateCustomRulesUseCase,
    DeleteCustomRulesUseCase,
  ],
})
export class RulesBackendModule {}
