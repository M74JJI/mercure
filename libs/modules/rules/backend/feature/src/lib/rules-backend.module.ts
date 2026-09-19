import { Module } from '@nestjs/common';

import { PlatformConfig } from '@mercure/platform-backend-config';
import { PlatformDatabaseModule, PrismaService } from '@mercure/platform-backend-database';
import {
  AnalyzeRuleset,
  AnalyzeRulesetSnapshotRoundtrip,
  CompareRulesetSnapshots,
  CreateCustomRulesUseCase,
  DeleteCustomRulesUseCase,
  GetRulesUseCase,
  ImportArchivedRuleset,
  ListRulesUseCases,
  PersistImportedRuleset,
  QueryRulesetSnapshots,
  RULESET_ANALYZER,
  RULESET_ARCHIVE_SOURCE,
  RULESET_SNAPSHOT_ANALYSIS_SOURCE,
  RULESET_SNAPSHOT_QUERY_STORE,
  RULESET_SNAPSHOT_STORE,
  RULES_USE_CASE_CATALOG,
  UpdateCustomRulesUseCase,
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
  PrismaRulesetSnapshotStore,
  PrismaRulesUseCaseCatalog,
  WazuhXmlRulesetAnalyzer,
} from '@mercure/rules-backend-infrastructure';
import { RulesSnapshotsController } from '@mercure/rules-backend-presentation';

@Module({
  imports: [PlatformDatabaseModule],
  controllers: [RulesSnapshotsController],
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
    ImportArchivedRuleset,
    PersistImportedRuleset,
    QueryRulesetSnapshots,
    CompareRulesetSnapshots,
    AnalyzeRulesetSnapshotRoundtrip,
    ListRulesUseCases,
    GetRulesUseCase,
    CreateCustomRulesUseCase,
    UpdateCustomRulesUseCase,
    DeleteCustomRulesUseCase,
  ],
})
export class RulesBackendModule {}
