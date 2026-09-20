import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const paginationShape = {
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
};

const booleanQuerySchema = z.enum(['true', 'false']).transform((value) => value === 'true');
const qualityGradeSchema = z.enum(['excellent', 'good', 'needs_review', 'risky', 'broken']);
const fieldHealthSchema = z.enum([
  'healthy',
  'underused',
  'unknown_source',
  'alias_candidate',
  'orphaned',
]);
const fieldCriticalitySchema = z.enum(['critical', 'high', 'medium', 'low']);
const graphModeSchema = z.enum([
  'rules',
  'decoders',
  'decoder_rules',
  'use_cases',
  'mitre',
  'fields',
  'all',
]);

export class RulesIntelligenceSnapshotParamsDto extends createZodDto(
  z.object({ snapshotId: z.string().uuid() }).strict(),
) {}

export class RulesUseCaseParamsDto extends createZodDto(
  z
    .object({
      useCaseId: z
        .string()
        .trim()
        .regex(/^uc_[a-z0-9_]+$/)
        .max(255),
    })
    .strict(),
) {}

export class RulesFieldIntelligenceQueryDto extends createZodDto(
  z
    .object({
      ...paginationShape,
      tenant: z.string().trim().min(1).max(255).optional(),
      health: fieldHealthSchema.optional(),
      criticality: fieldCriticalitySchema.optional(),
      family: z.string().trim().min(1).max(128).optional(),
      query: z.string().trim().min(1).max(256).optional(),
    })
    .strict(),
) {}

export class RulesQualityQueryDto extends createZodDto(
  z
    .object({
      ...paginationShape,
      kind: z.enum(['rules', 'use_cases']).default('rules'),
      tenant: z.string().trim().min(1).max(255).optional(),
      grade: qualityGradeSchema.optional(),
      useCaseId: z.string().trim().min(1).max(255).optional(),
      query: z.string().trim().min(1).max(256).optional(),
    })
    .strict(),
) {}

export class RulesGraphQueryDto extends createZodDto(
  z
    .object({
      mode: graphModeSchema.default('all'),
      query: z.string().trim().min(1).max(256).optional(),
      tenant: z.string().trim().min(1).max(255).optional(),
      useCaseId: z.string().trim().min(1).max(255).optional(),
      status: z.string().trim().min(1).max(64).optional(),
      role: z.string().trim().min(1).max(64).optional(),
      jiraOnly: booleanQuerySchema.optional(),
      includeExternal: booleanQuerySchema.optional(),
      limit: z.coerce.number().int().min(1).max(500).default(200),
    })
    .strict(),
) {}

export class RulesSnapshotCompareQueryDto extends createZodDto(
  z
    .object({
      beforeSnapshotId: z.string().uuid(),
      afterSnapshotId: z.string().uuid(),
      kind: z.enum(['rules', 'decoders', 'files', 'use_cases', 'issues']).default('rules'),
      ...paginationShape,
    })
    .strict(),
) {}

export class RulesRoundtripQueryDto extends createZodDto(z.object(paginationShape).strict()) {}

export class RulesUseCaseListQueryDto extends createZodDto(
  z
    .object({
      ...paginationShape,
      source: z.enum(['system', 'custom']).optional(),
      query: z.string().trim().min(1).max(256).optional(),
    })
    .strict(),
) {}

const pageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z
    .object({
      offset: z.number().int().min(0),
      limit: z.number().int().min(1).max(500),
      total: z.number().int().min(0),
      items: z.array(item),
    })
    .strict();

const fieldReferenceSchema = z
  .object({
    tenant: z.string(),
    id: z.string(),
  })
  .strict();

const fieldRowSchema = z
  .object({
    key: z.string(),
    tenant: z.string(),
    field: z.string(),
    canonical: z.string(),
    family: z.string(),
    description: z.string(),
    aliases: z.array(z.string()),
    producedBy: z.array(fieldReferenceSchema),
    producedByTotal: z.number().int().min(0),
    usedByRules: z.array(
      fieldReferenceSchema.extend({
        level: z.number().int(),
        severity: z.enum(['informational', 'low', 'medium', 'high', 'critical']),
        jiraVisible: z.boolean(),
      }),
    ),
    usedByRulesTotal: z.number().int().min(0),
    usedByUseCases: z.array(z.string()),
    usedByUseCasesTotal: z.number().int().min(0),
    jiraVisibleRules: z.number().int().min(0),
    criticalRules: z.number().int().min(0),
    decodedAsRules: z.array(z.string()),
    decodedAsRulesTotal: z.number().int().min(0),
    health: fieldHealthSchema,
    criticality: fieldCriticalitySchema,
    riskScore: z.number().int().min(0).max(100),
    aliasHints: z.array(
      z
        .object({
          field: z.string(),
          alias: z.string(),
          reason: z.string(),
        })
        .strict(),
    ),
    aliasHintsTotal: z.number().int().min(0),
  })
  .strict();

