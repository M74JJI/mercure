import { describe, expect, it } from 'vitest';

import { PostgresRulesetImportLease } from './postgres-ruleset-import-lease';

const integrationEnabled = process.env['RULES_PERSISTENCE_INTEGRATION'] === '1';

describe.runIf(integrationEnabled)('PostgresRulesetImportLease', () => {
  it('holds the import lock for the lifetime of the dedicated PostgreSQL session', async () => {
    const databaseUrl = process.env['DATABASE_URL'];
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required for Rules persistence integration tests.');
    }

    const options = {
      connectionString: databaseUrl,
      connectionTimeoutMillis: 2_000,
    };
    const firstLease = new PostgresRulesetImportLease(options);
    const secondLease = new PostgresRulesetImportLease(options);

    const firstHandle = await firstLease.acquire();
    expect(firstHandle).not.toBeNull();

    try {
      await expect(secondLease.acquire()).resolves.toBeNull();
    } finally {
      await firstHandle?.release();
    }

    const secondHandle = await secondLease.acquire();
    expect(secondHandle).not.toBeNull();
    await secondHandle?.release();
  });
});
