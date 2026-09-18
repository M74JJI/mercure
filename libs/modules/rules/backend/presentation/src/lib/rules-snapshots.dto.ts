import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const fingerprintSchema = z.string().regex(/^[a-f0-9]{64}$/);
const paginationShape = {
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(200).default(50),
};

const ruleSeveritySchema = z.enum([
  'informational',
  'low',
  'medium',
  'high',
  'critical',
]);
const validationSeveritySchema = z.enum(['error', 'warning', 'info']);
const useCaseConfidenceSchema = z.enum(['confirmed', 'inferred', 'unassigned']);
const dependencyTypeSchema = z.enum([
  'if_sid',
  'if_group',
  'if_matched_sid',
  'if_matched_group',
  'decoded_as',
]);

const snapshotSchema = z
  .object({
    id: z.string().uuid(),
    sourceFingerprint: fingerprintSchema,
    contentFingerprint: fingerprintSchema,
    loadedAt: z.string(),
    createdAt: z.string(),
    complete: z.boolean(),
    sourceErrorCount: z.number().int().min(0),
    archiveCount: z.number().int().min(0),
    fileCount: z.number().int().min(0),
    ruleCount: z.number().int().min(0),
    decoderCount: z.number().int().min(0),
    useCaseCount: z.number().int().min(0),
    jiraVisibleCount: z.number().int().min(0),
    testingCount: z.number().int().min(0),
    productionCount: z.number().int().min(0),
    criticalCount: z.number().int().min(0),
    mitreMappedCount: z.number().int().min(0),
    missingUseCaseCount: z.number().int().min(0),
    brokenDependencyCount: z.number().int().min(0),
  })
  .strict();

const ruleSchema = z
  .object({
    id: z.string(),
    level: z.number().int(),
    description: z.string(),
    groups: z.array(z.string()),
    status: z.string(),
    role: z.string(),
    severity: ruleSeveritySchema,
    jiraVisible: z.boolean(),
    tenant: z.string(),
    sourceFile: z.string(),
    sourceSection: z.string().optional(),
    useCaseId: z.string(),
    useCaseConfidence: useCaseConfidenceSchema,
    mitre: z.array(z.string()),
    dependencies: z.array(
      z
        .object({
          type: dependencyTypeSchema,
          value: z.string(),
        })
        .strict(),
    ),
    fields: z.array(
      z
        .object({
          name: z.string(),
          type: z.string().optional(),
          value: z.string(),
        })
        .strict(),
    ),
    frequency: z.string().optional(),
    timeframe: z.string().optional(),
    decodedAs: z.array(z.string()),
    options: z.array(z.string()),
  })
  .strict();

const decoderSchema = z
  .object({
    name: z.string(),
    parent: z.string().optional(),
    prematch: z.array(z.string()),
    regex: z.array(z.string()),
    orderFields: z.array(z.string()),
    tenant: z.string(),
    sourceFile: z.string(),
  })
  .strict();

const issueSchema = z
  .object({
    severity: validationSeveritySchema,
    type: z.string(),
    title: z.string(),
    detail: z.string(),
    ruleId: z.string().optional(),
    decoderName: z.string().optional(),
    fileName: z.string().optional(),
    tenant: z.string().optional(),
  })
  .strict();

const booleanQuerySchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export class RulesSnapshotParamsDto extends createZodDto(
  z
    .object({
      snapshotId: z.string().uuid(),
    })
    .strict(),
) {}

export class RulesSnapshotListQueryDto extends createZodDto(
  z.object(paginationShape).strict(),
) {}

export class RulesSnapshotRulesQueryDto extends createZodDto(
  z
    .object({
      ...paginationShape,
      tenant: z.string().trim().min(1).max(255).optional(),
      severity: ruleSeveritySchema.optional(),
      status: z.string().trim().min(1).max(64).optional(),
      useCaseId: z.string().trim().min(1).max(255).optional(),
      ruleId: z.string().trim().min(1).max(64).optional(),
      jiraVisible: booleanQuerySchema.optional(),
    })
    .strict(),
) {}

export class RulesSnapshotDecodersQueryDto extends createZodDto(
  z
    .object({
      ...paginationShape,
      tenant: z.string().trim().min(1).max(255).optional(),
      name: z.string().trim().min(1).max(512).optional(),
    })
    .strict(),
) {}

export class RulesSnapshotIssuesQueryDto extends createZodDto(
  z
    .object({
      ...paginationShape,
      severity: validationSeveritySchema.optional(),
      type: z.string().trim().min(1).max(128).optional(),
    })
    .strict(),
) {}

export class RulesSnapshotDocument extends createZodDto(snapshotSchema) {}

export class RulesSnapshotPageDocument extends createZodDto(
  z
    .object({
      offset: z.number().int().min(0),
      limit: z.number().int().min(1).max(200),
      total: z.number().int().min(0),
      items: z.array(snapshotSchema),
    })
    .strict(),
) {}

export class RulesSnapshotRulePageDocument extends createZodDto(
  z
    .object({
      offset: z.number().int().min(0),
      limit: z.number().int().min(1).max(200),
      total: z.number().int().min(0),
      items: z.array(ruleSchema),
    })
    .strict(),
) {}

export class RulesSnapshotDecoderPageDocument extends createZodDto(
  z
    .object({
      offset: z.number().int().min(0),
      limit: z.number().int().min(1).max(200),
      total: z.number().int().min(0),
      items: z.array(decoderSchema),
    })
    .strict(),
) {}

export class RulesSnapshotIssuePageDocument extends createZodDto(
  z
    .object({
      offset: z.number().int().min(0),
      limit: z.number().int().min(1).max(200),
      total: z.number().int().min(0),
      items: z.array(issueSchema),
    })
    .strict(),
) {}
