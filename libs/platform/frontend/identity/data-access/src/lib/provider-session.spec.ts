import { describe, expect, it, vi } from 'vitest';

import type { WebIdentityEnvironment } from './environment';
import {
  ProviderTokenRefreshError,
  initialProviderSession,
  refreshProviderSession,
  shouldRefreshProviderSession,
} from './provider-session';

const environment: WebIdentityEnvironment = {
  nodeEnvironment: 'test',
  authSecret: 'x'.repeat(32),
  authOrigin: 'https://mercure.example.test',
  trustHost: true,
  clientId: 'mercure-web',
  authorityClientId: 'mercure-api',
  clientSecret: 'test-client-secret',
  issuer: 'https://identity.example.test/realms/mercure',
  adminAuthorities: ['admin'],
  userAuthorities: ['user'],
  refreshSkewMs: 60_000,
  refreshTimeoutMs: 5_000,
  sessionMaxAgeSeconds: 28_800,
  secureCookies: true,
  sessionCookieName: '__Secure-authjs.session-token',
};

function jwt(payload: Readonly<Record<string, unknown>>): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'RS256' })}.${encode(payload)}.signature`;
}

describe('provider session lifecycle', () => {
  it('initializes expiry and mapped role from Keycloak token state', () => {
    const state = initialProviderSession(
      jwt({
        exp: 2_000_000_000,
        resource_access: {
          'mercure-api': { roles: ['user'] },
          'mercure-web': { roles: ['unmapped-web-role'] },
        },
      }),
      undefined,
      ' refresh-token ',
      environment,
    );

    expect(state).toMatchObject({
      accessTokenExpiresAt: 2_000_000_000_000,
      refreshToken: 'refresh-token',
      mercureRole: 'user',
      refreshBoundary: false,
      refreshError: false,
    });
  });

  it('refreshes through the provider endpoint and preserves rotation state', async () => {
    const refreshedAccessToken = jwt({
      exp: 2_100_000_000,
      resource_access: {
        'mercure-api': { roles: ['admin'] },
      },
    });
    const fetchImplementation = vi.fn(
      async (_input: string | URL | Request, init?: RequestInit) => {
        expect(init?.method).toBe('POST');
        expect(String(init?.body)).toContain('grant_type=refresh_token');
        expect(String(init?.body)).toContain('refresh_token=refresh-1');
        expect(String(init?.body)).toContain('client_secret=test-client-secret');

        return new Response(
          JSON.stringify({
            access_token: refreshedAccessToken,
            expires_in: 300,
            refresh_token: 'refresh-2',
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        );
      },
    );

    const state = await refreshProviderSession(
      {
        accessToken: jwt({ realm_access: { roles: ['user'] } }),
        accessTokenExpiresAt: Date.now() - 1,
        refreshToken: 'refresh-1',
        mercureRole: 'user',
        refreshBoundary: false,
        refreshError: false,
      },
      environment,
      fetchImplementation,
    );

    expect(fetchImplementation).toHaveBeenCalledOnce();
    expect(state).toMatchObject({
      accessToken: refreshedAccessToken,
      refreshToken: 'refresh-2',
      mercureRole: 'admin',
      refreshBoundary: true,
      refreshError: false,
    });
    expect(state.accessTokenExpiresAt).toBeGreaterThan(Date.now());
  });

  it('keeps the previous refresh token when Keycloak does not rotate it', async () => {
    const state = await refreshProviderSession(
      {
        accessToken: jwt({ realm_access: { roles: ['user'] } }),
        accessTokenExpiresAt: Date.now() - 1,
        refreshToken: 'refresh-1',
        mercureRole: 'user',
        refreshBoundary: false,
        refreshError: false,
      },
      environment,
      async () =>
        new Response(
          JSON.stringify({
            access_token: jwt({ realm_access: { roles: ['user'] } }),
            expires_in: 300,
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
    );

    expect(state.refreshToken).toBe('refresh-1');
  });

  it('fails closed on provider or response failures without leaking provider content', async () => {
    const current = {
      accessToken: jwt({ realm_access: { roles: ['user'] } }),
      accessTokenExpiresAt: Date.now() - 1,
      refreshToken: 'refresh-1',
      mercureRole: 'user' as const,
      refreshBoundary: false,
      refreshError: false,
    };

    const error = await refreshProviderSession(
      current,
      environment,
      async () => new Response('sensitive provider detail', { status: 400 }),
    ).catch((failure: unknown) => failure);

    expect(error).toBeInstanceOf(ProviderTokenRefreshError);
    expect(String(error)).not.toContain('sensitive provider detail');
  });

  it('uses the configured skew when deciding whether to refresh', () => {
    const now = 1_000_000;

    expect(
      shouldRefreshProviderSession(
        {
          accessToken: 'token',
          accessTokenExpiresAt: now + 59_999,
          mercureRole: 'user',
          refreshBoundary: false,
          refreshError: false,
        },
        environment,
        now,
      ),
    ).toBe(true);

    expect(
      shouldRefreshProviderSession(
        {
          accessToken: 'token',
          accessTokenExpiresAt: now + 60_001,
          mercureRole: 'user',
          refreshBoundary: false,
          refreshError: false,
        },
        environment,
        now,
      ),
    ).toBe(false);
  });
});
