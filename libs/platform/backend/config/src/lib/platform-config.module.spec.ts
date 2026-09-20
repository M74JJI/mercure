import { describe, expect, it } from 'vitest';

import { parsePlatformEnvironment } from './platform-config.module';

const baseEnvironment = {
  DATABASE_URL: 'postgresql://mercure:mercure@127.0.0.1:5432/mercure',
} as const;

describe('platform OIDC configuration', () => {
  it('provides deterministic non-production defaults', () => {
    const config = parsePlatformEnvironment({
      ...baseEnvironment,
      NODE_ENV: 'test',
    });

    expect(config.API_BODY_LIMIT_BYTES).toBe(4 * 1024 * 1024);
    expect(config.OIDC_ISSUER_URL).toBe('https://identity.example.test/realms/mercure');
    expect(config.OIDC_AUDIENCE).toBe('mercure-api');
    expect(config.OIDC_CLIENT_ID).toBe('mercure-api');
    expect(config.OIDC_ADMIN_AUTHORITIES).toEqual(['admin', '/security-admins']);
    expect(config.OIDC_USER_AUTHORITIES).toEqual(['user', '/security-users']);
  });

  it('rejects transport body limits that cannot carry a maximum authoring draft safely', () => {
    expect(() =>
      parsePlatformEnvironment({
        ...baseEnvironment,
        NODE_ENV: 'test',
        API_BODY_LIMIT_BYTES: 2 * 1024 * 1024,
      }),
    ).toThrow();
  });

  it('requires explicit production OIDC identity settings', () => {
    expect(() =>
      parsePlatformEnvironment({
        ...baseEnvironment,
        NODE_ENV: 'production',
      }),
    ).toThrow('OIDC_ISSUER_URL must be explicitly configured in production.');
  });

  it('requires explicit production authority mappings', () => {
    expect(() =>
      parsePlatformEnvironment({
        ...baseEnvironment,
        NODE_ENV: 'production',
        OIDC_ISSUER_URL: 'https://identity.example.test/realms/mercure',
        OIDC_AUDIENCE: 'mercure-api',
        OIDC_CLIENT_ID: 'mercure-api',
      }),
    ).toThrow('OIDC_ADMIN_AUTHORITIES must be explicitly configured in production.');
  });

  it('requires HTTPS issuer and explicit audience/client in production', () => {
    expect(() =>
      parsePlatformEnvironment({
        ...baseEnvironment,
        NODE_ENV: 'production',
        OIDC_ISSUER_URL: 'http://identity.internal/realms/mercure',
        OIDC_AUDIENCE: 'mercure-api',
        OIDC_CLIENT_ID: 'mercure-api',
        OIDC_ADMIN_AUTHORITIES: 'mercure-admin',
        OIDC_USER_AUTHORITIES: 'mercure-user',
      }),
    ).toThrow('OIDC_ISSUER_URL must use https:// in production.');
  });

  it('rejects CORS values that are URLs rather than bare origins', () => {
    for (const origin of [
      'https://user:secret@mercure.example.test',
      'https://mercure.example.test/path',
      'https://mercure.example.test?debug=true',
      'https://mercure.example.test#fragment',
    ]) {
      expect(() =>
        parsePlatformEnvironment({
          ...baseEnvironment,
          API_CORS_ORIGINS: origin,
        }),
      ).toThrow();
    }

    expect(
      parsePlatformEnvironment({
        ...baseEnvironment,
        API_CORS_ORIGINS: 'https://mercure.example.test/',
      }).API_CORS_ORIGINS,
    ).toEqual(['https://mercure.example.test']);
  });

  it('requires HTTPS CORS origins in production', () => {
    expect(() =>
      parsePlatformEnvironment({
        ...baseEnvironment,
        NODE_ENV: 'production',
        API_CORS_ORIGINS: 'http://mercure.example.test',
        OIDC_ISSUER_URL: 'https://identity.example.test/realms/mercure',
        OIDC_AUDIENCE: 'mercure-api',
        OIDC_CLIENT_ID: 'mercure-api',
      }),
    ).toThrow('API_CORS_ORIGINS must use https:// origins in production.');

    expect(
      parsePlatformEnvironment({
        ...baseEnvironment,
        NODE_ENV: 'production',
        API_CORS_ORIGINS: 'https://mercure.example.test',
        OIDC_ISSUER_URL: 'https://identity.example.test/realms/mercure',
        OIDC_AUDIENCE: 'mercure-api',
        OIDC_CLIENT_ID: 'mercure-api',
        OIDC_ADMIN_AUTHORITIES: 'mercure-admin',
        OIDC_USER_AUTHORITIES: 'mercure-user',
      }).API_CORS_ORIGINS,
    ).toEqual(['https://mercure.example.test']);
  });

  it('normalizes configured role authorities without permitting an empty mapping', () => {
    const config = parsePlatformEnvironment({
      ...baseEnvironment,
      NODE_ENV: 'test',
      OIDC_ADMIN_AUTHORITIES: ' admin, /security-admins, admin ',
      OIDC_USER_AUTHORITIES: ' user, /security-users ',
    });

    expect(config.OIDC_ADMIN_AUTHORITIES).toEqual(['admin', '/security-admins']);
    expect(config.OIDC_USER_AUTHORITIES).toEqual(['user', '/security-users']);

    expect(() =>
      parsePlatformEnvironment({
        ...baseEnvironment,
        NODE_ENV: 'test',
        OIDC_ADMIN_AUTHORITIES: ' , ',
      }),
    ).toThrow();
  });
});
