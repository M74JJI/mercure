import { Module } from '@nestjs/common';

import { AnalyzeRuleset, RULESET_ANALYZER } from '@mercure/rules-backend-application';
import { WazuhXmlRulesetAnalyzer } from '@mercure/rules-backend-infrastructure';

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
  ],
  exports: [AnalyzeRuleset],
})
export class RulesBackendModule {}
