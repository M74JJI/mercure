import { createHash } from 'node:crypto';

import type { PrismaClient } from '@mercure/platform-backend-database/client';
import {
  RulesAuthoringConflictError,
  RulesAuthoringDraftNotFoundError,
  type ApproveRulesAuthoringDraftInput,
  type PersistRulesAuthoringValidationInput,
  type RulesAuthoringDraft,
  type RulesAuthoringDraftState,
  type RulesAuthoringDraftStore,
  type RulesAuthoringDraftSummary,
  type RulesAuthoringSource,
  type RulesAuthoringSourceFile,
  type UpdateRulesAuthoringDraftInput,
} from '@mercure/rules-backend-application';
import type {
  RulesetSourceType,
  ValidationIssue,
  ValidationSeverity,
} from '@mercure/rules-backend-domain';

interface DraftRow {
  readonly id: string;
  readonly sourceSnapshotId: string;
  readonly sourceFilePosition: number;
  readonly fileName: string;
  readonly tenant: string;
  readonly sourceType: string;
  readonly content: string;
  readonly sha256: string;
  readonly revision: number;
  readonly state: string;
  readonly createdBy: string;
  readonly updatedBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly validatedRevision: number | null;
  readonly validatedSha256: string | null;
  readonly validatedRuleCount: number | null;
  readonly validatedDecoderCount: number | null;
  readonly validationIssueCount: number | null;
  readonly validationErrorCount: number | null;
  readonly validationWarningCount: number | null;
  readonly validationInfoCount: number | null;
  readonly validatedAt: Date | null;
  readonly approvedRevision: number | null;
  readonly approvedSha256: string | null;
  readonly approvedBy: string | null;
  readonly approvedAt: Date | null;
}

interface ValidationIssueRow {
  readonly severity: string;
  readonly type: string;
  readonly title: string;
  readonly detail: string;
  readonly ruleId: string | null;
  readonly decoderName: string | null;
  readonly fileName: string | null;
  readonly tenant: string | null;
}

function sourceType(value: string): Exclude<RulesetSourceType, 'unknown'> {
  if (value === 'rules' || value === 'decoders') return value;
  throw new Error(`Persisted Rules authoring source type is invalid: ${value}`);
}

function state(value: string): RulesAuthoringDraftState {
  if (value === 'draft' || value === 'validated' || value === 'approved') return value;
  throw new Error(`Persisted Rules authoring state is invalid: ${value}`);
}

function validationSeverity(value: string): ValidationSeverity {
  if (value === 'error' || value === 'warning' || value === 'info') return value;
  throw new Error(`Persisted Rules authoring validation severity is invalid: ${value}`);
}

function issue(row: ValidationIssueRow): ValidationIssue {
  return {
    severity: validationSeverity(row.severity),
    type: row.type,
    title: row.title,
    detail: row.detail,
    ...(row.ruleId === null ? {} : { ruleId: row.ruleId }),
    ...(row.decoderName === null ? {} : { decoderName: row.decoderName }),
    ...(row.fileName === null ? {} : { fileName: row.fileName }),
    ...(row.tenant === null ? {} : { tenant: row.tenant }),
  };
}

function contentSha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function detail(row: DraftRow, issues: readonly ValidationIssueRow[]): RulesAuthoringDraft {
  const validation =
    row.validatedRevision === null ||
    row.validatedSha256 === null ||
    row.validatedRuleCount === null ||
    row.validatedDecoderCount === null ||
    row.validationIssueCount === null ||
    row.validationErrorCount === null ||
    row.validationWarningCount === null ||
    row.validationInfoCount === null ||
    row.validatedAt === null
      ? undefined
      : {
          revision: row.validatedRevision,
          sha256: row.validatedSha256,
          ruleCount: row.validatedRuleCount,
          decoderCount: row.validatedDecoderCount,
          issueCount: row.validationIssueCount,
          errorCount: row.validationErrorCount,
          warningCount: row.validationWarningCount,
          infoCount: row.validationInfoCount,
          validatedAt: row.validatedAt.toISOString(),
          issues: issues.map(issue),
        };

  return {
    id: row.id,
    sourceSnapshotId: row.sourceSnapshotId,
    sourceFilePosition: row.sourceFilePosition,
    fileName: row.fileName,
    tenant: row.tenant,
    sourceType: sourceType(row.sourceType),
    content: row.content,
    sha256: row.sha256,
    revision: row.revision,
    state: state(row.state),
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(validation === undefined ? {} : { validation }),
    ...(row.approvedRevision === null ? {} : { approvedRevision: row.approvedRevision }),
    ...(row.approvedSha256 === null ? {} : { approvedSha256: row.approvedSha256 }),
    ...(row.approvedBy === null ? {} : { approvedBy: row.approvedBy }),
    ...(row.approvedAt === null ? {} : { approvedAt: row.approvedAt.toISOString() }),
  };
}

