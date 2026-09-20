import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
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
    getAllAndOverride: vi.fn().mockReturnValueOnce(isPublic).mockReturnValueOnce(required),
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

const adminRequest: MercureAuthenticatedRequest = {
  headers: {},
  mercurePrincipal: {
    subject: 'admin-subject-1',
    roles: ['admin', 'user'],
    capabilities: ['platform:read', 'rules:read', 'rules:import', 'rules:admin'],
    authorities: ['admin'],
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

  it('returns 403 when a normal Rules reader attempts rules:admin', () => {
    const guard = new AuthorizationGuard(reflector(['rules:admin']));

    expect(() => guard.canActivate(executionContext(userRequest))).toThrow(ForbiddenException);
  });

  it('allows an admin principal with rules:admin', () => {
    const guard = new AuthorizationGuard(reflector(['rules:admin']));

    expect(guard.canActivate(executionContext(adminRequest))).toBe(true);
  });

  it('fails closed when an authenticated route has no authorization policy', () => {
    const guard = new AuthorizationGuard(reflector([]));

    expect(() => guard.canActivate(executionContext(userRequest))).toThrow(ForbiddenException);
  });

  it('allows explicitly public routes without capability evaluation', () => {
    const guard = new AuthorizationGuard(reflector([], true));

    expect(guard.canActivate(executionContext({ headers: {} }))).toBe(true);
  });
});
