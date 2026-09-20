import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const sourceTypeSchema = z.enum(['rules', 'decoders']);
const stateSchema = z.enum(['draft', 'validated', 'approved']);
const authoringEventSchema = z
  .object({
    eventType: z.enum(['create', 'edit', 'validate', 'approve']),
    state: stateSchema,
    revision: z.number().int().min(1),
    actorSubject: z.string(),
    createdAt: z.string(),
  })
  .strict();

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

const validationBase = {
  revision: z.number().int().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  ruleCount: z.number().int().min(0),
  decoderCount: z.number().int().min(0),
  issueCount: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  warningCount: z.number().int().min(0),
  infoCount: z.number().int().min(0),
  validatedAt: z.string(),
};

const validationSummarySchema = z
  .object({
    ...validationBase,
    issues: z.array(validationIssueSchema),
  })
  .strict();

const validationSummaryWithoutIssuesSchema = z.object(validationBase).strict();

const draftBase = {
  id: z.string().uuid(),
  sourceSnapshotId: z.string().uuid().optional(),
  sourceFilePosition: z.number().int().min(0).optional(),
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

export class RulesAuthoringDraftListQueryDto extends createZodDto(
  z
    .object({
      offset: z.coerce.number().int().min(0).default(0),
      limit: z.coerce.number().int().min(1).max(100).default(25),
    })
    .strict(),
) {}

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

export class RulesAuthoringDraftCreateNewDto extends createZodDto(
  z
    .object({
      fileName: z.string().min(5).max(255),
      tenant: z.string().min(1).max(255),
      sourceType: sourceTypeSchema,
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

const draftSchema = z
  .object({
    ...draftBase,
    content: z.string(),
    events: z.array(authoringEventSchema),
    validation: validationSummarySchema.optional(),
  })
  .strict();

const draftSummarySchema = z
  .object({
    ...draftBase,
    validation: validationSummaryWithoutIssuesSchema.optional(),
  })
  .strict();

export class RulesAuthoringDraftDocument extends createZodDto(draftSchema) {}

export class RulesAuthoringDraftSummaryDocument extends createZodDto(draftSummarySchema) {}

export class RulesAuthoringDraftListDocument extends createZodDto(
  z
    .object({
      offset: z.number().int().min(0),
      limit: z.number().int().min(1).max(100),
      total: z.number().int().min(0),
      items: z.array(draftSummarySchema),
    })
    .strict(),
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
