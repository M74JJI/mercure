import type { DefaultSession, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

import type { MercureWebRole } from './token-claims';

declare module 'next-auth' {
  interface Session {
    user: NonNullable<DefaultSession['user']> & {
      mercureRole: MercureWebRole | null;
    };
    refreshBoundary?: boolean;
    error?: 'RefreshTokenError';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    accessTokenExpiresAt?: number;
    refreshToken?: string;
    mercureRole?: MercureWebRole | null;
    refreshBoundary?: boolean;
    refreshError?: boolean;
  }
}

export type MercureBrowserSession = Session;
export type MercureSessionToken = JWT;
