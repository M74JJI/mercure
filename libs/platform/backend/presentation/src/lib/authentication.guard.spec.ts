import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';

import type { AccessTokenVerifier } from '@mercure/platform-backend-identity-application';
import type { MercureAuthenticatedRequest } from './authenticated-request';
import { AuthenticationGuard } from './authentication.guard';

function executionContext(request: MercureAuthenticatedRequest): ExecutionContext {
  return {
    getHandler: () => executionContext,
    getClass: () => AuthenticationGuard,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}

function reflector(isPublic: boolean): Reflector {
  return {
    getAllAndOverride: vi.fn().mockReturnValue(isPublic),
  } as unknown as Reflector;
}

describe('AuthenticationGuard', () => {
  it('allows explicitly public routes without token verification', async () => {
    const verifier: AccessTokenVerifier = {
      verify: vi.fn(),
    };
    const guard = new AuthenticationGuard(reflector(true), verifier);

    await expect(guard.canActivate(executionContext({ headers: {} }))).resolves.toBe(true);
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('returns 401 when a protected route has no bearer token', async () => {
    const guard = new AuthenticationGuard(reflector(false), {
      verify: vi.fn(),
    });

    await expect(guard.canActivate(executionContext({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns 401 for malformed bearer authorization syntax', async () => {
    const verifier: AccessTokenVerifier = {
      verify: vi.fn(),
    };
    const guard = new AuthenticationGuard(reflector(false), verifier);

    await expect(
      guard.canActivate(
        executionContext({
          headers: { authorization: 'Basic not-a-bearer-token' },
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('returns 403 for a cryptographically valid but unmapped identity', async () => {
    const guard = new AuthenticationGuard(reflector(false), {
      verify: vi.fn().mockResolvedValue({
        subject: 'subject-1',
        roles: [],
        capabilities: [],
        authorities: [],
      }),
    });

    await expect(
      guard.canActivate(
        executionContext({
          headers: { authorization: 'Bearer signed-token' },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('attaches the mapped principal to the request', async () => {
    const principal = {
      subject: 'subject-1',
      roles: ['user'] as const,
      capabilities: ['platform:read', 'rules:read'] as const,
      authorities: ['user'],
    };
    const request: MercureAuthenticatedRequest = {
      headers: { authorization: 'Bearer signed-token' },
    };
    const guard = new AuthenticationGuard(reflector(false), {
      verify: vi.fn().mockResolvedValue(principal),
    });

    await expect(guard.canActivate(executionContext(request))).resolves.toBe(true);
    expect(request.mercurePrincipal).toEqual(principal);
  });
});
