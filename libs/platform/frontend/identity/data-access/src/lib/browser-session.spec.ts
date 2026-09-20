import { describe, expect, it } from 'vitest';

import { browserFacingSession } from './browser-session';
import type { MercureBrowserSession, MercureSessionToken } from './auth-types';

describe('browser-facing identity session', () => {
  it('exposes role-aware user metadata without bearer or refresh tokens', () => {
    const session: MercureBrowserSession & {
      readonly accessToken: string;
      readonly refreshToken: string;
    } = {
      user: {
        name: 'Analyst',
        email: 'analyst@example.test',
        mercureRole: null,
      },
      expires: '2030-01-01T00:00:00.000Z',
      accessToken: 'must-never-reach-browser',
      refreshToken: 'must-never-reach-browser',
    };
    const token: MercureSessionToken = {
      accessToken: 'server-access-token',
      accessTokenExpiresAt: 2_000_000_000_000,
      refreshToken: 'server-refresh-token',
      mercureRole: 'user',
      refreshBoundary: false,
      refreshError: false,
    };

    const browserSession = browserFacingSession(session, token);

    expect(browserSession).toEqual({
      user: {
        name: 'Analyst',
        email: 'analyst@example.test',
        mercureRole: 'user',
      },
      expires: '2030-01-01T00:00:00.000Z',
      refreshBoundary: false,
    });
    expect(browserSession).not.toHaveProperty('accessToken');
    expect(browserSession).not.toHaveProperty('refreshToken');
    expect(JSON.stringify(browserSession)).not.toContain('server-access-token');
    expect(JSON.stringify(browserSession)).not.toContain('server-refresh-token');
  });

  it('surfaces only a stable refresh failure code', () => {
    const browserSession = browserFacingSession(
      {
        user: {
          mercureRole: null,
        },
        expires: '2030-01-01T00:00:00.000Z',
      },
      {
        refreshError: true,
        mercureRole: null,
      },
    );

    expect(browserSession.error).toBe('RefreshTokenError');
  });
});
