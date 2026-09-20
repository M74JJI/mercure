import { describe, expect, it } from 'vitest';

import { createPrismaClient } from '@mercure/platform-backend-database/client';
import {
  RulesAuthoringConflictError,
  type ImportArchivedRulesetResult,
} from '@mercure/rules-backend-application';

import { PrismaRulesAuthoringStore } from './prisma-rules-authoring-store';
import { PrismaRulesetSnapshotStore } from './prisma-ruleset-snapshot-store';
import { WazuhXmlRulesetAnalyzer } from './wazuh-xml-ruleset-analyzer';

const integrationEnabled = process.env['RULES_PERSISTENCE_INTEGRATION'] === '1';

describe.runIf(integrationEnabled)('PrismaRulesAuthoringStore', () => {
  it('persists revisions, rejects stale writes, and preserves the approval audit trail', async () => {
    const databaseUrl = process.env['DATABASE_URL'];
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required for Rules authoring integration tests.');
    }

    const database = createPrismaClient({
      connectionString: databaseUrl,
      max: 5,
      connectionTimeoutMillis: 2_000,
      idleTimeoutMillis: 5_000,
    });
    const analyzer = new WazuhXmlRulesetAnalyzer();
    const snapshotStore = new PrismaRulesetSnapshotStore(database);
    const authoringStore = new PrismaRulesAuthoringStore(database);

    let snapshotId: string | undefined;
    let draftId: string | undefined;
    let standaloneDraftId: string | undefined;

    try {
      const analysis = await analyzer.analyze({
        files: [
          {
            name: 'manager-authoring.tar.gz/rules/2000-authoring_rules.xml',
            content: [
              '<group name="authoring,">',
              '  <rule id="420001" level="5">',
              '    <description>Authoring persistence rule</description>',
              '    <group>production,</group>',
              '  </rule>',
              '</group>',
            ].join('\n'),
          },
        ],
      });

      const imported: ImportArchivedRulesetResult = {
        source: {
          sourceRoot: '/opt/mercure/siem-managers',
          configured: true,
          archives: [
            {
              name: 'manager-authoring.tar.gz',
              size: 2_048,
              modifiedAt: '2026-09-20T00:00:00.000Z',
              xmlFiles: 1,
            },
          ],
          fingerprint: 'b'.repeat(64),
          loadedAt: '2026-09-20T00:00:10.000Z',
          errors: [],
        },
        analysis,
      };

      const snapshot = await snapshotStore.persist(imported);
      snapshotId = snapshot.id;

      const sourceFile = await database.rulesetSnapshotFile.findFirst({
        where: {
          snapshotId,
          sourceType: 'rules',
        },
        select: {
          position: true,
        },
      });
      expect(sourceFile).not.toBeNull();
      if (!sourceFile) throw new Error('Expected persisted authoring source file.');

      const source = await authoringStore.getSnapshotFile(snapshotId, sourceFile.position);
      expect(source).toMatchObject({
        snapshotId,
        position: sourceFile.position,
        sourceType: 'rules',
        tenant: 'manager-authoring',
      });
      expect(source?.content).toContain('420001');
      if (!source || source.sourceType === 'unknown') {
        throw new Error('Expected authorable source file.');
      }

      const created = await authoringStore.createFromSnapshot(
        {
          ...source,
          sourceType: source.sourceType,
        },
        'admin-create',
      );
      draftId = created.id;

      expect(created).toMatchObject({
        revision: 1,
        state: 'draft',
        createdBy: 'admin-create',
        updatedBy: 'admin-create',
      });
      expect(created.events.map((event) => event.eventType)).toEqual(['create']);

      const updatedContent = created.content.replace(
        'Authoring persistence rule',
        'Authoring persistence rule updated',
      );
      const updated = await authoringStore.update({
        draftId,
        expectedRevision: 1,
        content: updatedContent,
        actorSubject: 'admin-edit',
      });
      expect(updated).toMatchObject({
        revision: 2,
        state: 'draft',
        updatedBy: 'admin-edit',
      });
      expect(updated.events.map((event) => event.eventType)).toEqual(['create', 'edit']);

      await expect(
        authoringStore.update({
          draftId,
          expectedRevision: 1,
          content: updatedContent + '\n',
          actorSubject: 'stale-admin',
        }),
      ).rejects.toBeInstanceOf(RulesAuthoringConflictError);

      const validated = await authoringStore.persistValidation({
        draftId,
        expectedRevision: 2,
        expectedSha256: updated.sha256,
        ruleCount: 1,
        decoderCount: 0,
        issues: [
          {
            severity: 'warning',
            type: 'integration_warning',
            title: 'Integration warning',
            detail: 'A warning remains visible while approval is allowed.',
            ruleId: '420001',
            fileName: updated.fileName,
            tenant: updated.tenant,
          },
        ],
        actorSubject: 'admin-validate',
      });

      expect(validated).toMatchObject({
        revision: 2,
        state: 'validated',
        updatedBy: 'admin-edit',
      });
      expect(validated.validation).toMatchObject({
        revision: 2,
        sha256: updated.sha256,
        ruleCount: 1,
        decoderCount: 0,
        issueCount: 1,
        errorCount: 0,
        warningCount: 1,
      });
      expect(validated.validation?.issues).toContainEqual(
        expect.objectContaining({
          type: 'integration_warning',
          severity: 'warning',
          ruleId: '420001',
        }),
      );

      const approved = await authoringStore.approve({
        draftId,
        expectedRevision: 2,
        expectedSha256: updated.sha256,
        actorSubject: 'admin-approve',
      });

      expect(approved).toMatchObject({
        revision: 2,
        state: 'approved',
        updatedBy: 'admin-edit',
        eventCount: 4,
        approvedRevision: 2,
        approvedSha256: updated.sha256,
        approvedBy: 'admin-approve',
      });
      expect(approved.events.map((event) => event.eventType)).toEqual([
        'create',
        'edit',
        'validate',
        'approve',
      ]);
      expect(approved.events.map((event) => event.actorSubject)).toEqual([
        'admin-create',
        'admin-edit',
        'admin-validate',
        'admin-approve',
      ]);

      const summaries = await authoringStore.list({ offset: 0, limit: 25 });
      const summary = summaries.items.find((item) => item.id === draftId);
      expect(summary).toMatchObject({
        id: draftId,
        revision: 2,
        state: 'approved',
      });
      expect(summary && 'content' in summary).toBe(false);

      const storedEvents = await database.rulesAuthoringDraftEvent.findMany({
        where: { draftId },
        orderBy: { id: 'asc' },
        select: {
          eventType: true,
          revision: true,
          actorSubject: true,
        },
      });
      expect(storedEvents).toEqual([
        { eventType: 'create', revision: 1, actorSubject: 'admin-create' },
        { eventType: 'edit', revision: 2, actorSubject: 'admin-edit' },
        { eventType: 'validate', revision: 2, actorSubject: 'admin-validate' },
        { eventType: 'approve', revision: 2, actorSubject: 'admin-approve' },
      ]);

      const standalone = await authoringStore.createNew(
        {
          fileName: '4300-standalone_rules.xml',
          tenant: 'manager-standalone',
          sourceType: 'rules',
          content: '<group name="custom,">\n</group>\n',
        },
        'admin-standalone',
      );
      standaloneDraftId = standalone.id;

      expect(standalone.sourceSnapshotId).toBeUndefined();
      expect(standalone.sourceFilePosition).toBeUndefined();
      expect(standalone).toMatchObject({
        fileName: '4300-standalone_rules.xml',
        tenant: 'manager-standalone',
        sourceType: 'rules',
        revision: 1,
        state: 'draft',
      });

      const storedStandalone = await database.rulesAuthoringDraft.findUnique({
        where: { id: standalone.id },
        select: {
          sourceSnapshotId: true,
          sourceFilePosition: true,
        },
      });
      expect(storedStandalone).toEqual({
        sourceSnapshotId: null,
        sourceFilePosition: null,
      });

      const manyWarnings = Array.from({ length: 505 }, (_, index) => ({
        severity: 'warning' as const,
        type: 'bounded_warning',
        title: 'Bounded warning',
        detail: 'Validation finding ' + String(index),
        fileName: standalone.fileName,
        tenant: standalone.tenant,
      }));
      const blockingError = {
        severity: 'error' as const,
        type: 'blocking_error_after_warnings',
        title: 'Blocking error',
        detail: 'This approval-blocking error must remain visible after bounding.',
        fileName: standalone.fileName,
        tenant: standalone.tenant,
      };
      const boundedValidation = await authoringStore.persistValidation({
        draftId: standalone.id,
        expectedRevision: standalone.revision,
        expectedSha256: standalone.sha256,
        ruleCount: 0,
        decoderCount: 0,
        issues: [...manyWarnings, blockingError],
        actorSubject: 'admin-bounded-validation',
      });

      expect(boundedValidation.validation).toMatchObject({
        issueCount: 506,
        warningCount: 505,
        errorCount: 1,
      });
      expect(boundedValidation.validation?.issues).toHaveLength(500);
      expect(boundedValidation.validation?.issues[0]).toMatchObject({
        severity: 'error',
        type: 'blocking_error_after_warnings',
      });
      expect(
        await database.rulesAuthoringDraftValidationIssue.count({
          where: {
            draftId: standalone.id,
            revision: standalone.revision,
          },
        }),
      ).toBe(500);

      expect(
        await database.rulesAuthoringDraftValidationIssue.findFirst({
          where: {
            draftId: standalone.id,
            revision: standalone.revision,
            severity: 'error',
          },
          select: { type: true },
        }),
      ).toEqual({ type: 'blocking_error_after_warnings' });

      await database.rulesAuthoringDraftEvent.createMany({
        data: Array.from({ length: 205 }, (_, index) => ({
          draftId: standalone.id,
          eventType: 'edit',
          state: 'draft',
          revision: standalone.revision,
          actorSubject: 'history-' + String(index),
        })),
      });
      const boundedHistory = await authoringStore.get(standalone.id);
      expect(boundedHistory?.eventCount).toBe(207);
      expect(boundedHistory?.events).toHaveLength(200);

      await expect(
        database.rulesAuthoringDraft.create({
          data: {
            sourceFilePosition: 99,
            fileName: 'invalid-provenance.xml',
            tenant: 'manager-invalid',
            sourceType: 'rules',
            content: '<group name="invalid,"></group>',
            sha256: 'c'.repeat(64),
            createdBy: 'constraint-test',
            updatedBy: 'constraint-test',
          },
        }),
      ).rejects.toThrow();

      await expect(
        database.rulesAuthoringDraft.create({
          data: {
            sourceSnapshotId: snapshotId,
            sourceFilePosition: 99_999,
            fileName: 'invalid-source-link.xml',
            tenant: 'manager-invalid',
            sourceType: 'rules',
            content: '<group name="invalid,"></group>',
            sha256: 'e'.repeat(64),
            createdBy: 'constraint-test',
            updatedBy: 'constraint-test',
          },
        }),
      ).rejects.toThrow();

      await expect(
        database.rulesAuthoringDraft.create({
          data: {
            fileName: 'invalid-approved.xml',
            tenant: 'manager-invalid',
            sourceType: 'rules',
            content: '<group name="invalid,"></group>',
            sha256: 'd'.repeat(64),
            state: 'approved',
            createdBy: 'constraint-test',
            updatedBy: 'constraint-test',
          },
        }),
      ).rejects.toThrow();

      await expect(
        database.rulesAuthoringDraft.create({
          data: {
            fileName: 'invalid-empty-actor.xml',
            tenant: 'manager-invalid',
            sourceType: 'rules',
            content: '<group name="invalid,"></group>',
            sha256: 'a'.repeat(64),
            createdBy: '\n\t',
            updatedBy: 'constraint-test',
          },
        }),
      ).rejects.toThrow();

      await expect(
        database.rulesAuthoringDraft.create({
          data: {
            fileName: 'invalid-sha.xml',
            tenant: 'manager-invalid',
            sourceType: 'rules',
            content: '<group name="invalid,"></group>',
            sha256: 'not-a-valid-sha'.padEnd(64, 'x'),
            createdBy: 'constraint-test',
            updatedBy: 'constraint-test',
          },
        }),
      ).rejects.toThrow();

      await expect(
        database.rulesAuthoringDraft.create({
          data: {
            fileName: 'invalid-empty-content.xml',
            tenant: 'manager-invalid',
            sourceType: 'rules',
            content: '   ',
            sha256: 'a'.repeat(64),
            createdBy: 'constraint-test',
            updatedBy: 'constraint-test',
          },
        }),
      ).rejects.toThrow();

      await expect(
        database.rulesAuthoringDraft.update({
          where: { id: standalone.id },
          data: {
            state: 'draft',
          },
        }),
      ).rejects.toThrow();

      await expect(
        database.rulesAuthoringDraft.update({
          where: { id: standalone.id },
          data: {
            approvedRevision: standalone.revision,
            approvedSha256: standalone.sha256,
            approvedBy: 'constraint-test',
            approvedAt: new Date(),
          },
        }),
      ).rejects.toThrow();

      await expect(
        database.rulesAuthoringDraft.update({
          where: { id: standalone.id },
          data: {
            state: 'validated',
            validatedRevision: null,
            validatedSha256: standalone.sha256,
            validatedRuleCount: 0,
            validatedDecoderCount: 0,
            validationIssueCount: 0,
            validationErrorCount: 0,
            validationWarningCount: 0,
            validationInfoCount: 0,
            validatedAt: new Date(),
          },
        }),
      ).rejects.toThrow();

      await expect(
        database.rulesAuthoringDraft.update({
          where: { id: standalone.id },
          data: {
            state: 'approved',
            approvedRevision: null,
            approvedSha256: standalone.sha256,
            approvedBy: 'constraint-test',
            approvedAt: new Date(),
          },
        }),
      ).rejects.toThrow();

      await expect(
        database.rulesAuthoringDraft.update({
          where: { id: standalone.id },
          data: {
            validatedRuleCount: -1,
          },
        }),
      ).rejects.toThrow();

      await expect(
        database.rulesAuthoringDraftEvent.create({
          data: {
            draftId: standalone.id,
            eventType: 'invalid',
            state: 'draft',
            revision: 1,
            actorSubject: 'constraint-test',
          },
        }),
      ).rejects.toThrow();

      await expect(
        database.rulesAuthoringDraftEvent.create({
          data: {
            draftId: standalone.id,
            eventType: 'edit',
            state: 'draft',
            revision: 0,
            actorSubject: 'constraint-test',
          },
        }),
      ).rejects.toThrow();

      await expect(
        database.rulesAuthoringDraftEvent.create({
          data: {
            draftId: standalone.id,
            eventType: 'edit',
            state: 'draft',
            revision: 1,
            actorSubject: '\n\t',
          },
        }),
      ).rejects.toThrow();

      await expect(
        database.rulesAuthoringDraftEvent.create({
          data: {
            draftId: standalone.id,
            eventType: 'approve',
            state: 'draft',
            revision: standalone.revision,
            actorSubject: 'constraint-test',
          },
        }),
      ).rejects.toThrow();

      await expect(
        database.rulesAuthoringDraftValidationIssue.create({
          data: {
            draftId: standalone.id,
            revision: standalone.revision,
            position: -1,
            severity: 'warning',
            type: 'invalid_position',
            title: 'Invalid position',
            detail: 'Negative validation issue positions must be rejected.',
          },
        }),
      ).rejects.toThrow();
    } finally {
      if (standaloneDraftId) {
        await database.rulesAuthoringDraft.delete({ where: { id: standaloneDraftId } });
      }
      if (draftId) {
        await database.rulesAuthoringDraft.delete({ where: { id: draftId } });
      }
      if (snapshotId) {
        await database.rulesetSnapshot.delete({ where: { id: snapshotId } });
      }
      await database.$disconnect();
    }
  });
});
