import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  ACCESS_TOKEN_VERIFIER,
  type AccessTokenVerifier,
} from '@mercure/platform-backend-identity-application';
import { PUBLIC_ROUTE_METADATA } from '@mercure/platform-backend-identity-domain';

import type { MercureAuthenticatedRequest } from './authenticated-request';

function bearerToken(header: string | readonly string[] | undefined): string | null {
  if (typeof header !== 'string') {
    return null;
  }

  const match = /^Bearer ([^\s]+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(ACCESS_TOKEN_VERIFIER) private readonly verifier: AccessTokenVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_METADATA, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<MercureAuthenticatedRequest>();
    const token = bearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Authentication is required.');
    }

    let principal;
    try {
      principal = await this.verifier.verify(token);
    } catch {
      throw new UnauthorizedException('Authentication failed.');
    }

    if (principal.roles.length === 0) {
      throw new ForbiddenException('Authenticated identity has no Mercure role.');
    }

    request.mercurePrincipal = principal;
    return true;
  }
}
