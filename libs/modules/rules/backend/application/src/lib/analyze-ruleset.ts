import type { ParsedRuleset, RulesUseCase, RulesetSourceType } from '@mercure/rules-backend-domain';

export const RULESET_ANALYZER = Symbol('mercure.rules.ruleset-analyzer');

export interface RulesetSourceInput {
  readonly name: string;
  readonly content: string;
  readonly size?: number;
  readonly tenant?: string;
  readonly type?: RulesetSourceType;
}

export interface AnalyzeRulesetRequest {
  readonly files: readonly RulesetSourceInput[];
  readonly useCases?: readonly RulesUseCase[];
}

export interface RulesetAnalyzer {
  analyze(request: AnalyzeRulesetRequest): Promise<ParsedRuleset>;
}

export class AnalyzeRuleset {
  constructor(private readonly analyzer: RulesetAnalyzer) {}

  execute(request: AnalyzeRulesetRequest): Promise<ParsedRuleset> {
    return this.analyzer.analyze(request);
  }
}
