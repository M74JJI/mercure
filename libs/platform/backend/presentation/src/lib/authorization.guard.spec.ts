import {
  ForbiddenException,
  type ExecutionContext,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';

import type { MercureAuthenticatedRequest } from './authenticated-request';
import { AuthorizationGuard } from './authorization.guard';

function executionContext(request: MercureAuthenticatedRequest): ExecutionContext {
  return {
    getHandler: () => executionContext,
    getClass: () => AuthorizationGuard,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}

function reflector(required: readonly string[], isPublic = false): Reflector {
  return {
    getAllAndOverride: vi
      .fn()
      .mockReturnValueOnce(isPublic)
      .mockReturnValueOnce(required),
  } as unknown as Reflector;
}

const userRequest: MercureAuthenticatedRequest = {
  headers: {},
  mercurePrincipal: {
    subject: 'subject-1',
    roles: ['user'],
    capabilities: ['platform:read', 'rules:read'],
    authorities: ['user'],
  },
};

describe('AuthorizationGuard', () => {
  it('allows a user with rules:read', () => {
    const guard = new AuthorizationGuard(reflector(['rules:read']));

    expect(guard.canActivate(executionContext(userRequest))).toBe(true);
  });

  it('returns 403 when a user attempts rules:import', () => {
    const guard = new AuthorizationGuard(reflector(['rules:import']));

    expect(() => guard.canActivate(executionContext(userRequest))).toThrow(ForbiddenException);
  });

  it('allows explicitly public routes without capability evaluation', () => {
    const guard = new AuthorizationGuard(reflector([], true));

    expect(guard.canActivate(executionContext({ headers: {} }))).toBe(true);
  });
});
