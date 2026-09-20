import type {
  RulesetSourceType,
  ValidationIssue,
} from '@mercure/rules-backend-domain';

import type { AnalyzeRuleset } from './analyze-ruleset';
import type { PageRequest, PageResult } from './query-ruleset-snapshots';
import type { RulesUseCaseCatalogReader } from './use-case-catalog';

export const RULES_AUTHORING_DRAFT_STORE = Symbol('mercure.rules.authoring-draft-store');
export const RULES_AUTHORING_SOURCE = Symbol('mercure.rules.authoring-source');

export type RulesAuthoringDraftState = 'draft' | 'validated' | 'approved';
export type RulesAuthoringEventType = 'create' | 'edit' | 'validate' | 'approve';

export interface RulesAuthoringEvent {
  readonly eventType: RulesAuthoringEventType;
  readonly state: RulesAuthoringDraftState;
  readonly revision: number;
  readonly actorSubject: string;
  readonly createdAt: string;
}

export interface RulesAuthoringSourceFile {
  readonly snapshotId: string;
  readonly position: number;
  readonly name: string;
  readonly tenant: string;
  readonly sourceType: RulesetSourceType;
  readonly content: string;
}

export interface RulesAuthoringSource {
  getSnapshotFile(snapshotId: string, position: number): Promise<RulesAuthoringSourceFile | null>;
}

export interface RulesAuthoringValidationSummary {
  readonly revision: number;
  readonly sha256: string;
  readonly ruleCount: number;
  readonly decoderCount: number;
  readonly issueCount: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
  readonly validatedAt: string;
  readonly issues: readonly ValidationIssue[];
}

export interface RulesAuthoringDraft {
  readonly id: string;
  readonly sourceSnapshotId?: string;
  readonly sourceFilePosition?: number;
  readonly fileName: string;
  readonly tenant: string;
  readonly sourceType: Exclude<RulesetSourceType, 'unknown'>;
  readonly content: string;
  readonly sha256: string;
  readonly revision: number;
  readonly state: RulesAuthoringDraftState;
  readonly createdBy: string;
  readonly updatedBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly events: readonly RulesAuthoringEvent[];
  readonly validation?: RulesAuthoringValidationSummary;
  readonly approvedRevision?: number;
  readonly approvedSha256?: string;
  readonly approvedBy?: string;
  readonly approvedAt?: string;
}

export interface RulesAuthoringDraftSummary
  extends Omit<RulesAuthoringDraft, 'content' | 'events' | 'validation'> {
  readonly validation?: Omit<RulesAuthoringValidationSummary, 'issues'>;
}

export interface CreateRulesAuthoringDraftInput {
  readonly sourceSnapshotId: string;
  readonly sourceFilePosition: number;
  readonly actorSubject: string;
}

export interface CreateNewRulesAuthoringDraftInput {
  readonly fileName: string;
  readonly tenant: string;
  readonly sourceType: Exclude<RulesetSourceType, 'unknown'>;
  readonly actorSubject: string;
}

export interface UpdateRulesAuthoringDraftInput {
  readonly draftId: string;
  readonly expectedRevision: number;
  readonly content: string;
  readonly actorSubject: string;
}

export interface PersistRulesAuthoringValidationInput {
  readonly draftId: string;
  readonly expectedRevision: number;
  readonly expectedSha256: string;
  readonly ruleCount: number;
  readonly decoderCount: number;
  readonly issues: readonly ValidationIssue[];
  readonly actorSubject: string;
}

export interface ApproveRulesAuthoringDraftInput {
  readonly draftId: string;
  readonly expectedRevision: number;
  readonly expectedSha256: string;
  readonly actorSubject: string;
}

export interface RulesAuthoringDraftStore {
  list(request: PageRequest): Promise<PageResult<RulesAuthoringDraftSummary>>;
  get(id: string): Promise<RulesAuthoringDraft | null>;
  createFromSnapshot(
    source: Omit<RulesAuthoringSourceFile, 'sourceType'> & {
      readonly sourceType: Exclude<RulesetSourceType, 'unknown'>;
    },
    actorSubject: string,
  ): Promise<RulesAuthoringDraft>;
  createNew(
    input: {
      readonly fileName: string;
      readonly tenant: string;
      readonly sourceType: Exclude<RulesetSourceType, 'unknown'>;
      readonly content: string;
    },
    actorSubject: string,
  ): Promise<RulesAuthoringDraft>;
  update(input: UpdateRulesAuthoringDraftInput): Promise<RulesAuthoringDraft>;
  persistValidation(input: PersistRulesAuthoringValidationInput): Promise<RulesAuthoringDraft>;
  approve(input: ApproveRulesAuthoringDraftInput): Promise<RulesAuthoringDraft>;
}

