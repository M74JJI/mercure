import type {
  AnalyzeRulesetSnapshotFieldsResult,
  AnalyzeRulesetSnapshotRoundtripResult,
  BuildRulesetSnapshotGraphResult,
  CompareRulesetSnapshotsResult,
  ScoreRulesetSnapshotQualityResult,
  ListRulesUseCases,
} from '@mercure/rules-backend-application';

import type {
  RulesFieldIntelligenceQueryDto,
  RulesQualityQueryDto,
  RulesRoundtripQueryDto,
  RulesSnapshotCompareQueryDto,
  RulesUseCaseListQueryDto,
} from './rules-intelligence.dto';

const NESTED_REFERENCE_LIMIT = 25;

function page<T>(items: readonly T[], offset: number, limit: number) {
  return {
    offset,
    limit,
    total: items.length,
    items: items.slice(offset, offset + limit),
  };
}

function includesQuery(values: readonly string[], query: string | undefined): boolean {
  if (!query) return true;
  const normalized = query.toLowerCase();
  return values.some((value) => value.toLowerCase().includes(normalized));
}

export function presentFieldIntelligence(
  result: AnalyzeRulesetSnapshotFieldsResult,
  query: RulesFieldIntelligenceQueryDto,
) {
  const rows = result.intelligence.rows
    .filter((row) => !query.tenant || row.tenant === query.tenant)
    .filter((row) => !query.health || row.health === query.health)
    .filter((row) => !query.criticality || row.criticality === query.criticality)
    .filter((row) => !query.family || row.family === query.family)
    .filter((row) =>
      includesQuery(
        [row.field, row.canonical, row.family, row.description, ...row.aliases],
        query.query,
      ),
    )
    .map((row) => ({
      key: row.key,
      tenant: row.tenant,
      field: row.field,
      canonical: row.canonical,
      family: row.family,
      description: row.description,
      aliases: [...row.aliases],
      producedBy: row.producedBy.slice(0, NESTED_REFERENCE_LIMIT).map((reference) => ({
        tenant: reference.tenant,
        id: reference.name,
      })),
      producedByTotal: row.producedBy.length,
      usedByRules: row.usedByRules.slice(0, NESTED_REFERENCE_LIMIT).map((reference) => ({
        tenant: reference.tenant,
        id: reference.ruleId,
        level: reference.level,
        severity: reference.severity,
        jiraVisible: reference.jiraVisible,
      })),
      usedByRulesTotal: row.usedByRules.length,
      usedByUseCases: row.usedByUseCases.slice(0, NESTED_REFERENCE_LIMIT),
      usedByUseCasesTotal: row.usedByUseCases.length,
      jiraVisibleRules: row.jiraVisibleRules,
      criticalRules: row.criticalRules,
      decodedAsRules: row.decodedAsRules.slice(0, NESTED_REFERENCE_LIMIT),
      decodedAsRulesTotal: row.decodedAsRules.length,
      health: row.health,
      criticality: row.criticality,
      riskScore: row.riskScore,
      aliasHints: row.aliasHints.slice(0, NESTED_REFERENCE_LIMIT).map((hint) => ({
        field: hint.field,
        alias: hint.alias,
        reason: hint.reason,
      })),
      aliasHintsTotal: row.aliasHints.length,
    }));

  return {
    snapshotId: result.snapshotId,
    stats: result.intelligence.stats,
    page: page(rows, query.offset, query.limit),
  };
}

export function presentQuality(
  result: ScoreRulesetSnapshotQualityResult,
  query: RulesQualityQueryDto,
) {
  if (query.kind === 'use_cases') {
    const items = result.quality.useCases
      .filter((item) => !query.tenant || item.tenant === query.tenant)
      .filter((item) => !query.grade || item.grade === query.grade)
      .filter((item) => !query.useCaseId || item.useCaseId === query.useCaseId)
      .filter((item) =>
        includesQuery([item.tenant, item.useCaseId, ...item.weakSignals], query.query),
      );

    return {
      snapshotId: result.snapshotId,
      kind: query.kind,
      stats: result.quality.stats,
      useCases: page(items, query.offset, query.limit),
    };
  }

  const items = result.quality.rules
    .filter((item) => !query.tenant || item.tenant === query.tenant)
    .filter((item) => !query.grade || item.grade === query.grade)
    .filter((item) => !query.useCaseId || item.useCaseId === query.useCaseId)
    .filter((item) =>
      includesQuery(
        [
          item.tenant,
          item.ruleId,
          item.description,
          item.useCaseId,
          item.role,
          item.status,
          ...item.strengths,
          ...item.warnings,
          ...item.recommendations,
        ],
        query.query,
      ),
    );

  return {
    snapshotId: result.snapshotId,
    kind: query.kind,
    stats: result.quality.stats,
    rules: page(items, query.offset, query.limit),
  };
}

