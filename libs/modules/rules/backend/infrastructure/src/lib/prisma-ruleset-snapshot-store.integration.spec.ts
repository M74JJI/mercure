import { describe, expect, it } from 'vitest';

import { createPrismaClient } from '@mercure/platform-backend-database/client';
import {
  AnalyzeRulesetSnapshotFields,
  AnalyzeRulesetSnapshotRoundtrip,
  BuildRulesetSnapshotGraph,
  CompareRulesetSnapshots,
  ScoreRulesetSnapshotQuality,
  type ImportArchivedRulesetResult,
} from '@mercure/rules-backend-application';

import { PrismaRulesetSnapshotAnalysisSource } from './prisma-ruleset-snapshot-analysis-source';
import { PrismaRulesetSnapshotQueryStore } from './prisma-ruleset-snapshot-query-store';
import { PrismaRulesetSnapshotStore } from './prisma-ruleset-snapshot-store';
import { WazuhXmlRulesetAnalyzer } from './wazuh-xml-ruleset-analyzer';

const integrationEnabled = process.env['RULES_PERSISTENCE_INTEGRATION'] === '1';

describe.runIf(integrationEnabled)('PrismaRulesetSnapshotStore', () => {
  it('persists one immutable normalized snapshot atomically', async () => {
    const databaseUrl = process.env['DATABASE_URL'];
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required for Rules persistence integration tests.');
    }

    const database = createPrismaClient({
      connectionString: databaseUrl,
      max: 5,
      connectionTimeoutMillis: 2_000,
      idleTimeoutMillis: 5_000,
    });
    const analyzer = new WazuhXmlRulesetAnalyzer();
    const store = new PrismaRulesetSnapshotStore(database);
    const queryStore = new PrismaRulesetSnapshotQueryStore(database);
    const analysisSource = new PrismaRulesetSnapshotAnalysisSource(database);
    const compareSnapshots = new CompareRulesetSnapshots(analysisSource);
    const analyzeRoundtrip = new AnalyzeRulesetSnapshotRoundtrip(analysisSource);
    const analyzeFields = new AnalyzeRulesetSnapshotFields(analysisSource);
    const scoreQuality = new ScoreRulesetSnapshotQuality(analysisSource);
    const buildGraph = new BuildRulesetSnapshotGraph(analysisSource);

    const analysis = await analyzer.analyze({
      files: [
        {
          name: 'manager-x.tar.gz/rules/1000-snapshot_rules.xml',
          content: [
            '<!-- Source file: 3100-snapshot.xml -->',
            '<group name="snapshot,">',
            '  <rule id="310001" level="12" frequency="4" timeframe="60">',
            '    <decoded_as>snapshot_decoder</decoded_as>',
            '    <description>Snapshot persistence rule</description>',
            '    <if_sid>999999</if_sid>',
            '    <group>production,uc_snapshot,</group>',
            '    <mitre><id>T1059.001</id></mitre>',
            '    <field name="srcip" type="ip">.+</field>',
            '    <options>no_full_log</options>',
            '  </rule>',
            '</group>',
          ].join('\n'),
        },
        {
          name: 'manager-x.tar.gz/decoders/1000-snapshot_decoders.xml',
          content: [
            '<decoder name="snapshot_decoder">',
            '  <prematch>snapshot</prematch>',
            '  <regex>src=(\\S+)</regex>',
            '  <order>srcip</order>',
            '</decoder>',
          ].join('\n'),
        },
      ],
      useCases: [
        {
          id: 'uc_snapshot',
          name: 'Snapshot persistence',
          shortName: 'Snapshot',
          description: 'Persistence integration fixture',
          component: 'rules',
          vendor: 'Mercure',
          product: 'Rules',
          domain: 'detection',
          category: 'integration',
          source: 'system',
          createdBy: 'test',
          createdAt: '2026-09-18T12:00:00.000Z',
        },
      ],
    });

    const imported: ImportArchivedRulesetResult = {
      source: {
        sourceRoot: '/opt/mercure/siem-managers',
        configured: true,
        archives: [
          {
            name: 'manager-x.tar.gz',
            size: 4_096,
            modifiedAt: '2026-09-18T12:00:00.000Z',
            xmlFiles: 2,
          },
        ],
        fingerprint: 'a'.repeat(64),
        loadedAt: '2026-09-18T12:01:00.000Z',
        errors: ['manager-x.tar.gz: one unrelated source warning'],
      },
      analysis,
    };

    let snapshotId: string | undefined;

    try {
      const saved = await store.persist(imported);
      snapshotId = saved.id;

      expect(saved).toMatchObject({
        sourceFingerprint: 'a'.repeat(64),
        complete: false,
        sourceErrorCount: 1,
        loadedAt: '2026-09-18T12:01:00.000Z',
      });
      expect(saved.contentFingerprint).toMatch(/^[a-f0-9]{64}$/);

      const snapshotPage = await queryStore.listSnapshots({ offset: 0, limit: 10 });
      expect(snapshotPage.total).toBeGreaterThanOrEqual(1);
      expect(snapshotPage.items.some((snapshot) => snapshot.id === saved.id)).toBe(true);

      const queriedSnapshot = await queryStore.getSnapshot(saved.id);
      expect(queriedSnapshot).toMatchObject({
        id: saved.id,
        complete: false,
        sourceErrorCount: 1,
        ruleCount: 1,
        decoderCount: 1,
      });
      expect(queriedSnapshot && 'sourceRoot' in queriedSnapshot).toBe(false);

      const queriedRules = await queryStore.listRules(saved.id, {
        offset: 0,
        limit: 10,
        tenant: 'manager-x',
        severity: 'critical',
        ruleId: '310001',
        jiraVisible: true,
      });
      expect(queriedRules.total).toBe(1);
      expect(queriedRules.items[0]).toMatchObject({
        id: '310001',
        tenant: 'manager-x',
        severity: 'critical',
        jiraVisible: true,
        sourceFile: 'manager-x.tar.gz/rules/1000-snapshot_rules.xml',
      });
      expect(queriedRules.items[0]?.dependencies).toContainEqual({
        type: 'if_sid',
        value: '999999',
      });
      expect(queriedRules.items[0] && 'rawXml' in queriedRules.items[0]).toBe(false);

      const queriedDecoders = await queryStore.listDecoders(saved.id, {
        offset: 0,
        limit: 10,
        tenant: 'manager-x',
        name: 'snapshot_decoder',
      });
      expect(queriedDecoders.total).toBe(1);
      expect(queriedDecoders.items[0]).toMatchObject({
        name: 'snapshot_decoder',
        tenant: 'manager-x',
        sourceFile: 'manager-x.tar.gz/decoders/1000-snapshot_decoders.xml',
      });
      expect(queriedDecoders.items[0] && 'rawXml' in queriedDecoders.items[0]).toBe(false);

      const queriedIssues = await queryStore.listIssues(saved.id, {
        offset: 0,
        limit: 10,
        severity: 'warning',
        type: 'external_or_missing_sid',
      });
      expect(queriedIssues.total).toBe(1);
      expect(queriedIssues.items[0]).toMatchObject({
        severity: 'warning',
        type: 'external_or_missing_sid',
        ruleId: '310001',
        tenant: 'manager-x',
      });

      const reconstructed = await analysisSource.load(saved.id);
      expect(reconstructed).not.toBeNull();
      expect(reconstructed?.files[0]?.content).toContain('<!-- Source file: 3100-snapshot.xml -->');
      expect(reconstructed?.rules[0]).toMatchObject({
        id: '310001',
        sourceSection: '3100-snapshot.xml',
        useCaseId: 'uc_snapshot',
        useCaseConfidence: 'confirmed',
      });
      expect(reconstructed?.rules[0]?.rawXml).toContain(
        '<rule id="310001" level="12" frequency="4" timeframe="60">',
      );
      expect(reconstructed?.rules[0]?.dependencies).toContainEqual({
        type: 'if_sid',
        value: '999999',
      });
      expect(reconstructed?.decoders[0]?.rawXml).toContain('<decoder name="snapshot_decoder">');
      expect(reconstructed?.useCases[0]).toMatchObject({
        id: 'uc_snapshot',
        createdAt: '2026-09-18T12:00:00.000Z',
      });

      const selfDiff = await compareSnapshots.execute({
        beforeSnapshotId: saved.id,
        afterSnapshotId: saved.id,
      });
      expect(selfDiff.diff.summary).toMatchObject({
        rulesAdded: 0,
        rulesRemoved: 0,
        rulesChanged: 0,
        decodersAdded: 0,
        decodersRemoved: 0,
        decodersChanged: 0,
        filesAdded: 0,
        filesRemoved: 0,
        filesChanged: 0,
        newIssues: 0,
        resolvedIssues: 0,
      });

      const roundtrip = await analyzeRoundtrip.execute(saved.id);
      expect(roundtrip.snapshotId).toBe(saved.id);
      expect(roundtrip.analysis.summary).toMatchObject({
        sourceSections: 1,
        idRangeWarnings: 0,
        missingUseCaseSuggestions: 0,
      });
      expect(roundtrip.analysis.sourceSections[0]).toMatchObject({
        tenant: 'manager-x',
        sourceFile: '3100-snapshot.xml',
        idRangeStatus: 'pass',
      });
      expect(roundtrip.analysis.splitFiles[0]?.fileName).toBe('manager-x__3100-snapshot.xml');
      expect(roundtrip.analysis.splitFiles[0]?.xml).toContain(
        '<rule id="310001" level="12" frequency="4" timeframe="60">',
      );

      const fields = await analyzeFields.execute(saved.id);
      expect(fields.snapshotId).toBe(saved.id);
      expect(fields.intelligence.rows).toContainEqual(
        expect.objectContaining({
          tenant: 'manager-x',
          field: 'srcip',
          health: 'healthy',
          producedBy: [
            expect.objectContaining({
              tenant: 'manager-x',
              name: 'snapshot_decoder',
            }),
          ],
          usedByRules: [
            expect.objectContaining({
              tenant: 'manager-x',
              ruleId: '310001',
            }),
          ],
        }),
      );

      const quality = await scoreQuality.execute(saved.id);
      expect(quality.snapshotId).toBe(saved.id);
      expect(quality.quality.rules[0]).toMatchObject({
        tenant: 'manager-x',
        ruleId: '310001',
        useCaseId: 'uc_snapshot',
      });
      expect(quality.quality.rules[0]?.warnings).toContain('Missing tenant dependency SID 999999.');
      expect(quality.quality.rules[0]?.dimensions.noiseControl).toBeGreaterThanOrEqual(0);
      expect(quality.quality.rules[0]?.dimensions.noiseControl).toBeLessThanOrEqual(100);

      const graph = await buildGraph.execute({
        snapshotId: saved.id,
        filters: {
          mode: 'all',
          includeExternal: true,
          limit: 100,
        },
      });
      expect(graph.snapshotId).toBe(saved.id);
      expect(graph.graph.nodes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'rule',
            tenant: 'manager-x',
            entityId: '310001',
          }),
          expect.objectContaining({
            type: 'decoder',
            tenant: 'manager-x',
            entityId: 'snapshot_decoder',
          }),
          expect.objectContaining({
            type: 'field',
            tenant: 'manager-x',
            entityId: 'srcip',
          }),
          expect.objectContaining({
            type: 'external',
            tenant: 'manager-x',
            entityId: '999999',
          }),
        ]),
      );
      for (const node of graph.graph.nodes) {
        expect('x' in node).toBe(false);
        expect('y' in node).toBe(false);
        expect('tone' in node).toBe(false);
      }

      const stored = await database.rulesetSnapshot.findUnique({
        where: { id: saved.id },
        include: {
          sourceErrors: { orderBy: { position: 'asc' } },
          archives: { orderBy: { position: 'asc' } },
          files: {
            orderBy: { position: 'asc' },
            include: {
              rules: {
                orderBy: { position: 'asc' },
                include: {
                  groups: { orderBy: { position: 'asc' } },
                  mitreIds: { orderBy: { position: 'asc' } },
                  fields: { orderBy: { position: 'asc' } },
                  decodedAs: { orderBy: { position: 'asc' } },
                  options: { orderBy: { position: 'asc' } },
                },
              },
              decoders: {
                orderBy: { position: 'asc' },
                include: {
                  prematches: { orderBy: { position: 'asc' } },
                  regexValues: { orderBy: { position: 'asc' } },
                  orderFields: { orderBy: { position: 'asc' } },
                },
              },
            },
          },
          issues: { orderBy: { position: 'asc' } },
          useCases: { orderBy: { position: 'asc' } },
        },
      });

      expect(stored).not.toBeNull();
      expect(stored).toMatchObject({
        complete: false,
        sourceErrorCount: 1,
        archiveCount: 1,
        fileCount: 2,
        ruleCount: 1,
        decoderCount: 1,
        useCaseCount: 1,
      });
      expect(stored?.sourceErrors.map((error) => error.detail)).toEqual([
        'manager-x.tar.gz: one unrelated source warning',
      ]);
      expect(stored?.archives[0]).toMatchObject({
        name: 'manager-x.tar.gz',
        xmlFiles: 2,
      });

      const ruleFile = stored?.files.find((file) => file.sourceType === 'rules');
      expect(ruleFile?.rules).toHaveLength(1);
      expect(ruleFile?.rules[0]).toMatchObject({
        ruleId: '310001',
        level: 12,
        severity: 'critical',
        status: 'production',
        useCaseId: 'uc_snapshot',
      });
      expect(ruleFile?.rules[0]?.groups.map((group) => group.value)).toEqual([
        'production',
        'uc_snapshot',
      ]);
      expect(ruleFile?.rules[0]?.mitreIds.map((mitre) => mitre.value)).toEqual(['T1059.001']);
      expect(ruleFile?.rules[0]?.fields[0]).toMatchObject({
        name: 'srcip',
        fieldType: 'ip',
        value: '.+',
      });
      expect(ruleFile?.rules[0]?.decodedAs.map((decoded) => decoded.value)).toEqual([
        'snapshot_decoder',
      ]);
      expect(ruleFile?.rules[0]?.options.map((option) => option.value)).toEqual(['no_full_log']);

      const decoderFile = stored?.files.find((file) => file.sourceType === 'decoders');
      expect(decoderFile?.decoders).toHaveLength(1);
      expect(decoderFile?.decoders[0]).toMatchObject({
        name: 'snapshot_decoder',
        tenant: 'manager-x',
      });
      expect(decoderFile?.decoders[0]?.prematches.map((prematch) => prematch.value)).toEqual([
        'snapshot',
      ]);
      expect(decoderFile?.decoders[0]?.regexValues.map((regex) => regex.value)).toEqual([
        'src=(\\S+)',
      ]);
      expect(decoderFile?.decoders[0]?.orderFields.map((orderField) => orderField.value)).toEqual([
        'srcip',
      ]);

      expect(stored?.useCases[0]).toMatchObject({
        useCaseId: 'uc_snapshot',
        shortName: 'Snapshot',
        originalCreatedAt: '2026-09-18T12:00:00.000Z',
      });
    } finally {
      if (snapshotId) {
        await database.rulesetSnapshot.delete({ where: { id: snapshotId } });
        const remainingFiles = await database.rulesetSnapshotFile.count({
          where: { snapshotId },
        });
        expect(remainingFiles).toBe(0);
      }
      await database.$disconnect();
    }
  });
});
