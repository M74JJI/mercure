import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  AnalyzeRuleset,
  ApproveRulesAuthoringDraft,
  CreateNewRulesAuthoringDraft,
  CreateRulesAuthoringDraft,
  ExportRulesAuthoringDraft,
  RulesAuthoringContentValidationError,
  RulesAuthoringInvalidStateError,
  UpdateRulesAuthoringDraft,
  ValidateRulesAuthoringDraft,
  type ApproveRulesAuthoringDraftInput,
  type PersistRulesAuthoringValidationInput,
  type RulesAuthoringDraft,
  type RulesAuthoringDraftStore,
  type RulesAuthoringDraftSummary,
  type RulesAuthoringSource,
  type RulesUseCaseCatalogReader,
  type UpdateRulesAuthoringDraftInput,
} from '@mercure/rules-backend-application';
import type { RulesetSourceType } from '@mercure/rules-backend-domain';

import { WazuhXmlRulesetAnalyzer } from './wazuh-xml-ruleset-analyzer';

const sourceSnapshotId = '20000000-0000-4000-8000-000000000001';
const draftId = '10000000-0000-4000-8000-000000000001';
const actor = 'admin-subject';

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

class TestAuthoringStore implements RulesAuthoringDraftStore, RulesAuthoringSource {
  private draft: RulesAuthoringDraft | null = null;

  constructor(
    private sourceContent: string,
    private readonly sourceType: Exclude<RulesetSourceType, 'unknown'> = 'rules',
  ) {}

  async getSnapshotFile(snapshotId: string, position: number) {
    if (snapshotId !== sourceSnapshotId || position !== 0) return null;
    return {
      snapshotId,
      position,
      name: this.sourceType === 'rules' ? 'rules/test.xml' : 'decoders/test.xml',
      tenant: 'manager-a',
      sourceType: this.sourceType,
      content: this.sourceContent,
    };
  }

  async list(request: { readonly offset: number; readonly limit: number }) {
    if (!this.draft) return { ...request, total: 0, items: [] };
    const draft = this.draft;
    const items: RulesAuthoringDraftSummary[] = [
      {
        id: draft.id,
        ...(draft.sourceSnapshotId === undefined
          ? {}
          : { sourceSnapshotId: draft.sourceSnapshotId }),
        ...(draft.sourceFilePosition === undefined
          ? {}
          : { sourceFilePosition: draft.sourceFilePosition }),
        fileName: draft.fileName,
        tenant: draft.tenant,
        sourceType: draft.sourceType,
        sha256: draft.sha256,
        revision: draft.revision,
        state: draft.state,
        createdBy: draft.createdBy,
        updatedBy: draft.updatedBy,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
        ...(draft.validation === undefined
          ? {}
          : {
              validation: {
                revision: draft.validation.revision,
                sha256: draft.validation.sha256,
                ruleCount: draft.validation.ruleCount,
                decoderCount: draft.validation.decoderCount,
                issueCount: draft.validation.issueCount,
                errorCount: draft.validation.errorCount,
                warningCount: draft.validation.warningCount,
                infoCount: draft.validation.infoCount,
                validatedAt: draft.validation.validatedAt,
              },
            }),
        ...(draft.approvedRevision === undefined
          ? {}
          : { approvedRevision: draft.approvedRevision }),
        ...(draft.approvedSha256 === undefined
          ? {}
          : { approvedSha256: draft.approvedSha256 }),
        ...(draft.approvedBy === undefined ? {} : { approvedBy: draft.approvedBy }),
        ...(draft.approvedAt === undefined ? {} : { approvedAt: draft.approvedAt }),
      },
    ];

    return {
      ...request,
      total: items.length,
      items: items.slice(request.offset, request.offset + request.limit),
    };
  }

  async get(id: string): Promise<RulesAuthoringDraft | null> {
    return this.draft?.id === id ? this.draft : null;
  }

  async createFromSnapshot(
    source: {
      readonly snapshotId: string;
      readonly position: number;
      readonly name: string;
      readonly tenant: string;
      readonly sourceType: Exclude<RulesetSourceType, 'unknown'>;
      readonly content: string;
    },
    actorSubject: string,
  ): Promise<RulesAuthoringDraft> {
    const now = '2026-09-20T00:00:00.000Z';
    this.sourceContent = source.content;
    this.draft = {
      id: draftId,
      sourceSnapshotId: source.snapshotId,
      sourceFilePosition: source.position,
      fileName: source.name,
      tenant: source.tenant,
      sourceType: source.sourceType,
      content: source.content,
      sha256: sha256(source.content),
      revision: 1,
      state: 'draft',
      createdBy: actorSubject,
      updatedBy: actorSubject,
      createdAt: now,
      updatedAt: now,
      eventCount: 1,
      events: [
        {
          eventType: 'create',
          state: 'draft',
          revision: 1,
          actorSubject,
          createdAt: now,
        },
      ],
    };
    return this.draft;
  }

