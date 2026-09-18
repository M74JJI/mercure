import { Module } from '@nestjs/common';

import { PlatformConfig } from '@mercure/platform-backend-config';
import { PlatformDatabaseModule, PrismaService } from '@mercure/platform-backend-database';
import {
  AnalyzeRuleset,
  ImportArchivedRuleset,
  PersistImportedRuleset,
  RULESET_ANALYZER,
  RULESET_ARCHIVE_SOURCE,
  RULESET_SNAPSHOT_STORE,
  type RulesetArchiveSource,
  type RulesetSnapshotStore,
} from '@mercure/rules-backend-application';
import {
  FilesystemManagerArchiveSource,
  PrismaRulesetSnapshotStore,
  WazuhXmlRulesetAnalyzer,
} from '@mercure/rules-backend-infrastructure';

@Module({
  imports: [PlatformDatabaseModule],
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
      useFactory: (source: RulesetArchiveSource, analyzeRuleset: AnalyzeRuleset) =>
        new ImportArchivedRuleset(source, analyzeRuleset),
      inject: [RULESET_ARCHIVE_SOURCE, AnalyzeRuleset],
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
  ],
  exports: [AnalyzeRuleset, ImportArchivedRuleset, PersistImportedRuleset],
})
export class RulesBackendModule {}
