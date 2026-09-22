import 'server-only';

import NextAuth, { type NextAuthConfig } from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';
import { NextResponse } from 'next/server';

import { browserFacingSession } from './browser-session';
import type { MercureSessionToken } from './auth-types';
import { canonicalAuthRedirect, signInRedirect } from './auth-navigation';
import {
  createContentSecurityPolicyContext,
  isPublicIdentityPath,
} from './content-security-policy';
import {
  ProviderTokenRefreshError,
  initialProviderSession,
  refreshProviderSession,
  shouldRefreshProviderSession,
  type ProviderSessionState,
} from './provider-session';
import type { WebIdentityEnvironment } from './environment';
import { webIdentityEnvironment } from './server-environment';

function stateFromToken(token: {
  readonly accessToken?: string;
  readonly accessTokenExpiresAt?: number;
  readonly refreshToken?: string;
  readonly mercureRole?: 'admin' | 'user' | null;
  readonly refreshBoundary?: boolean;
  readonly refreshError?: boolean;
}): ProviderSessionState | null {
  if (
    typeof token.accessToken !== 'string' ||
    !token.accessToken ||
    typeof token.accessTokenExpiresAt !== 'number' ||
    !Number.isFinite(token.accessTokenExpiresAt)
  ) {
    return null;
  }

  return {
    accessToken: token.accessToken,
    accessTokenExpiresAt: token.accessTokenExpiresAt,
    ...(token.refreshToken ? { refreshToken: token.refreshToken } : {}),
    mercureRole: token.mercureRole ?? null,
    refreshBoundary: token.refreshBoundary === true,
    refreshError: token.refreshError === true,
  };
}

function invalidateProviderState(token: MercureSessionToken): MercureSessionToken {
  const safeToken = { ...token };
  delete safeToken.accessToken;
  delete safeToken.accessTokenExpiresAt;
  delete safeToken.refreshToken;

  return {
    ...safeToken,
    mercureRole: null,
    refreshBoundary: false,
    refreshError: true,
  };
}

export function createIdentityAuthConfig(
  environment: WebIdentityEnvironment,
  fetchImplementation: typeof fetch = fetch,
): NextAuthConfig {
  return {
    secret: environment.authSecret,
    trustHost: environment.trustHost,
    useSecureCookies: environment.secureCookies,
    session: {
      strategy: 'jwt',
      maxAge: environment.sessionMaxAgeSeconds,
    },
    cookies: {
      sessionToken: {
        name: environment.sessionCookieName,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: environment.secureCookies,
        },
      },
    },
    pages: {
      signIn: '/auth/sign-in',
      error: '/auth/error',
    },
    providers: [
      Keycloak({
        clientId: environment.clientId,
        clientSecret: environment.clientSecret,
        issuer: environment.issuer,
        authorization: {
          params: {
            scope: 'openid profile email',
          },
        },
      }),
    ],
    callbacks: {
      async jwt({ token, account }) {
        if (account) {
          if (typeof account.access_token !== 'string' || !account.access_token.trim()) {
            return invalidateProviderState(token);
          }

          try {
            return {
              ...token,
              ...initialProviderSession(
                account.access_token,
                account.expires_at,
                account.refresh_token,
                environment,
              ),
            };
          } catch (error) {
            if (error instanceof ProviderTokenRefreshError) {
              return invalidateProviderState(token);
            }
            throw error;
          }
        }

        const current = stateFromToken(token);
        if (!current || current.refreshError) {
          return invalidateProviderState(token);
        }

        if (current.refreshBoundary && !shouldRefreshProviderSession(current, environment)) {
          return {
            ...token,
            refreshBoundary: false,
          };
        }

        if (!shouldRefreshProviderSession(current, environment)) {
          return token;
        }

        try {
          return {
            ...token,
            ...(await refreshProviderSession(current, environment, fetchImplementation)),
          };
        } catch (error) {
          if (error instanceof ProviderTokenRefreshError) {
            return invalidateProviderState(token);
          }
          throw error;
        }
      },
      session({ session, token }) {
        return browserFacingSession(session, token);
      },
      redirect({ url }) {
        return canonicalAuthRedirect(url, environment.authOrigin).toString();
      },
      authorized({ request, auth }) {
        const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
        const contentSecurityPolicy = createContentSecurityPolicyContext(request.headers);

        const withContentSecurityPolicy = (response: NextResponse) => {
          response.headers.set('Content-Security-Policy', contentSecurityPolicy.value);
          return response;
        };

        const continueRequest = () =>
          withContentSecurityPolicy(
            NextResponse.next({
              request: {
                headers: contentSecurityPolicy.requestHeaders,
              },
            }),
          );

        const redirectWithContentSecurityPolicy = (url: URL) =>
          withContentSecurityPolicy(NextResponse.redirect(url));

        if (isPublicIdentityPath(request.nextUrl.pathname)) {
          return continueRequest();
        }

        if (!auth?.user || auth.error === 'RefreshTokenError') {
          return redirectWithContentSecurityPolicy(
            signInRedirect(requestedPath, environment.authOrigin),
          );
        }

        if (!auth.user.mercureRole) {
          return redirectWithContentSecurityPolicy(
            canonicalAuthRedirect('/auth/forbidden', environment.authOrigin),
          );
        }

        if (auth.refreshBoundary) {
          return redirectWithContentSecurityPolicy(
            canonicalAuthRedirect(requestedPath, environment.authOrigin),
          );
        }

        return continueRequest();
      },
    },
  };
}

const authEnvironment = webIdentityEnvironment();
const identityAuth = NextAuth(createIdentityAuthConfig(authEnvironment));

export const identityAuthHandlers = identityAuth.handlers;
export const identityProxy = identityAuth.auth;