export class RulesAuthoringDraftNotFoundError extends Error {
  constructor(readonly draftId: string) {
    super(`Rules authoring draft not found: ${draftId}`);
    this.name = 'RulesAuthoringDraftNotFoundError';
  }
}

export class RulesAuthoringSourceNotFoundError extends Error {
  constructor(
    readonly snapshotId: string,
    readonly position: number,
  ) {
    super(`Rules authoring source not found: ${snapshotId}#${position}`);
    this.name = 'RulesAuthoringSourceNotFoundError';
  }
}

export class RulesAuthoringUnsupportedSourceError extends Error {
  constructor(readonly sourceType: RulesetSourceType) {
    super(`Rules authoring does not support source type: ${sourceType}`);
    this.name = 'RulesAuthoringUnsupportedSourceError';
  }
}

export class RulesAuthoringConflictError extends Error {
  constructor(readonly draftId: string) {
    super(`Rules authoring draft changed concurrently: ${draftId}`);
    this.name = 'RulesAuthoringConflictError';
  }
}

export class RulesAuthoringInvalidStateError extends Error {
  constructor(
    readonly draftId: string,
    message: string,
  ) {
    super(message);
    this.name = 'RulesAuthoringInvalidStateError';
  }
}

export class RulesAuthoringContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RulesAuthoringContentValidationError';
  }
}

const MAX_DRAFT_BYTES = 1_048_576;

function actor(value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new RulesAuthoringContentValidationError('Actor subject is required.');
  return normalized;
}

function logicalFileName(value: string): string {
  const normalized = value.trim();
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,250}\.xml$/i.test(normalized) ||
    normalized.includes('..')
  ) {
    throw new RulesAuthoringContentValidationError(
      'Draft file name must be a logical XML file name without path separators or traversal.',
    );
  }
  return normalized;
}

function tenant(value: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,254}$/.test(normalized)) {
    throw new RulesAuthoringContentValidationError(
      'Draft tenant must be a bounded logical identifier.',
    );
  }
  return normalized;
}

function initialContent(sourceType: Exclude<RulesetSourceType, 'unknown'>): string {
  return sourceType === 'rules'
    ? '<group name="custom,">\n</group>\n'
    : '<decoder name="custom_decoder">\n</decoder>\n';
}

function content(value: string): string {
  if (!value.trim()) throw new RulesAuthoringContentValidationError('Draft XML must not be empty.');
  if (Buffer.byteLength(value, 'utf8') > MAX_DRAFT_BYTES) {
    throw new RulesAuthoringContentValidationError('Draft XML exceeds the 1 MiB authoring limit.');
  }
  if (value.includes('\0')) {
    throw new RulesAuthoringContentValidationError('Draft XML contains a NUL byte.');
  }
  return value;
}

async function requiredDraft(
  store: RulesAuthoringDraftStore,
  draftId: string,
): Promise<RulesAuthoringDraft> {
  const draft = await store.get(draftId);
  if (!draft) throw new RulesAuthoringDraftNotFoundError(draftId);
  return draft;
}

export class ListRulesAuthoringDrafts {
  constructor(private readonly store: RulesAuthoringDraftStore) {}

  execute(request: PageRequest): Promise<PageResult<RulesAuthoringDraftSummary>> {
    return this.store.list(request);
  }
}

export class GetRulesAuthoringDraft {
  constructor(private readonly store: RulesAuthoringDraftStore) {}
  async execute(id: string): Promise<RulesAuthoringDraft> {
    return requiredDraft(this.store, id);
  }
}

export class CreateRulesAuthoringDraft {
  constructor(
    private readonly source: RulesAuthoringSource,
    private readonly store: RulesAuthoringDraftStore,
  ) {}

  async execute(input: CreateRulesAuthoringDraftInput): Promise<RulesAuthoringDraft> {
    const source = await this.source.getSnapshotFile(
      input.sourceSnapshotId,
      input.sourceFilePosition,
    );
    if (!source) {
      throw new RulesAuthoringSourceNotFoundError(
        input.sourceSnapshotId,
        input.sourceFilePosition,
      );
    }
    if (source.sourceType === 'unknown') {
      throw new RulesAuthoringUnsupportedSourceError(source.sourceType);
    }
    content(source.content);
    return this.store.createFromSnapshot(
      { ...source, sourceType: source.sourceType },
      actor(input.actorSubject),
    );
  }
}

export class CreateNewRulesAuthoringDraft {
  constructor(private readonly store: RulesAuthoringDraftStore) {}

  execute(input: CreateNewRulesAuthoringDraftInput): Promise<RulesAuthoringDraft> {
    return this.store.createNew(
      {
        fileName: logicalFileName(input.fileName),
        tenant: tenant(input.tenant),
        sourceType: input.sourceType,
        content: initialContent(input.sourceType),
      },
      actor(input.actorSubject),
    );
  }
}