function summary(row: DraftRow): RulesAuthoringDraftSummary {
  const { content: _content, validation, ...rest } = detail(row, []);
  return {
    ...rest,
    ...(validation === undefined
      ? {}
      : {
          validation: {
            revision: validation.revision,
            sha256: validation.sha256,
            ruleCount: validation.ruleCount,
            decoderCount: validation.decoderCount,
            issueCount: validation.issueCount,
            errorCount: validation.errorCount,
            warningCount: validation.warningCount,
            infoCount: validation.infoCount,
            validatedAt: validation.validatedAt,
          },
        }),
  };
}

function issueCounts(issues: readonly ValidationIssue[]): Record<ValidationSeverity, number> {
  const result: Record<ValidationSeverity, number> = { error: 0, warning: 0, info: 0 };
  for (const item of issues) result[item.severity] += 1;
  return result;
}

export class PrismaRulesAuthoringStore implements RulesAuthoringDraftStore, RulesAuthoringSource {
  constructor(private readonly database: PrismaClient) {}

  async getSnapshotFile(
    snapshotId: string,
    position: number,
  ): Promise<RulesAuthoringSourceFile | null> {
    const row = await this.database.rulesetSnapshotFile.findUnique({
      where: { snapshotId_position: { snapshotId, position } },
      select: {
        snapshotId: true,
        position: true,
        name: true,
        tenant: true,
        sourceType: true,
        content: true,
      },
    });

    if (!row) return null;
    const type = row.sourceType as RulesetSourceType;
    if (type !== 'rules' && type !== 'decoders' && type !== 'unknown') {
      throw new Error(`Persisted Rules snapshot source type is invalid: ${row.sourceType}`);
    }

    return {
      snapshotId: row.snapshotId,
      position: row.position,
      name: row.name,
      tenant: row.tenant,
      sourceType: type,
      content: row.content,
    };
  }

  async list(): Promise<readonly RulesAuthoringDraftSummary[]> {
    const rows = await this.database.rulesAuthoringDraft.findMany({
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
    });
    return rows.map((row) => summary(row));
  }

  async get(id: string): Promise<RulesAuthoringDraft | null> {
    const row = await this.database.rulesAuthoringDraft.findUnique({ where: { id } });
    if (!row) return null;

    const issues =
      row.validatedRevision === null
        ? []
        : await this.database.rulesAuthoringDraftValidationIssue.findMany({
            where: { draftId: id, revision: row.validatedRevision },
            orderBy: { position: 'asc' },
          });

    return detail(row, issues);
  }

  async createFromSnapshot(
    source: Omit<RulesAuthoringSourceFile, 'sourceType'> & {
      readonly sourceType: Exclude<RulesetSourceType, 'unknown'>;
    },
    actorSubject: string,
  ): Promise<RulesAuthoringDraft> {
    const sha256 = contentSha256(source.content);

    const id = await this.database.$transaction(async (transaction) => {
      const row = await transaction.rulesAuthoringDraft.create({
        data: {
          sourceSnapshotId: source.snapshotId,
          sourceFilePosition: source.position,
          fileName: source.name,
          tenant: source.tenant,
          sourceType: source.sourceType,
          content: source.content,
          sha256,
          createdBy: actorSubject,
          updatedBy: actorSubject,
        },
        select: { id: true, revision: true, state: true },
      });

      await transaction.rulesAuthoringDraftEvent.create({
        data: {
          draftId: row.id,
          eventType: 'create',
          state: row.state,
          revision: row.revision,
          actorSubject,
        },
      });

      return row.id;
    });

    const created = await this.get(id);
    if (!created) throw new RulesAuthoringDraftNotFoundError(id);
    return created;
  }

