import type {
  ParsedRuleset,
  RulesetDiff,
  XmlRoundtripAnalysis,
} from '@mercure/rules-backend-domain';
import { analyzeXmlRoundtrip, diffRulesets } from '@mercure/rules-backend-domain';

import { RulesetSnapshotNotFoundError } from './query-ruleset-snapshots';

export const RULESET_SNAPSHOT_ANALYSIS_SOURCE = Symbol(
  'mercure.rules.ruleset-snapshot-analysis-source',
);

export type RulesetSnapshotAnalysisProfile =
  | 'full'
  | 'fields'
  | 'quality'
  | 'graph'
  | 'comparison'
  | 'roundtrip';

export interface RulesetSnapshotAnalysisSource {
  load(
    snapshotId: string,
    profile?: RulesetSnapshotAnalysisProfile,
  ): Promise<ParsedRuleset | null>;
}

export interface CompareRulesetSnapshotsRequest {
  readonly beforeSnapshotId: string;
  readonly afterSnapshotId: string;
}

export interface CompareRulesetSnapshotsResult {
  readonly beforeSnapshotId: string;
  readonly afterSnapshotId: string;
  readonly diff: RulesetDiff;
}

export class CompareRulesetSnapshots {
  constructor(private readonly source: RulesetSnapshotAnalysisSource) {}

  async execute(request: CompareRulesetSnapshotsRequest): Promise<CompareRulesetSnapshotsResult> {
    const [before, after] = await Promise.all([
      this.source.load(request.beforeSnapshotId, 'comparison'),
      this.source.load(request.afterSnapshotId, 'comparison'),
    ]);

    if (!before) {
      throw new RulesetSnapshotNotFoundError(request.beforeSnapshotId);
    }
    if (!after) {
      throw new RulesetSnapshotNotFoundError(request.afterSnapshotId);
    }

    return {
      beforeSnapshotId: request.beforeSnapshotId,
      afterSnapshotId: request.afterSnapshotId,
      diff: diffRulesets(before, after),
    };
  }
}

export interface AnalyzeRulesetSnapshotRoundtripResult {
  readonly snapshotId: string;
  readonly analysis: XmlRoundtripAnalysis;
}

export class AnalyzeRulesetSnapshotRoundtrip {
  constructor(private readonly source: RulesetSnapshotAnalysisSource) {}

  async execute(snapshotId: string): Promise<AnalyzeRulesetSnapshotRoundtripResult> {
    const ruleset = await this.source.load(snapshotId, 'roundtrip');
    if (!ruleset) {
      throw new RulesetSnapshotNotFoundError(snapshotId);
    }

    return {
      snapshotId,
      analysis: analyzeXmlRoundtrip(ruleset),
    };
  }
}