export function presentGraph(result: BuildRulesetSnapshotGraphResult, nodeLimit: number) {
  const nodes = result.graph.nodes.slice(0, nodeLimit);
  const allowedNodeIds = new Set(nodes.map((node) => node.id));
  const edgeLimit = Math.min(nodeLimit * 4, 2_000);
  const edges = result.graph.edges
    .filter((edge) => allowedNodeIds.has(edge.source) && allowedNodeIds.has(edge.target))
    .slice(0, edgeLimit);

  return {
    snapshotId: result.snapshotId,
    graph: {
      nodes,
      edges,
      stats: {
        nodes: nodes.length,
        edges: edges.length,
        rules: nodes.filter((node) => node.type === 'rule').length,
        decoders: nodes.filter((node) => node.type === 'decoder').length,
        fields: nodes.filter((node) => node.type === 'field').length,
        groups: nodes.filter((node) => node.type === 'group').length,
        useCases: nodes.filter((node) => node.type === 'use_case').length,
        mitre: nodes.filter((node) => node.type === 'mitre').length,
        external: nodes.filter((node) => node.type === 'external').length,
      },
    },
  };
}

type RulesDiff = CompareRulesetSnapshotsResult['diff'];
type RuleDiffRecord = NonNullable<RulesDiff['rules']['added'][number]['after']>;
type DecoderDiffRecord = NonNullable<RulesDiff['decoders']['added'][number]['after']>;
type FileDiffRecord = NonNullable<RulesDiff['files']['added'][number]['after']>;
type IssueDiffRecord = NonNullable<RulesDiff['issues']['added'][number]['after']>;

function safeRule(record: RuleDiffRecord): Readonly<Record<string, unknown>> {
  return {
    id: record.id,
    level: record.level,
    description: record.description,
    groups: record.groups,
    status: record.status,
    role: record.role,
    severity: record.severity,
    jiraVisible: record.jiraVisible,
    tenant: record.tenant,
    sourceFile: record.sourceFile,
    ...(record.sourceSection === undefined ? {} : { sourceSection: record.sourceSection }),
    useCaseId: record.useCaseId,
    useCaseConfidence: record.useCaseConfidence,
    mitre: record.mitre,
    dependencies: record.dependencies,
    fields: record.fields,
    ...(record.frequency === undefined ? {} : { frequency: record.frequency }),
    ...(record.timeframe === undefined ? {} : { timeframe: record.timeframe }),
    decodedAs: record.decodedAs,
    options: record.options,
  };
}

function safeDecoder(record: DecoderDiffRecord): Readonly<Record<string, unknown>> {
  return {
    name: record.name,
    ...(record.parent === undefined ? {} : { parent: record.parent }),
    prematch: record.prematch,
    regex: record.regex,
    orderFields: record.orderFields,
    tenant: record.tenant,
    sourceFile: record.sourceFile,
  };
}

function safeFile(record: FileDiffRecord): Readonly<Record<string, unknown>> {
  return {
    name: record.name,
    tenant: record.tenant,
    size: record.size,
    type: record.type,
    sha256: record.sha256,
  };
}

function safeIssue(record: IssueDiffRecord): Readonly<Record<string, unknown>> {
  return {
    severity: record.severity,
    type: record.type,
    title: record.title,
    detail: record.detail,
    ...(record.ruleId === undefined ? {} : { ruleId: record.ruleId }),
    ...(record.decoderName === undefined ? {} : { decoderName: record.decoderName }),
    ...(record.fileName === undefined ? {} : { fileName: record.fileName }),
    ...(record.tenant === undefined ? {} : { tenant: record.tenant }),
  };
}

function diffItem(
  key: string,
  state: 'added' | 'removed' | 'changed' | 'resolved',
  changes: readonly string[] | undefined,
  before: Readonly<Record<string, unknown>> | undefined,
  after: Readonly<Record<string, unknown>> | undefined,
) {
  return {
    key,
    state,
    changes: [...(changes ?? [])],
    ...(before === undefined ? {} : { before }),
    ...(after === undefined ? {} : { after }),
  };
}