export class RulesFieldIntelligenceDocument extends createZodDto(
  z
    .object({
      snapshotId: z.string().uuid(),
      stats: z
        .object({
          totalFields: z.number().int().min(0),
          producedFields: z.number().int().min(0),
          usedFields: z.number().int().min(0),
          unknownSourceFields: z.number().int().min(0),
          orphanedProducedFields: z.number().int().min(0),
          aliasCandidates: z.number().int().min(0),
          criticalFields: z.number().int().min(0),
          averageRisk: z.number().int().min(0).max(100),
        })
        .strict(),
      page: pageSchema(fieldRowSchema),
    })
    .strict(),
) {}

const qualityDimensionsSchema = z
  .object({
    quality: z.number().int().min(0).max(100),
    noiseControl: z.number().int().min(0).max(100),
    decoderConfidence: z.number().int().min(0).max(100),
    dependencyHealth: z.number().int().min(0).max(100),
    mitreQuality: z.number().int().min(0).max(100),
    jiraReadiness: z.number().int().min(0).max(100),
    qaReadiness: z.number().int().min(0).max(100),
    clientReadiness: z.number().int().min(0).max(100),
  })
  .strict();

const ruleQualitySchema = z
  .object({
    key: z.string(),
    tenant: z.string(),
    ruleId: z.string(),
    description: z.string(),
    useCaseId: z.string(),
    level: z.number().int(),
    role: z.string(),
    status: z.string(),
    jiraVisible: z.boolean(),
    overall: z.number().int().min(0).max(100),
    grade: qualityGradeSchema,
    dimensions: qualityDimensionsSchema,
    strengths: z.array(z.string()),
    warnings: z.array(z.string()),
    recommendations: z.array(z.string()),
  })
  .strict();

const useCaseQualitySchema = z
  .object({
    key: z.string(),
    tenant: z.string(),
    useCaseId: z.string(),
    rules: z.number().int().min(0),
    jiraVisible: z.number().int().min(0),
    average: z.number().int().min(0).max(100),
    grade: qualityGradeSchema,
    weakSignals: z.array(z.string()),
  })
  .strict();

const qualityStatsSchema = z
  .object({
    averageOverall: z.number().int().min(0).max(100),
    excellent: z.number().int().min(0),
    good: z.number().int().min(0),
    needsReview: z.number().int().min(0),
    risky: z.number().int().min(0),
    broken: z.number().int().min(0),
    jiraReady: z.number().int().min(0),
    noisyCandidates: z.number().int().min(0),
    weakDecoderConfidence: z.number().int().min(0),
    weakMitreQuality: z.number().int().min(0),
  })
  .strict();

export class RulesQualityDocument extends createZodDto(
  z
    .object({
      snapshotId: z.string().uuid(),
      kind: z.enum(['rules', 'use_cases']),
      stats: qualityStatsSchema,
      rules: pageSchema(ruleQualitySchema).optional(),
      useCases: pageSchema(useCaseQualitySchema).optional(),
    })
    .strict(),
) {}

const graphNodeSchema = z
  .object({
    id: z.string(),
    type: z.enum(['rule', 'decoder', 'use_case', 'mitre', 'field', 'group', 'external']),
    label: z.string(),
    weight: z.number(),
    tenant: z.string().optional(),
    entityId: z.string().optional(),
    meta: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  })
  .strict();

const graphEdgeSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    type: z.enum([
      'if_sid',
      'if_group',
      'if_matched_sid',
      'if_matched_group',
      'decoded_as',
      'decoder_parent',
      'group_produces',
      'field_produces',
      'field_uses',
      'use_case',
      'mitre',
    ]),
    label: z.string(),
    weight: z.number(),
  })
  .strict();

