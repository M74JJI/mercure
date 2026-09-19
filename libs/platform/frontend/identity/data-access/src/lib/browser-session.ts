import type { MercureBrowserSession, MercureSessionToken } from './auth-types';

export function browserFacingSession(
  session: MercureBrowserSession,
  token: MercureSessionToken,
): MercureBrowserSession {
  return {
    user: {
      ...session.user,
      mercureRole: token.mercureRole ?? null,
    },
    expires: session.expires,
    refreshBoundary: token.refreshBoundary === true,
    ...(token.refreshError === true ? { error: 'RefreshTokenError' as const } : {}),
  };
}
