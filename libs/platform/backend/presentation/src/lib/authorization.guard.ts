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
  hasCapability,
  PUBLIC_ROUTE_METADATA,
  REQUIRED_CAPABILITIES_METADATA,
  type MercureCapability,
} from '@mercure/platform-backend-identity-domain';

import type { MercureAuthenticatedRequest } from './authenticated-request';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_METADATA, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    if (isPublic) {
      return true;
    }

    const required =
      this.reflector.getAllAndOverride<readonly MercureCapability[]>(
        REQUIRED_CAPABILITIES_METADATA,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<MercureAuthenticatedRequest>();
    const principal = request.mercurePrincipal;
    if (!principal) {
      throw new UnauthorizedException('Authentication is required.');
    }

    if (!required.every((capability) => hasCapability(principal, capability))) {
      throw new ForbiddenException('Required capability is missing.');
    }

    return true;
  }
}