export class RulesGraphDocument extends createZodDto(
  z
    .object({
      snapshotId: z.string().uuid(),
      graph: z
        .object({
          nodes: z.array(graphNodeSchema),
          edges: z.array(graphEdgeSchema),
          stats: z
            .object({
              nodes: z.number().int().min(0),
              edges: z.number().int().min(0),
              rules: z.number().int().min(0),
              decoders: z.number().int().min(0),
              fields: z.number().int().min(0),
              groups: z.number().int().min(0),
              useCases: z.number().int().min(0),
              mitre: z.number().int().min(0),
              external: z.number().int().min(0),
            })
            .strict(),
        })
        .strict(),
    })
    .strict(),
) {}

const diffSummarySchema = z
  .object({
    rulesAdded: z.number().int().min(0),
    rulesRemoved: z.number().int().min(0),
    rulesChanged: z.number().int().min(0),
    decodersAdded: z.number().int().min(0),
    decodersRemoved: z.number().int().min(0),
    decodersChanged: z.number().int().min(0),
    filesAdded: z.number().int().min(0),
    filesRemoved: z.number().int().min(0),
    filesChanged: z.number().int().min(0),
    useCasesAdded: z.number().int().min(0),
    useCasesRemoved: z.number().int().min(0),
    newIssues: z.number().int().min(0),
    resolvedIssues: z.number().int().min(0),
    jiraVisibilityChanged: z.number().int().min(0),
    severityChanged: z.number().int().min(0),
    mitreChanged: z.number().int().min(0),
    useCaseChanged: z.number().int().min(0),
  })
  .strict();

const diffItemSchema = z
  .object({
    key: z.string(),
    state: z.enum(['added', 'removed', 'changed', 'resolved']),
    changes: z.array(z.string()),
    before: z.record(z.string(), z.unknown()).optional(),
    after: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export class RulesSnapshotCompareDocument extends createZodDto(
  z
    .object({
      beforeSnapshotId: z.string().uuid(),
      afterSnapshotId: z.string().uuid(),
      kind: z.enum(['rules', 'decoders', 'files', 'use_cases', 'issues']),
      summary: diffSummarySchema,
      page: pageSchema(diffItemSchema),
    })
    .strict(),
) {}

const sourceSectionSchema = z
  .object({
    key: z.string(),
    tenant: z.string(),
    sourceFile: z.string(),
    hostFile: z.string(),
    ruleCount: z.number().int().min(0),
    minRuleId: z.number().int().optional(),
    maxRuleId: z.number().int().optional(),
    expectedPrefix: z.string().optional(),
    idRangeStatus: z.enum(['pass', 'warning', 'unknown']),
    statusSummary: z.string(),
  })
  .strict();

const commentedRuleSchema = z
  .object({
    tenant: z.string(),
    fileName: z.string(),
    ruleId: z.string(),
    level: z.string().optional(),
    description: z.string().optional(),
  })
  .strict();

const groupFlowSchema = z
  .object({
    tenant: z.string(),
    group: z.string(),
    producedByRules: z.array(z.string()),
    consumedByRules: z.array(z.string()),
    status: z.enum(['active', 'orphan_producer', 'missing_producer']),
  })
  .strict();

const suggestionSchema = z
  .object({
    tenant: z.string(),
    ruleId: z.string(),
    sourceFile: z.string(),
    sourceSection: z.string().optional(),
    useCaseId: z.string(),
    confidence: z.enum(['confirmed', 'inferred', 'unassigned']),
    placement: z.string(),
  })
  .strict();

export class RulesRoundtripDocument extends createZodDto(
  z
    .object({
      snapshotId: z.string().uuid(),
      summary: z
        .object({
          sourceSections: z.number().int().min(0),
          combinedFiles: z.number().int().min(0),
          commentedRules: z.number().int().min(0),
          idRangeWarnings: z.number().int().min(0),
          orphanGroups: z.number().int().min(0),
          missingGroupProducers: z.number().int().min(0),
          missingUseCaseSuggestions: z.number().int().min(0),
        })
        .strict(),
      sourceSections: pageSchema(sourceSectionSchema),
      commentedRules: pageSchema(commentedRuleSchema),
      groupFlows: pageSchema(groupFlowSchema),
      missingUseCaseSuggestions: pageSchema(suggestionSchema),
    })
    .strict(),
) {}

const useCaseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    shortName: z.string(),
    description: z.string(),
    component: z.string(),
    vendor: z.string(),
    product: z.string(),
    domain: z.string(),
    category: z.string(),
    source: z.enum(['system', 'custom']),
    createdBy: z.string(),
    createdAt: z.string().optional(),
  })
  .strict();

export class RulesUseCasePageDocument extends createZodDto(pageSchema(useCaseSchema)) {}
export class RulesUseCaseDocument extends createZodDto(useCaseSchema) {}
