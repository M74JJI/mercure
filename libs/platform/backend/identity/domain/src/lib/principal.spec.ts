import { describe, expect, it } from 'vitest';

import { hasCapability, resolveMercurePrincipal } from './principal';

const mapping = {
  admin: ['admin', '/security-admins'],
  user: ['user', '/security-users'],
} as const;

describe('identity principal mapping', () => {
  it('grants user read capabilities only', () => {
    const principal = resolveMercurePrincipal(
      {
        subject: 'user-1',
        realmRoles: ['USER'],
        clientRoles: [],
        groups: [],
      },
      mapping,
    );

    expect(principal.roles).toEqual(['user']);
    expect(principal.capabilities).toEqual(['platform:read', 'rules:read']);
    expect(hasCapability(principal, 'rules:import')).toBe(false);
  });

  it('makes admin imply user and mutating Rules capabilities', () => {
    const principal = resolveMercurePrincipal(
      {
        subject: 'admin-1',
        realmRoles: [],
        clientRoles: [],
        groups: ['/Security-Admins'],
      },
      mapping,
    );

    expect(principal.roles).toEqual(['admin', 'user']);
    expect(principal.capabilities).toEqual([
      'platform:read',
      'rules:read',
      'rules:import',
      'rules:admin',
    ]);
  });

  it('keeps unmapped authenticated identities capability-free', () => {
    const principal = resolveMercurePrincipal(
      {
        subject: 'unmapped-1',
        realmRoles: ['offline_access'],
        clientRoles: ['account-view-profile'],
        groups: ['/other'],
      },
      mapping,
    );

    expect(principal.roles).toEqual([]);
    expect(principal.capabilities).toEqual([]);
  });

  it('rejects an empty subject', () => {
    expect(() =>
      resolveMercurePrincipal(
        {
          subject: '   ',
          realmRoles: [],
          clientRoles: [],
          groups: [],
        },
        mapping,
      ),
    ).toThrow('External identity subject must not be empty.');
  });
});
