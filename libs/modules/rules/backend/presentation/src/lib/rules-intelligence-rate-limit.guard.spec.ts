import type { ExecutionContext } from '@nestjs/common';
import { TooManyRequestsException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import type { RulesIntelligenceRateLimiter } from '@mercure/rules-backend-application';

import { RulesIntelligenceRateLimitGuard } from './rules-intelligence-rate-limit.guard';

function context(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        mercurePrincipal: {
          subject: 'keycloak-user-123',
          capabilities: ['rules:read'],
          authorities: [],
        },
      }),
      getResponse: () => ({
        header(name: string, value: string) {
          headers[name] = value;
        },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RulesIntelligenceRateLimitGuard', () => {
  it('sets bounded rate headers for an allowed principal', async () => {
    const limiter: RulesIntelligenceRateLimiter = {
      async consume() {
        return {
          allowed: true,
          limit: 120,
          remaining: 119,
          retryAfterSeconds: 60,
        };
      },
    };
    const headers: Record<string, string> = {};
    const guard = new RulesIntelligenceRateLimitGuard(limiter);

    await expect(guard.canActivate(context(headers))).resolves.toBe(true);
    expect(headers).toMatchObject({
      'X-RateLimit-Limit': '120',
      'X-RateLimit-Remaining': '119',
    });
  });

  it('returns 429 semantics and Retry-After when the distributed limit is exhausted', async () => {
    const limiter: RulesIntelligenceRateLimiter = {
      async consume() {
        return {
          allowed: false,
          limit: 2,
          remaining: 0,
          retryAfterSeconds: 37,
        };
      },
    };
    const headers: Record<string, string> = {};
    const guard = new RulesIntelligenceRateLimitGuard(limiter);

    await expect(guard.canActivate(context(headers))).rejects.toBeInstanceOf(
      TooManyRequestsException,
    );
    expect(headers).toMatchObject({
      'X-RateLimit-Limit': '2',
      'X-RateLimit-Remaining': '0',
      'Retry-After': '37',
    });
  });
});
