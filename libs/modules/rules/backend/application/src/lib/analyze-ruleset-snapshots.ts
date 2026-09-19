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

export interface RulesetSnapshotAnalysisSource {
  load(snapshotId: string): Promise<ParsedRuleset | null>;
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
      this.source.load(request.beforeSnapshotId),
      this.source.load(request.afterSnapshotId),
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
    const ruleset = await this.source.load(snapshotId);
    if (!ruleset) {
      throw new RulesetSnapshotNotFoundError(snapshotId);
    }

    return {
      snapshotId,
      analysis: analyzeXmlRoundtrip(ruleset),
    };
  }
}
