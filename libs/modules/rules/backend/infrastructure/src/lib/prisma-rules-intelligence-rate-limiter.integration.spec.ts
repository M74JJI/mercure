import { describe, expect, it } from 'vitest';

import { createPrismaClient } from '@mercure/platform-backend-database/client';

import { PrismaRulesIntelligenceRateLimiter } from './prisma-rules-intelligence-rate-limiter';

const integrationEnabled = process.env['RULES_PERSISTENCE_INTEGRATION'] === '1';

describe.runIf(integrationEnabled)('PrismaRulesIntelligenceRateLimiter', () => {
  it('enforces one principal budget across independent database clients', async () => {
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
      await firstDatabase.rulesIntelligenceRateLimit.deleteMany();

      const firstLimiter = new PrismaRulesIntelligenceRateLimiter(firstDatabase, 2, 60);
      const secondLimiter = new PrismaRulesIntelligenceRateLimiter(secondDatabase, 2, 60);

      await expect(firstLimiter.consume('integration-subject')).resolves.toMatchObject({
        allowed: true,
        remaining: 1,
      });
      await expect(secondLimiter.consume('integration-subject')).resolves.toMatchObject({
        allowed: true,
        remaining: 0,
      });
      await expect(firstLimiter.consume('integration-subject')).resolves.toMatchObject({
        allowed: false,
        remaining: 0,
      });
      await expect(secondLimiter.consume('different-subject')).resolves.toMatchObject({
        allowed: true,
        remaining: 1,
      });
    } finally {
      await firstDatabase.rulesIntelligenceRateLimit.deleteMany();
      await Promise.all([firstDatabase.$disconnect(), secondDatabase.$disconnect()]);
    }
  });

  it('removes stale principal buckets when a new window starts', async () => {
    const databaseUrl = process.env['DATABASE_URL'];
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required for Rules persistence integration tests.');
    }

    const database = createPrismaClient({
      connectionString: databaseUrl,
      max: 2,
      connectionTimeoutMillis: 2_000,
      idleTimeoutMillis: 5_000,
    });

    const staleKey = 'a'.repeat(64);
    const activeKey = 'b'.repeat(64);

    try {
      await database.rulesIntelligenceRateLimit.deleteMany();
      await database.rulesIntelligenceRateLimit.createMany({
        data: [
          {
            key: staleKey,
            windowStart: new Date(Date.now() - 180_000),
            count: 1,
          },
          {
            key: activeKey,
            windowStart: new Date(),
            count: 1,
          },
        ],
      });

      const limiter = new PrismaRulesIntelligenceRateLimiter(database, 2, 60);
      await expect(limiter.consume('cleanup-trigger')).resolves.toMatchObject({
        allowed: true,
        remaining: 1,
      });

      await expect(
        database.rulesIntelligenceRateLimit.findUnique({ where: { key: staleKey } }),
      ).resolves.toBeNull();
      await expect(
        database.rulesIntelligenceRateLimit.findUnique({ where: { key: activeKey } }),
      ).resolves.not.toBeNull();
    } finally {
      await database.rulesIntelligenceRateLimit.deleteMany();
      await database.$disconnect();
    }
  });
});
