import 'server-only';

import { headers } from 'next/headers';
import { getToken } from 'next-auth/jwt';

import type { MercureSessionToken } from './auth-types';
import { webIdentityEnvironment } from './server-environment';
import { withMercureAccessToken } from './server-request';
import type { MercureWebRole } from './token-claims';

export interface ServerMercureIdentity {
  readonly subject: string;
  readonly displayName: string;
  readonly role: MercureWebRole | null;
}

async function serverSessionToken(): Promise<MercureSessionToken | null> {
  const environment = webIdentityEnvironment();
  const incoming = await headers();
  const cookie = incoming.get('cookie');

  if (!cookie) return null;

  const requestHeaders = new Headers();
  requestHeaders.set('cookie', cookie);

  try {
    return await getToken({
      req: { headers: requestHeaders },
      secret: environment.authSecret,
      secureCookie: environment.secureCookies,
      cookieName: environment.sessionCookieName,
      salt: environment.sessionCookieName,
    });
  } catch {
    return null;
  }
}

export async function getServerMercureIdentity(): Promise<ServerMercureIdentity | null> {
  const token = await serverSessionToken();

  if (
    !token?.sub ||
    token.refreshError === true ||
    token.refreshBoundary === true ||
    typeof token.accessToken !== 'string' ||
    typeof token.accessTokenExpiresAt !== 'number' ||
    token.accessTokenExpiresAt <= Date.now() + 5_000
  ) {
    return null;
  }

  return {
    subject: token.sub,
    displayName:
      (typeof token.name === 'string' && token.name.trim()) ||
      (typeof token.email === 'string' && token.email.trim()) ||
      token.sub,
    role: token.mercureRole ?? null,
  };
}

export async function authenticatedMercureFetch(request: Request): Promise<Response> {
  const token = await serverSessionToken();

  if (
    !token ||
    token.refreshError === true ||
    token.refreshBoundary === true ||
    !token.mercureRole ||
    typeof token.accessToken !== 'string' ||
    typeof token.accessTokenExpiresAt !== 'number'
  ) {
    throw new Error('Authenticated Mercure server session is unavailable.');
  }

  return fetch(withMercureAccessToken(request, token.accessToken, token.accessTokenExpiresAt), {
    cache: 'no-store',
  });
}
