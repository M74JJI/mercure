import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@mercure/platform-backend-database/client';
import type {
  RulesetImportLease,
  RulesetImportLeaseHandle,
} from '@mercure/rules-backend-application';

const IMPORT_LEASE_KEY = 'snapshot-import';
const IMPORT_LEASE_DURATION_SECONDS = 60 * 60;

export class PrismaRulesetImportLease implements RulesetImportLease {
  constructor(private readonly database: PrismaClient) {}

  async acquire(): Promise<RulesetImportLeaseHandle | null> {
    const owner = randomUUID();
    const rows = await this.database.$queryRaw<Array<{ owner: string }>>`
      INSERT INTO "ruleset_import_leases" ("key", "owner", "acquired_at", "expires_at")
      VALUES (
        ${IMPORT_LEASE_KEY},
        ${owner}::uuid,
        NOW(),
        NOW() + (${IMPORT_LEASE_DURATION_SECONDS} * INTERVAL '1 second')
      )
      ON CONFLICT ("key") DO UPDATE
      SET
        "owner" = EXCLUDED."owner",
        "acquired_at" = EXCLUDED."acquired_at",
        "expires_at" = EXCLUDED."expires_at"
      WHERE "ruleset_import_leases"."expires_at" <= NOW()
      RETURNING "owner"::text AS "owner"
    `;

    if (rows[0]?.owner !== owner) {
      return null;
    }

    let released = false;
    return {
      release: async () => {
        if (released) return;
        released = true;
        await this.database.$executeRaw`
          DELETE FROM "ruleset_import_leases"
          WHERE "key" = ${IMPORT_LEASE_KEY}
            AND "owner" = ${owner}::uuid
        `;
      },
    };
  }
}
