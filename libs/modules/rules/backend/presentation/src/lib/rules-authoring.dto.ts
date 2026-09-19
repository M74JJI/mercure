import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const sourceTypeSchema = z.enum(['rules', 'decoders']);
const stateSchema = z.enum(['draft', 'validated', 'approved']);
const validationIssueSchema = z
  .object({
    severity: z.enum(['error', 'warning', 'info']),
    type: z.string(),
    title: z.string(),
    detail: z.string(),
    ruleId: z.string().optional(),
    decoderName: z.string().optional(),
    fileName: z.string().optional(),
    tenant: z.string().optional(),
  })
  .strict();

const validationSummarySchema = z
  .object({
    revision: z.number().int().min(1),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    ruleCount: z.number().int().min(0),
    decoderCount: z.number().int().min(0),
    issueCount: z.number().int().min(0),
    errorCount: z.number().int().min(0),
    warningCount: z.number().int().min(0),
    infoCount: z.number().int().min(0),
    validatedAt: z.string(),
    issues: z.array(validationIssueSchema),
  })
  .strict();

const draftBase = {
  id: z.string().uuid(),
  sourceSnapshotId: z.string().uuid(),
  sourceFilePosition: z.number().int().min(0),
  fileName: z.string(),
  tenant: z.string(),
  sourceType: sourceTypeSchema,
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  revision: z.number().int().min(1),
  state: stateSchema,
  createdBy: z.string(),
  updatedBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  approvedRevision: z.number().int().min(1).optional(),
  approvedSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
};

export class RulesAuthoringDraftParamsDto extends createZodDto(
  z.object({ draftId: z.string().uuid() }).strict(),
) {}

export class RulesAuthoringDraftCreateDto extends createZodDto(
  z
    .object({
      sourceSnapshotId: z.string().uuid(),
      sourceFilePosition: z.number().int().min(0),
    })
    .strict(),
) {}

export class RulesAuthoringDraftUpdateDto extends createZodDto(
  z
    .object({
      expectedRevision: z.number().int().min(1),
      content: z.string().min(1).max(1_048_576),
    })
    .strict(),
) {}

export class RulesAuthoringDraftTransitionDto extends createZodDto(
  z.object({ expectedRevision: z.number().int().min(1) }).strict(),
) {}

export class RulesAuthoringDraftDocument extends createZodDto(
  z
    .object({
      ...draftBase,
      content: z.string(),
      validation: validationSummarySchema.optional(),
    })
    .strict(),
) {}

export class RulesAuthoringDraftSummaryDocument extends createZodDto(
  z
    .object({
      ...draftBase,
      validation: validationSummarySchema.omit({ issues: true }).optional(),
    })
    .strict(),
) {}

export class RulesAuthoringDraftListDocument extends createZodDto(
  z.array(z.object(RulesAuthoringDraftSummaryDocument.schema.shape).strict()),
) {}

export class RulesAuthoringExportDocument extends createZodDto(
  z
    .object({
      draftId: z.string().uuid(),
      revision: z.number().int().min(1),
      fileName: z.string(),
      sourceType: sourceTypeSchema,
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
      content: z.string(),
    })
    .strict(),
) {}
