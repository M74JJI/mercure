import {
  createPostgresSession,
  type PostgresSessionOptions,
} from '@mercure/platform-backend-database/client';
import type {
  RulesetImportLease,
  RulesetImportLeaseHandle,
} from '@mercure/rules-backend-application';

const IMPORT_LOCK_NAMESPACE = 1_296_384_579;
const IMPORT_LOCK_KEY = 1_381_320_773;

export type PostgresRulesetImportLeaseOptions = PostgresSessionOptions;

export class PostgresRulesetImportLease implements RulesetImportLease {
  constructor(private readonly options: PostgresRulesetImportLeaseOptions) {}

  async acquire(): Promise<RulesetImportLeaseHandle | null> {
    const client = createPostgresSession(this.options);

    try {
      await client.connect();
      const result = await client.query<{ acquired: boolean }>(
        'SELECT pg_try_advisory_lock($1, $2) AS acquired',
        [IMPORT_LOCK_NAMESPACE, IMPORT_LOCK_KEY],
      );

      if (result.rows[0]?.acquired !== true) {
        await client.end();
        return null;
      }
    } catch (error) {
      await client.end().catch(() => undefined);
      throw error;
    }

    let released = false;
    return {
      release: async () => {
        if (released) return;
        released = true;

        try {
          await client.query('SELECT pg_advisory_unlock($1, $2)', [
            IMPORT_LOCK_NAMESPACE,
            IMPORT_LOCK_KEY,
          ]);
        } finally {
          await client.end();
        }
      },
    };
  }
}