  async createNew(
    input: {
      readonly fileName: string;
      readonly tenant: string;
      readonly sourceType: Exclude<RulesetSourceType, 'unknown'>;
      readonly content: string;
    },
    actorSubject: string,
  ): Promise<RulesAuthoringDraft> {
    const now = '2026-09-20T00:00:00.000Z';
    this.draft = {
      id: draftId,
      fileName: input.fileName,
      tenant: input.tenant,
      sourceType: input.sourceType,
      content: input.content,
      sha256: sha256(input.content),
      revision: 1,
      state: 'draft',
      createdBy: actorSubject,
      updatedBy: actorSubject,
      createdAt: now,
      updatedAt: now,
      eventCount: 1,
      events: [
        {
          eventType: 'create',
          state: 'draft',
          revision: 1,
          actorSubject,
          createdAt: now,
        },
      ],
    };
    return this.draft;
  }

  async update(input: UpdateRulesAuthoringDraftInput): Promise<RulesAuthoringDraft> {
    if (!this.draft) throw new Error('test draft missing');
    const current = this.draft;
    this.draft = {
      id: current.id,
      ...(current.sourceSnapshotId === undefined
        ? {}
        : { sourceSnapshotId: current.sourceSnapshotId }),
      ...(current.sourceFilePosition === undefined
        ? {}
        : { sourceFilePosition: current.sourceFilePosition }),
      fileName: current.fileName,
      tenant: current.tenant,
      sourceType: current.sourceType,
      content: input.content,
      sha256: sha256(input.content),
      revision: current.revision + 1,
      state: 'draft',
      createdBy: current.createdBy,
      updatedBy: input.actorSubject,
      createdAt: current.createdAt,
      updatedAt: '2026-09-20T00:01:00.000Z',
      eventCount: current.eventCount + 1,
      events: [
        ...current.events,
        {
          eventType: 'edit',
          state: 'draft',
          revision: current.revision + 1,
          actorSubject: input.actorSubject,
          createdAt: '2026-09-20T00:01:00.000Z',
        },
      ],
    };
    return this.draft;
  }

  async persistValidation(
    input: PersistRulesAuthoringValidationInput,
  ): Promise<RulesAuthoringDraft> {
    if (!this.draft) throw new Error('test draft missing');
    const count = (severity: 'error' | 'warning' | 'info') =>
      input.issues.filter((issue) => issue.severity === severity).length;
    this.draft = {
      ...this.draft,
      state: 'validated',
      eventCount: this.draft.eventCount + 1,
      events: [
        ...this.draft.events,
        {
          eventType: 'validate',
          state: 'validated',
          revision: input.expectedRevision,
          actorSubject: input.actorSubject,
          createdAt: '2026-09-20T00:02:00.000Z',
        },
      ],
      validation: {
        revision: input.expectedRevision,
        sha256: input.expectedSha256,
        ruleCount: input.ruleCount,
        decoderCount: input.decoderCount,
        issueCount: input.issues.length,
        errorCount: count('error'),
        warningCount: count('warning'),
        infoCount: count('info'),
        validatedAt: '2026-09-20T00:02:00.000Z',
        issues: input.issues,
      },
    };
    return this.draft;
  }

  async approve(input: ApproveRulesAuthoringDraftInput): Promise<RulesAuthoringDraft> {
    if (!this.draft) throw new Error('test draft missing');
    this.draft = {
      ...this.draft,
      state: 'approved',
      approvedRevision: input.expectedRevision,
      approvedSha256: input.expectedSha256,
      approvedBy: input.actorSubject,
      approvedAt: '2026-09-20T00:03:00.000Z',
      eventCount: this.draft.eventCount + 1,
      events: [
        ...this.draft.events,
        {
          eventType: 'approve',
          state: 'approved',
          revision: input.expectedRevision,
          actorSubject: input.actorSubject,
          createdAt: '2026-09-20T00:03:00.000Z',
        },
      ],
    };
    return this.draft;
  }
}

const useCases: RulesUseCaseCatalogReader = {
  list: async () => [],
  get: async () => null,
};

