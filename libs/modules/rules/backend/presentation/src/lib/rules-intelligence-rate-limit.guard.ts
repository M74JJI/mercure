import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  TooManyRequestsException,
  UnauthorizedException,
} from '@nestjs/common';

import type { MercurePrincipal } from '@mercure/platform-backend-identity-domain';
import {
  RULES_INTELLIGENCE_RATE_LIMITER,
  type RulesIntelligenceRateLimiter,
} from '@mercure/rules-backend-application';

interface PrincipalRequest {
  readonly mercurePrincipal?: MercurePrincipal;
}

interface RateLimitReply {
  header(name: string, value: string): unknown;
}

@Injectable()
export class RulesIntelligenceRateLimitGuard implements CanActivate {
  constructor(
    @Inject(RULES_INTELLIGENCE_RATE_LIMITER)
    private readonly limiter: RulesIntelligenceRateLimiter,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<PrincipalRequest>();
    const reply = http.getResponse<RateLimitReply>();
    const principal = request.mercurePrincipal;

    if (!principal) {
      throw new UnauthorizedException('Authentication is required.');
    }

    const decision = await this.limiter.consume(principal.subject);

    reply.header('X-RateLimit-Limit', String(decision.limit));
    reply.header('X-RateLimit-Remaining', String(decision.remaining));

    if (!decision.allowed) {
      reply.header('Retry-After', String(decision.retryAfterSeconds));
      throw new TooManyRequestsException('Rules intelligence request rate exceeded.');
    }

    return true;
  }
}
