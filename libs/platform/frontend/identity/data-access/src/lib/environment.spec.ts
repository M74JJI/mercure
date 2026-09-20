import { describe, expect, it } from 'vitest';

import { parseWebIdentityEnvironment } from './environment';

describe('web identity environment', () => {
  it('provides development-safe local defaults without weakening production', () => {
    const environment = parseWebIdentityEnvironment({
      NODE_ENV: 'development',
    });

    expect(environment).toMatchObject({
      authOrigin: 'http://localhost:3000',
      clientId: 'mercure-web',
      authorityClientId: 'mercure-api',
      issuer: 'https://identity.example.test/realms/mercure',
      secureCookies: false,
      sessionCookieName: 'authjs.session-token',
    });
  });

  it('requires explicit production identity settings and HTTPS origins', () => {
    expect(() =>
      parseWebIdentityEnvironment({
        NODE_ENV: 'production',
      }),
    ).toThrow('AUTH_SECRET must be explicitly configured in production.');

    expect(() =>
      parseWebIdentityEnvironment({
        NODE_ENV: 'production',
        AUTH_SECRET: 'x'.repeat(32),
        AUTH_URL: 'http://mercure.example.test',
        AUTH_TRUST_HOST: 'true',
        AUTH_KEYCLOAK_ID: 'mercure-web',
        AUTH_KEYCLOAK_SECRET: 'not-a-real-secret',
        AUTH_KEYCLOAK_ISSUER: 'https://identity.example.test/realms/mercure',
        WEB_AUTH_AUTHORITY_CLIENT_ID: 'mercure-api',
      }),
    ).toThrow('AUTH_URL must use https:// in production.');
  });

  it('normalizes authority lists and secure session-cookie behavior', () => {
    const environment = parseWebIdentityEnvironment({
      NODE_ENV: 'production',
      AUTH_SECRET: 'x'.repeat(32),
      AUTH_URL: 'https://mercure.example.test',
      AUTH_TRUST_HOST: 'true',
      AUTH_KEYCLOAK_ID: 'mercure-web',
      AUTH_KEYCLOAK_SECRET: 'not-a-real-secret',
      AUTH_KEYCLOAK_ISSUER: 'https://identity.example.test/realms/mercure/',
      WEB_AUTH_AUTHORITY_CLIENT_ID: 'mercure-api',
      WEB_AUTH_ADMIN_AUTHORITIES: 'admin, /security-admins, admin',
      WEB_AUTH_USER_AUTHORITIES: 'user, /security-users',
    });

    expect(environment).toMatchObject({
      authOrigin: 'https://mercure.example.test',
      secureCookies: true,
      sessionCookieName: '__Secure-authjs.session-token',
      issuer: 'https://identity.example.test/realms/mercure',
      adminAuthorities: ['admin', '/security-admins'],
      userAuthorities: ['user', '/security-users'],
    });
  });
});
