import {
  buildFieldIntelligence,
  buildQualitySummary,
  buildRulesGraph,
  type FieldIntelligenceSummary,
  type QualitySummary,
  type RulesGraphData,
  type RulesGraphFilters,
} from '@mercure/rules-backend-domain';

import type { RulesetSnapshotAnalysisSource } from './analyze-ruleset-snapshots';
import { RulesetSnapshotNotFoundError } from './query-ruleset-snapshots';

async function requireSnapshot(source: RulesetSnapshotAnalysisSource, snapshotId: string) {
  const ruleset = await source.load(snapshotId);
  if (!ruleset) {
    throw new RulesetSnapshotNotFoundError(snapshotId);
  }
  return ruleset;
}

export interface AnalyzeRulesetSnapshotFieldsResult {
  readonly snapshotId: string;
  readonly intelligence: FieldIntelligenceSummary;
}

export class AnalyzeRulesetSnapshotFields {
  constructor(private readonly source: RulesetSnapshotAnalysisSource) {}

  async execute(snapshotId: string): Promise<AnalyzeRulesetSnapshotFieldsResult> {
    const ruleset = await requireSnapshot(this.source, snapshotId);
    return {
      snapshotId,
      intelligence: buildFieldIntelligence(ruleset),
    };
  }
}

export interface ScoreRulesetSnapshotQualityResult {
  readonly snapshotId: string;
  readonly quality: QualitySummary;
}

export class ScoreRulesetSnapshotQuality {
  constructor(private readonly source: RulesetSnapshotAnalysisSource) {}

  async execute(snapshotId: string): Promise<ScoreRulesetSnapshotQualityResult> {
    const ruleset = await requireSnapshot(this.source, snapshotId);
    return {
      snapshotId,
      quality: buildQualitySummary(ruleset),
    };
  }
}

export interface BuildRulesetSnapshotGraphRequest {
  readonly snapshotId: string;
  readonly filters: RulesGraphFilters;
}

export interface BuildRulesetSnapshotGraphResult {
  readonly snapshotId: string;
  readonly graph: RulesGraphData;
}

export class BuildRulesetSnapshotGraph {
  constructor(private readonly source: RulesetSnapshotAnalysisSource) {}

  async execute(
    request: BuildRulesetSnapshotGraphRequest,
  ): Promise<BuildRulesetSnapshotGraphResult> {
    const ruleset = await requireSnapshot(this.source, request.snapshotId);
    return {
      snapshotId: request.snapshotId,
      graph: buildRulesGraph(ruleset, request.filters),
    };
  }
}
