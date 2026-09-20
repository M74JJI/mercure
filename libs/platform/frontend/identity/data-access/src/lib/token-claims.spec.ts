import { describe, expect, it } from 'vitest';

import { parseAccessToken, resolveWebRole } from './token-claims';

function token(payload: Readonly<Record<string, unknown>>): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'RS256' })}.${encode(payload)}.signature`;
}

describe('web identity token claims', () => {
  it(
    'reads Keycloak realm, client and group authorities without trusting them for API authorization',
    () => {
      const accessToken = token({
        exp: 2_000_000_000,
        preferred_username: 'analyst',
        realm_access: { roles: ['user'] },
        resource_access: {
          'mercure-web': { roles: ['dashboard'] },
        },
        groups: ['/security-users'],
      });

      expect(parseAccessToken(accessToken, 'mercure-web')).toMatchObject({
        expiresAtMs: 2_000_000_000_000,
        preferredUsername: 'analyst',
        authorities: ['user', 'dashboard', '/security-users'],
      });
      expect(
        resolveWebRole(
          accessToken,
          'mercure-web',
          ['admin', '/security-admins'],
          ['user', '/security-users'],
        ),
      ).toBe('user');
    },
  );

  it('makes the frontend admin presentation role imply mapped access', () => {
    const accessToken = token({
      realm_access: { roles: ['ADMIN'] },
      groups: [],
    });

    expect(
      resolveWebRole(accessToken, 'mercure-web', ['admin'], ['user']),
    ).toBe('admin');
  });

  it('fails closed for malformed or unmapped tokens', () => {
    expect(resolveWebRole('not-a-jwt', 'mercure-web', ['admin'], ['user'])).toBeNull();

    expect(
      resolveWebRole(
        token({ realm_access: { roles: ['offline_access'] } }),
        'mercure-web',
        ['admin'],
        ['user'],
      ),
    ).toBeNull();
  });
});