export function presentSnapshotComparison(
  result: CompareRulesetSnapshotsResult,
  query: RulesSnapshotCompareQueryDto,
) {
  const items = (() => {
    if (query.kind === 'rules') {
      return [
        ...result.diff.rules.added.map((item) =>
          diffItem(item.key, 'added', item.changes, undefined, item.after && safeRule(item.after)),
        ),
        ...result.diff.rules.removed.map((item) =>
          diffItem(
            item.key,
            'removed',
            item.changes,
            item.before && safeRule(item.before),
            undefined,
          ),
        ),
        ...result.diff.rules.changed.map((item) =>
          diffItem(
            item.key,
            'changed',
            item.changes,
            item.before && safeRule(item.before),
            item.after && safeRule(item.after),
          ),
        ),
      ];
    }

    if (query.kind === 'decoders') {
      return [
        ...result.diff.decoders.added.map((item) =>
          diffItem(
            item.key,
            'added',
            item.changes,
            undefined,
            item.after && safeDecoder(item.after),
          ),
        ),
        ...result.diff.decoders.removed.map((item) =>
          diffItem(
            item.key,
            'removed',
            item.changes,
            item.before && safeDecoder(item.before),
            undefined,
          ),
        ),
        ...result.diff.decoders.changed.map((item) =>
          diffItem(
            item.key,
            'changed',
            item.changes,
            item.before && safeDecoder(item.before),
            item.after && safeDecoder(item.after),
          ),
        ),
      ];
    }

    if (query.kind === 'files') {
      return [
        ...result.diff.files.added.map((item) =>
          diffItem(item.key, 'added', item.changes, undefined, item.after && safeFile(item.after)),
        ),
        ...result.diff.files.removed.map((item) =>
          diffItem(
            item.key,
            'removed',
            item.changes,
            item.before && safeFile(item.before),
            undefined,
          ),
        ),
        ...result.diff.files.changed.map((item) =>
          diffItem(
            item.key,
            'changed',
            item.changes,
            item.before && safeFile(item.before),
            item.after && safeFile(item.after),
          ),
        ),
      ];
    }

    if (query.kind === 'use_cases') {
      return [
        ...result.diff.useCases.added.map((item) =>
          diffItem(
            item.key,
            'added',
            item.changes,
            undefined,
            item.after === undefined ? undefined : { id: item.after },
          ),
        ),
        ...result.diff.useCases.removed.map((item) =>
          diffItem(
            item.key,
            'removed',
            item.changes,
            item.before === undefined ? undefined : { id: item.before },
            undefined,
          ),
        ),
      ];
    }

    return [
      ...result.diff.issues.added.map((item) =>
        diffItem(item.key, 'added', item.changes, undefined, item.after && safeIssue(item.after)),
      ),
      ...result.diff.issues.resolved.map((item) =>
        diffItem(
          item.key,
          'resolved',
          item.changes,
          item.before && safeIssue(item.before),
          undefined,
        ),
      ),
    ];
  })();

  return {
    beforeSnapshotId: result.beforeSnapshotId,
    afterSnapshotId: result.afterSnapshotId,
    kind: query.kind,
    summary: result.diff.summary,
    page: page(items, query.offset, query.limit),
  };
}

export function presentRoundtrip(
  result: AnalyzeRulesetSnapshotRoundtripResult,
  query: RulesRoundtripQueryDto,
) {
  const { analysis } = result;

  return {
    snapshotId: result.snapshotId,
    summary: analysis.summary,
    sourceSections: page(analysis.sourceSections, query.offset, query.limit),
    commentedRules: page(
      analysis.commentedRules.map((rule) => ({
        tenant: rule.tenant,
        fileName: rule.fileName,
        ruleId: rule.ruleId,
        ...(rule.level === undefined ? {} : { level: rule.level }),
        ...(rule.description === undefined ? {} : { description: rule.description }),
      })),
      query.offset,
      query.limit,
    ),
    groupFlows: page(analysis.groupFlows, query.offset, query.limit),
    missingUseCaseSuggestions: page(
      analysis.missingUseCaseSuggestions.map((suggestion) => ({
        tenant: suggestion.tenant,
        ruleId: suggestion.ruleId,
        sourceFile: suggestion.sourceFile,
        ...(suggestion.sourceSection === undefined
          ? {}
          : { sourceSection: suggestion.sourceSection }),
        useCaseId: suggestion.useCaseId,
        confidence: suggestion.confidence,
        placement: suggestion.placement,
      })),
      query.offset,
      query.limit,
    ),
  };
}

type RulesUseCase = Awaited<ReturnType<ListRulesUseCases['execute']>>[number];

export function presentUseCases(items: readonly RulesUseCase[], query: RulesUseCaseListQueryDto) {
  const filtered = items
    .filter((item) => !query.source || item.source === query.source)
    .filter((item) =>
      includesQuery(
        [
          item.id,
          item.name,
          item.shortName,
          item.description,
          item.component,
          item.vendor,
          item.product,
          item.domain,
          item.category,
          item.createdBy,
        ],
        query.query,
      ),
    );

  return page(filtered, query.offset, query.limit);
}
