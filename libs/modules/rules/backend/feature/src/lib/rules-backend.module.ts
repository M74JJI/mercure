import { Module } from '@nestjs/common';

import { PlatformConfig } from '@mercure/platform-backend-config';
import {
  AnalyzeRuleset,
  ImportArchivedRuleset,
  RULESET_ANALYZER,
  RULESET_ARCHIVE_SOURCE,
  type RulesetArchiveSource,
} from '@mercure/rules-backend-application';
import {
  FilesystemManagerArchiveSource,
  WazuhXmlRulesetAnalyzer,
} from '@mercure/rules-backend-infrastructure';

@Module({
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
  ],
  exports: [AnalyzeRuleset, ImportArchivedRuleset],
})
export class RulesBackendModule {}
