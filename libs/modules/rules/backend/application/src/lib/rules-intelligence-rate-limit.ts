export const RULES_INTELLIGENCE_RATE_LIMITER = Symbol(
  'mercure.rules.intelligence-rate-limiter',
);

export interface RulesIntelligenceRateLimitDecision {
  readonly allowed: boolean;
  readonly limit: number;
  readonly remaining: number;
  readonly retryAfterSeconds: number;
}

export interface RulesIntelligenceRateLimiter {
  consume(subject: string): Promise<RulesIntelligenceRateLimitDecision>;
}
