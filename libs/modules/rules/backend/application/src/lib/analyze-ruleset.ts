import type { ParsedRuleset, RulesUseCase, RulesetSourceType } from '@mercure/rules-backend-domain';

import type { RulesUseCaseCatalogReader } from './use-case-catalog';

export const RULESET_ANALYZER = Symbol('mercure.rules.ruleset-analyzer');
export const RULESET_ARCHIVE_SOURCE = Symbol('mercure.rules.ruleset-archive-source');

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

export interface RulesetArchiveInfo {
  readonly name: string;
  readonly size: number;
  readonly modifiedAt: string;
  readonly xmlFiles: number;
}

export interface RulesetArchiveSnapshot {
  readonly sourceRoot: string | null;
  readonly configured: boolean;
  readonly archives: readonly RulesetArchiveInfo[];
  readonly files: readonly RulesetSourceInput[];
  readonly fingerprint: string;
  readonly loadedAt: string;
  readonly errors: readonly string[];
}

export interface RulesetArchiveSource {
  readSnapshot(): Promise<RulesetArchiveSnapshot>;
}

export interface ImportArchivedRulesetRequest {
  readonly useCases?: readonly RulesUseCase[];
}

export interface ImportArchivedRulesetResult {
  readonly source: Omit<RulesetArchiveSnapshot, 'files'>;
  readonly analysis: ParsedRuleset;
}

export class AnalyzeRuleset {
  constructor(private readonly analyzer: RulesetAnalyzer) {}

  execute(request: AnalyzeRulesetRequest): Promise<ParsedRuleset> {
    return this.analyzer.analyze(request);
  }
}

export class ImportArchivedRuleset {
  constructor(
    private readonly source: RulesetArchiveSource,
    private readonly analyzeRuleset: AnalyzeRuleset,
    private readonly useCaseCatalog?: RulesUseCaseCatalogReader,
  ) {}

  async execute(request: ImportArchivedRulesetRequest = {}): Promise<ImportArchivedRulesetResult> {
    const snapshot = await this.source.readSnapshot();
    const useCases =
      request.useCases ?? (this.useCaseCatalog ? await this.useCaseCatalog.list() : undefined);
    const analysis = await this.analyzeRuleset.execute({
      files: snapshot.files,
      ...(useCases === undefined ? {} : { useCases }),
    });

    const source: Omit<RulesetArchiveSnapshot, 'files'> = {
      sourceRoot: snapshot.sourceRoot,
      configured: snapshot.configured,
      archives: snapshot.archives,
      fingerprint: snapshot.fingerprint,
      loadedAt: snapshot.loadedAt,
      errors: snapshot.errors,
    };

    return { source, analysis };
  }
}