export class UpdateRulesAuthoringDraft {
  constructor(private readonly store: RulesAuthoringDraftStore) {}
  execute(input: UpdateRulesAuthoringDraftInput): Promise<RulesAuthoringDraft> {
    return this.store.update({
      ...input,
      content: content(input.content),
      actorSubject: actor(input.actorSubject),
    });
  }
}

export class ValidateRulesAuthoringDraft {
  constructor(
    private readonly store: RulesAuthoringDraftStore,
    private readonly analyzeRuleset: AnalyzeRuleset,
    private readonly useCases: RulesUseCaseCatalogReader,
  ) {}

  async execute(
    draftId: string,
    expectedRevision: number,
    actorSubject: string,
  ): Promise<RulesAuthoringDraft> {
    const draft = await requiredDraft(this.store, draftId);
    if (draft.revision !== expectedRevision) throw new RulesAuthoringConflictError(draftId);

    const analysis = await this.analyzeRuleset.execute({
      files: [{
        name: draft.fileName,
        content: draft.content,
        tenant: draft.tenant,
        type: draft.sourceType,
      }],
      useCases: await this.useCases.list(),
    });

    const issues = [...analysis.issues];
    if (draft.sourceType === 'rules' && analysis.rules.length === 0) {
      issues.push({
        severity: 'error',
        type: 'authoring_empty_rules_file',
        title: 'No rules were parsed',
        detail: 'The draft is a rules source but contains no parseable <rule> blocks.',
        fileName: draft.fileName,
        tenant: draft.tenant,
      });
    }
    if (draft.sourceType === 'decoders' && analysis.decoders.length === 0) {
      issues.push({
        severity: 'error',
        type: 'authoring_empty_decoders_file',
        title: 'No decoders were parsed',
        detail: 'The draft is a decoder source but contains no parseable <decoder> blocks.',
        fileName: draft.fileName,
        tenant: draft.tenant,
      });
    }

    if (draft.sourceType === 'decoders') {
      for (const decoder of analysis.decoders) {
        if (
          decoder.parent === undefined &&
          decoder.prematch.length === 0 &&
          decoder.regex.length === 0 &&
          decoder.orderFields.length === 0
        ) {
          issues.push({
            severity: 'error',
            type: 'authoring_empty_decoder_definition',
            title: 'Decoder has no matching or extraction definition',
            detail:
              'Authoring requires each root decoder to define a parent, prematch, regex, or ordered extraction field before approval.',
            decoderName: decoder.name,
            fileName: draft.fileName,
            tenant: draft.tenant,
          });
        }
      }
    }

    return this.store.persistValidation({
      draftId,
      expectedRevision,
      expectedSha256: draft.sha256,
      ruleCount: analysis.rules.length,
      decoderCount: analysis.decoders.length,
      issues,
      actorSubject: actor(actorSubject),
    });
  }
}

export class ApproveRulesAuthoringDraft {
  constructor(private readonly store: RulesAuthoringDraftStore) {}

  async execute(
    draftId: string,
    expectedRevision: number,
    actorSubject: string,
  ): Promise<RulesAuthoringDraft> {
    const draft = await requiredDraft(this.store, draftId);
    if (
      draft.revision !== expectedRevision ||
      draft.validation?.revision !== draft.revision ||
      draft.validation.sha256 !== draft.sha256
    ) {
      throw new RulesAuthoringConflictError(draftId);
    }
    if (draft.validation.errorCount > 0) {
      throw new RulesAuthoringInvalidStateError(
        draftId,
        'A draft with validation errors cannot be approved.',
      );
    }
    return this.store.approve({
      draftId,
      expectedRevision,
      expectedSha256: draft.sha256,
      actorSubject: actor(actorSubject),
    });
  }
}

export interface RulesAuthoringExport {
  readonly draftId: string;
  readonly revision: number;
  readonly fileName: string;
  readonly sourceType: Exclude<RulesetSourceType, 'unknown'>;
  readonly sha256: string;
  readonly content: string;
}

export class ExportRulesAuthoringDraft {
  constructor(private readonly store: RulesAuthoringDraftStore) {}

  async execute(draftId: string): Promise<RulesAuthoringExport> {
    const draft = await requiredDraft(this.store, draftId);
    if (
      draft.state !== 'approved' ||
      draft.approvedRevision !== draft.revision ||
      draft.approvedSha256 !== draft.sha256
    ) {
      throw new RulesAuthoringInvalidStateError(
        draftId,
        'Only the unchanged approved revision can be exported.',
      );
    }
    return {
      draftId: draft.id,
      revision: draft.revision,
      fileName: draft.fileName,
      sourceType: draft.sourceType,
      sha256: draft.sha256,
      content: draft.content,
    };
  }
}
