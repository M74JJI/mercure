import { describe, expect, it } from 'vitest';

import { createPrismaClient } from '@mercure/platform-backend-database/client';
import {
  AnalyzeRuleset,
  CreateCustomRulesUseCase,
  DeleteCustomRulesUseCase,
  GetRulesUseCase,
  ImportArchivedRuleset,
  ListRulesUseCases,
  RulesSystemUseCaseProtectedError,
  RulesUseCaseAlreadyExistsError,
  RulesUseCaseCatalogValidationError,
  RulesUseCaseNotFoundError,
  UpdateCustomRulesUseCase,
  type RulesetArchiveSource,
} from '@mercure/rules-backend-application';

import { PrismaRulesUseCaseCatalog } from './prisma-rules-use-case-catalog';
import { WazuhXmlRulesetAnalyzer } from './wazuh-xml-ruleset-analyzer';

const integrationEnabled = process.env['RULES_PERSISTENCE_INTEGRATION'] === '1';

describe.runIf(integrationEnabled)('PrismaRulesUseCaseCatalog', () => {
  it('manages custom catalog entries and supplies imports from PostgreSQL', async () => {
    const databaseUrl = process.env['DATABASE_URL'];
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required for Rules catalog integration tests.');
    }

    const database = createPrismaClient({
      connectionString: databaseUrl,
      max: 5,
      connectionTimeoutMillis: 2_000,
      idleTimeoutMillis: 5_000,
    });
    const catalog = new PrismaRulesUseCaseCatalog(database);
    const createUseCase = new CreateCustomRulesUseCase(catalog);
    const updateUseCase = new UpdateCustomRulesUseCase(catalog);
    const deleteUseCase = new DeleteCustomRulesUseCase(catalog);
    const listUseCases = new ListRulesUseCases(catalog);
    const getUseCase = new GetRulesUseCase(catalog);

    const customId = 'uc_catalog_integration';
    const systemId = 'uc_catalog_system';

    try {
      await database.rulesUseCaseCatalogEntry.deleteMany({
        where: { id: { in: [customId, systemId] } },
      });

      const created = await createUseCase.execute({
        id: `  ${customId}  `,
        name: '  Catalog integration  ',
        shortName: '  Catalog  ',
        description: '  PostgreSQL-backed catalog integration fixture.  ',
        component: '  Rules  ',
        vendor: '  Mercure  ',
        product: '  Rules  ',
        domain: '  Detection  ',
        category: '  Integration  ',
        createdBy: '  integration-test  ',
      });

      expect(created).toMatchObject({
        id: customId,
        name: 'Catalog integration',
        shortName: 'Catalog',
        description: 'PostgreSQL-backed catalog integration fixture.',
        component: 'Rules',
        vendor: 'Mercure',
        product: 'Rules',
        domain: 'Detection',
        category: 'Integration',
        source: 'custom',
        createdBy: 'integration-test',
      });
      expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      await expect(
        createUseCase.execute({
          id: customId,
          name: 'Duplicate',
          shortName: 'Duplicate',
          description: 'Duplicate ID',
          component: 'Rules',
          vendor: 'Mercure',
          product: 'Rules',
          domain: 'Detection',
          category: 'Integration',
          createdBy: 'integration-test',
        }),
      ).rejects.toBeInstanceOf(RulesUseCaseAlreadyExistsError);

      const fetched = await getUseCase.execute(customId);
      expect(fetched).toEqual(created);

      const updated = await updateUseCase.execute({
        id: customId,
        name: 'Catalog integration updated',
        shortName: 'Catalog updated',
        description: 'Updated catalog integration fixture.',
        component: 'Rules',
        vendor: 'Mercure',
        product: 'Rules',
        domain: 'Detection',
        category: 'Regression',
      });
      expect(updated).toMatchObject({
        id: customId,
        name: 'Catalog integration updated',
        shortName: 'Catalog updated',
        category: 'Regression',
        source: 'custom',
        createdBy: 'integration-test',
        createdAt: created.createdAt,
      });

      await database.rulesUseCaseCatalogEntry.create({
        data: {
          id: systemId,
          name: 'System use case',
          shortName: 'System',
          description: 'Protected system fixture.',
          component: 'Rules',
          vendor: 'Mercure',
          product: 'Rules',
          domain: 'Detection',
          category: 'System',
          source: 'system',
          createdBy: 'migration',
        },
      });

      const listed = await listUseCases.execute();
      expect(listed.map((useCase) => useCase.id)).toEqual([customId, systemId]);

      await expect(
        updateUseCase.execute({
          id: systemId,
          name: 'Mutated system entry',
          shortName: 'Mutated',
          description: 'Must not update.',
          component: 'Rules',
          vendor: 'Mercure',
          product: 'Rules',
          domain: 'Detection',
          category: 'System',
        }),
      ).rejects.toBeInstanceOf(RulesSystemUseCaseProtectedError);
      await expect(deleteUseCase.execute(systemId)).rejects.toBeInstanceOf(
        RulesSystemUseCaseProtectedError,
      );

      await expect(
        createUseCase.execute({
          id: 'invalid-id',
          name: 'Invalid',
          shortName: 'Invalid',
          description: 'Invalid ID fixture.',
          component: 'Rules',
          vendor: 'Mercure',
          product: 'Rules',
          domain: 'Detection',
          category: 'Integration',
          createdBy: 'integration-test',
        }),
      ).rejects.toBeInstanceOf(RulesUseCaseCatalogValidationError);

      const source: RulesetArchiveSource = {
        async readSnapshot() {
          return {
            sourceRoot: '/integration/catalog',
            configured: true,
            archives: [],
            files: [
              {
                name: 'manager-catalog/rules/1000-catalog.xml',
                content: [
                  '<group name="catalog,">',
                  '  <rule id="410001" level="10">',
                  '    <description>Catalog-backed rule</description>',
                  `    <info type="text">use_case:${customId}</info>`,
                  '    <group>production,</group>',
                  '  </rule>',
                  '</group>',
                ].join('\n'),
              },
            ],
            fingerprint: 'c'.repeat(64),
            loadedAt: '2026-09-19T10:30:00.000Z',
            errors: [],
          };
        },
      };

      const importer = new ImportArchivedRuleset(
        source,
        new AnalyzeRuleset(new WazuhXmlRulesetAnalyzer()),
        catalog,
      );
      const imported = await importer.execute();

      expect(imported.analysis.rules[0]).toMatchObject({
        id: '410001',
        useCaseId: customId,
        useCaseConfidence: 'confirmed',
      });
      expect(imported.analysis.useCases).toHaveLength(1);
      expect(imported.analysis.useCases[0]).toMatchObject({
        id: customId,
        name: 'Catalog integration updated',
        source: 'custom',
      });
      expect(
        imported.analysis.issues.some((issue) => issue.type === 'unknown_use_case_registry'),
      ).toBe(false);

      await deleteUseCase.execute(customId);
      await expect(getUseCase.execute(customId)).rejects.toBeInstanceOf(RulesUseCaseNotFoundError);
    } finally {
      await database.rulesUseCaseCatalogEntry.deleteMany({
        where: { id: { in: [customId, systemId] } },
      });
      await database.$disconnect();
    }
  });
});