  async update(input: UpdateRulesAuthoringDraftInput): Promise<RulesAuthoringDraft> {
    const sha256 = contentSha256(input.content);

    await this.database.$transaction(async (transaction) => {
      const result = await transaction.rulesAuthoringDraft.updateMany({
        where: { id: input.draftId, revision: input.expectedRevision },
        data: {
          content: input.content,
          sha256,
          revision: { increment: 1 },
          state: 'draft',
          updatedBy: input.actorSubject,
          validatedRevision: null,
          validatedSha256: null,
          validatedRuleCount: null,
          validatedDecoderCount: null,
          validationIssueCount: null,
          validationErrorCount: null,
          validationWarningCount: null,
          validationInfoCount: null,
          validatedAt: null,
          approvedRevision: null,
          approvedSha256: null,
          approvedBy: null,
          approvedAt: null,
        },
      });
      if (result.count !== 1) throw new RulesAuthoringConflictError(input.draftId);

      await transaction.rulesAuthoringDraftEvent.create({
        data: {
          draftId: input.draftId,
          eventType: 'edit',
          state: 'draft',
          revision: input.expectedRevision + 1,
          actorSubject: input.actorSubject,
        },
      });
    });

    const updated = await this.get(input.draftId);
    if (!updated) throw new RulesAuthoringDraftNotFoundError(input.draftId);
    return updated;
  }

  async persistValidation(
    input: PersistRulesAuthoringValidationInput,
  ): Promise<RulesAuthoringDraft> {
    const counts = issueCounts(input.issues);
    const validatedAt = new Date();

    await this.database.$transaction(async (transaction) => {
      const result = await transaction.rulesAuthoringDraft.updateMany({
        where: {
          id: input.draftId,
          revision: input.expectedRevision,
          sha256: input.expectedSha256,
        },
        data: {
          state: 'validated',
          updatedBy: input.actorSubject,
          validatedRevision: input.expectedRevision,
          validatedSha256: input.expectedSha256,
          validatedRuleCount: input.ruleCount,
          validatedDecoderCount: input.decoderCount,
          validationIssueCount: input.issues.length,
          validationErrorCount: counts.error,
          validationWarningCount: counts.warning,
          validationInfoCount: counts.info,
          validatedAt,
          approvedRevision: null,
          approvedSha256: null,
          approvedBy: null,
          approvedAt: null,
        },
      });
      if (result.count !== 1) throw new RulesAuthoringConflictError(input.draftId);

      await transaction.rulesAuthoringDraftValidationIssue.deleteMany({
        where: { draftId: input.draftId, revision: input.expectedRevision },
      });
      if (input.issues.length > 0) {
        await transaction.rulesAuthoringDraftValidationIssue.createMany({
          data: input.issues.map((item, position) => ({
            draftId: input.draftId,
            revision: input.expectedRevision,
            position,
            severity: item.severity,
            type: item.type,
            title: item.title,
            detail: item.detail,
            ...(item.ruleId === undefined ? {} : { ruleId: item.ruleId }),
            ...(item.decoderName === undefined ? {} : { decoderName: item.decoderName }),
            ...(item.fileName === undefined ? {} : { fileName: item.fileName }),
            ...(item.tenant === undefined ? {} : { tenant: item.tenant }),
          })),
        });
      }

      await transaction.rulesAuthoringDraftEvent.create({
        data: {
          draftId: input.draftId,
          eventType: 'validate',
          state: 'validated',
          revision: input.expectedRevision,
          actorSubject: input.actorSubject,
        },
      });
    });

    const validated = await this.get(input.draftId);
    if (!validated) throw new RulesAuthoringDraftNotFoundError(input.draftId);
    return validated;
  }

  async approve(input: ApproveRulesAuthoringDraftInput): Promise<RulesAuthoringDraft> {
    const approvedAt = new Date();

    await this.database.$transaction(async (transaction) => {
      const result = await transaction.rulesAuthoringDraft.updateMany({
        where: {
          id: input.draftId,
          revision: input.expectedRevision,
          sha256: input.expectedSha256,
          state: 'validated',
          validatedRevision: input.expectedRevision,
          validatedSha256: input.expectedSha256,
          validationErrorCount: 0,
        },
        data: {
          state: 'approved',
          updatedBy: input.actorSubject,
          approvedRevision: input.expectedRevision,
          approvedSha256: input.expectedSha256,
          approvedBy: input.actorSubject,
          approvedAt,
        },
      });
      if (result.count !== 1) throw new RulesAuthoringConflictError(input.draftId);

      await transaction.rulesAuthoringDraftEvent.create({
        data: {
          draftId: input.draftId,
          eventType: 'approve',
          state: 'approved',
          revision: input.expectedRevision,
          actorSubject: input.actorSubject,
        },
      });
    });

    const approved = await this.get(input.draftId);
    if (!approved) throw new RulesAuthoringDraftNotFoundError(input.draftId);
    return approved;
  }
}
