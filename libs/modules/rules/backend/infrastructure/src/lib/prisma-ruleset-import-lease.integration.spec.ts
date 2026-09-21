import { describe, expect, it } from 'vitest';

import { createPrismaClient } from '@mercure/platform-backend-database/client';

import { PrismaRulesetImportLease } from './prisma-ruleset-import-lease';

const integrationEnabled = process.env['RULES_PERSISTENCE_INTEGRATION'] === '1';

describe.runIf(integrationEnabled)('PrismaRulesetImportLease', () => {
  it('coordinates imports across independent database clients', async () => {
    const databaseUrl = process.env['DATABASE_URL'];
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required for Rules persistence integration tests.');
    }

    const firstDatabase = createPrismaClient({
      connectionString: databaseUrl,
      max: 2,
      connectionTimeoutMillis: 2_000,
      idleTimeoutMillis: 5_000,
    });
    const secondDatabase = createPrismaClient({
      connectionString: databaseUrl,
      max: 2,
      connectionTimeoutMillis: 2_000,
      idleTimeoutMillis: 5_000,
    });

    try {
      await firstDatabase.rulesetImportLease.deleteMany({
        where: { key: 'snapshot-import' },
      });

      const firstLease = new PrismaRulesetImportLease(firstDatabase);
      const secondLease = new PrismaRulesetImportLease(secondDatabase);

      const firstHandle = await firstLease.acquire();
      expect(firstHandle).not.toBeNull();
      await expect(secondLease.acquire()).resolves.toBeNull();

      await firstHandle?.release();

      const secondHandle = await secondLease.acquire();
      expect(secondHandle).not.toBeNull();
      await secondHandle?.release();
    } finally {
      await firstDatabase.rulesetImportLease.deleteMany({
        where: { key: 'snapshot-import' },
      });
      await Promise.all([firstDatabase.$disconnect(), secondDatabase.$disconnect()]);
    }
  });
});
