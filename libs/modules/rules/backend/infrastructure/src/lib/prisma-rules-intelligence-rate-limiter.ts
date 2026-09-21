import { createHash } from 'node:crypto';

import type { PrismaClient } from '@mercure/platform-backend-database/client';
import type {
  RulesIntelligenceRateLimitDecision,
  RulesIntelligenceRateLimiter,
} from '@mercure/rules-backend-application';

interface RateLimitRow {
  readonly count: number;
  readonly retryAfterSeconds: number;
}

export class PrismaRulesIntelligenceRateLimiter implements RulesIntelligenceRateLimiter {
  constructor(
    private readonly database: PrismaClient,
    private readonly maxRequests: number,
    private readonly windowSeconds: number,
  ) {
    if (!Number.isInteger(maxRequests) || maxRequests < 1) {
      throw new Error('Rules intelligence rate-limit request count must be positive.');
    }
    if (!Number.isInteger(windowSeconds) || windowSeconds < 1) {
      throw new Error('Rules intelligence rate-limit window must be positive.');
    }
  }

  async consume(subject: string): Promise<RulesIntelligenceRateLimitDecision> {
    const key = createHash('sha256').update('rules-intelligence:').update(subject).digest('hex');
    const cappedCount = this.maxRequests + 1;

    const rows = await this.database.$queryRaw<RateLimitRow[]>`
      INSERT INTO "rules_intelligence_rate_limits" ("key", "window_start", "count")
      VALUES (${key}, NOW(), 1)
      ON CONFLICT ("key") DO UPDATE
      SET
        "count" = CASE
          WHEN "rules_intelligence_rate_limits"."window_start"
            <= NOW() - (${this.windowSeconds} * INTERVAL '1 second')
            THEN 1
          ELSE LEAST("rules_intelligence_rate_limits"."count" + 1, ${cappedCount})
        END,
        "window_start" = CASE
          WHEN "rules_intelligence_rate_limits"."window_start"
            <= NOW() - (${this.windowSeconds} * INTERVAL '1 second')
            THEN NOW()
          ELSE "rules_intelligence_rate_limits"."window_start"
        END
      RETURNING
        "count",
        GREATEST(
          1,
          CEIL(
            EXTRACT(
              EPOCH FROM (
                "window_start"
                + (${this.windowSeconds} * INTERVAL '1 second')
                - NOW()
              )
            )
          )::int
        ) AS "retryAfterSeconds"
    `;

    const row = rows[0];
    if (!row) {
      throw new Error('Rules intelligence rate limiter did not return a decision.');
    }

    return {
      allowed: row.count <= this.maxRequests,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - row.count),
      retryAfterSeconds: row.retryAfterSeconds,
    };
  }
}
