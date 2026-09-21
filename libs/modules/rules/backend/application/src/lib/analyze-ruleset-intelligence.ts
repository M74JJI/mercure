import {
  buildFieldIntelligence,
  buildQualitySummary,
  buildRulesGraph,
  type FieldIntelligenceSummary,
  type QualitySummary,
  type RulesGraphData,
  type RulesGraphFilters,
} from '@mercure/rules-backend-domain';

import { BoundedAsyncCache } from './bounded-async-cache';
import type {
  RulesetSnapshotAnalysisProfile,
  RulesetSnapshotAnalysisSource,
} from './analyze-ruleset-snapshots';
import { RulesetSnapshotNotFoundError } from './query-ruleset-snapshots';

async function requireSnapshot(
  source: RulesetSnapshotAnalysisSource,
  snapshotId: string,
  profile: RulesetSnapshotAnalysisProfile,
) {
  const ruleset = await source.load(snapshotId, profile);
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
  private readonly cache = new BoundedAsyncCache<AnalyzeRulesetSnapshotFieldsResult>(4);

  constructor(private readonly source: RulesetSnapshotAnalysisSource) {}

  execute(snapshotId: string): Promise<AnalyzeRulesetSnapshotFieldsResult> {
    return this.cache.getOrLoad(snapshotId, async () => {
      const ruleset = await requireSnapshot(this.source, snapshotId, 'fields');
      return {
        snapshotId,
        intelligence: buildFieldIntelligence(ruleset),
      };
    });
  }
}

export interface ScoreRulesetSnapshotQualityResult {
  readonly snapshotId: string;
  readonly quality: QualitySummary;
}

export class ScoreRulesetSnapshotQuality {
  private readonly cache = new BoundedAsyncCache<ScoreRulesetSnapshotQualityResult>(4);

  constructor(private readonly source: RulesetSnapshotAnalysisSource) {}

  execute(snapshotId: string): Promise<ScoreRulesetSnapshotQualityResult> {
    return this.cache.getOrLoad(snapshotId, async () => {
      const ruleset = await requireSnapshot(this.source, snapshotId, 'quality');
      return {
        snapshotId,
        quality: buildQualitySummary(ruleset),
      };
    });
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

function graphCacheKey(request: BuildRulesetSnapshotGraphRequest): string {
  const filters = request.filters;
  return JSON.stringify([
    request.snapshotId,
    filters.mode,
    filters.query ?? null,
    filters.tenant ?? null,
    filters.useCaseId ?? null,
    filters.status ?? null,
    filters.role ?? null,
    filters.jiraOnly ?? null,
    filters.includeExternal ?? null,
    filters.limit ?? null,
  ]);
}

export class BuildRulesetSnapshotGraph {
  private readonly cache = new BoundedAsyncCache<BuildRulesetSnapshotGraphResult>(16);

  constructor(private readonly source: RulesetSnapshotAnalysisSource) {}

  execute(request: BuildRulesetSnapshotGraphRequest): Promise<BuildRulesetSnapshotGraphResult> {
    return this.cache.getOrLoad(graphCacheKey(request), async () => {
      const ruleset = await requireSnapshot(this.source, request.snapshotId, 'graph');
      return {
        snapshotId: request.snapshotId,
        graph: buildRulesGraph(ruleset, request.filters),
      };
    });
  }
}