function workflow(store: TestAuthoringStore) {
  const analyzer = new AnalyzeRuleset(new WazuhXmlRulesetAnalyzer());
  return {
    createNew: new CreateNewRulesAuthoringDraft(store),
    create: new CreateRulesAuthoringDraft(store, store),
    update: new UpdateRulesAuthoringDraft(store),
    validate: new ValidateRulesAuthoringDraft(store, analyzer, useCases),
    approve: new ApproveRulesAuthoringDraft(store),
    exportDraft: new ExportRulesAuthoringDraft(store),
  };
}

describe('controlled Rules authoring workflow', () => {
  it('creates bounded logical XML drafts without snapshot provenance', async () => {
    const store = new TestAuthoringStore('');
    const flow = workflow(store);

    const draft = await flow.createNew.execute({
      fileName: '4300-custom_rules.xml',
      tenant: 'manager-new',
      sourceType: 'rules',
      actorSubject: actor,
    });

    expect(draft).toMatchObject({
      fileName: '4300-custom_rules.xml',
      tenant: 'manager-new',
      sourceType: 'rules',
      revision: 1,
      state: 'draft',
    });
    expect(draft.sourceSnapshotId).toBeUndefined();
    expect(draft.sourceFilePosition).toBeUndefined();
    expect(draft.content).toBe('<group name="custom,">\n</group>\n');

    await expect(
      flow.createNew.execute({
        fileName: '../escape.xml',
        tenant: 'manager-new',
        sourceType: 'rules',
        actorSubject: actor,
      }),
    ).rejects.toBeInstanceOf(RulesAuthoringContentValidationError);
  });

  it('blocks approval for an empty standalone decoder definition', async () => {
    const store = new TestAuthoringStore('', 'decoders');
    const flow = workflow(store);
    const draft = await flow.createNew.execute({
      fileName: '4301-custom_decoders.xml',
      tenant: 'manager-new',
      sourceType: 'decoders',
      actorSubject: actor,
    });

    const validated = await flow.validate.execute(draft.id, draft.revision, actor);

    expect(validated.validation?.issues).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        type: 'authoring_empty_decoder_definition',
        decoderName: 'custom_decoder',
      }),
    );
    await expect(
      flow.approve.execute(validated.id, validated.revision, actor),
    ).rejects.toBeInstanceOf(RulesAuthoringInvalidStateError);
  });

  it('blocks approval when a rules draft parses no rules', async () => {
    const store = new TestAuthoringStore('<group name="empty,"></group>');
    const flow = workflow(store);
    const draft = await flow.create.execute({
      sourceSnapshotId,
      sourceFilePosition: 0,
      actorSubject: actor,
    });

    const validated = await flow.validate.execute(draft.id, draft.revision, actor);

    expect(validated.validation?.issues).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        type: 'authoring_empty_rules_file',
      }),
    );
    await expect(
      flow.approve.execute(validated.id, validated.revision, actor),
    ).rejects.toBeInstanceOf(RulesAuthoringInvalidStateError);
  });

  it('approves and exports only the exact error-free validated revision', async () => {
    const store = new TestAuthoringStore([
      '<group name="authoring,">',
      '  <rule id="410001" level="5">',
      '    <description>Authoring test</description>',
      '    <group>production,</group>',
      '  </rule>',
      '</group>',
    ].join('\n'));
    const flow = workflow(store);
    const draft = await flow.create.execute({
      sourceSnapshotId,
      sourceFilePosition: 0,
      actorSubject: actor,
    });

    const validated = await flow.validate.execute(draft.id, 1, actor);
    expect(validated.validation?.errorCount).toBe(0);

    const approved = await flow.approve.execute(draft.id, 1, actor);
    expect(approved.state).toBe('approved');
    expect(approved.eventCount).toBe(3);
    expect(approved.events.map((event) => event.eventType)).toEqual([
      'create',
      'validate',
      'approve',
    ]);

    const artifact = await flow.exportDraft.execute(draft.id);
    expect(artifact).toMatchObject({
      draftId,
      revision: 1,
      sourceType: 'rules',
      sha256: approved.sha256,
    });
    expect(artifact.content).toContain('410001');

    const edited = await flow.update.execute({
      draftId,
      expectedRevision: 1,
      content: approved.content.replace('Authoring test', 'Authoring test edited'),
      actorSubject: actor,
    });
    expect(edited).toMatchObject({ revision: 2, state: 'draft' });
    await expect(flow.exportDraft.execute(draftId)).rejects.toBeInstanceOf(
      RulesAuthoringInvalidStateError,
    );
  });
});
