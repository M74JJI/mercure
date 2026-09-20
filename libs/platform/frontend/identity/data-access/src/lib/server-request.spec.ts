import { describe, expect, it } from 'vitest';

import {
  AuthenticatedMercureRequestError,
  withMercureAccessToken,
} from './server-request';

describe('server-to-server Mercure authentication', () => {
  it('injects the Keycloak bearer token while stripping browser cookies', () => {
    const request = new Request('https://api.mercure.test/api/v1/rules/snapshots', {
      headers: {
        authorization: 'Bearer stale-token',
        cookie: 'authjs.session-token=encrypted-browser-session',
        'x-request-id': 'request-1',
      },
    });

    const authorized = withMercureAccessToken(
      request,
      ' current-access-token ',
      1_100_000,
      1_000_000,
    );

    expect(authorized.headers.get('authorization')).toBe('Bearer current-access-token');
    expect(authorized.headers.has('cookie')).toBe(false);
    expect(authorized.headers.get('x-request-id')).toBe('request-1');
  });

  it('rejects empty and near-expiry tokens without including token material in the error', () => {
    expect(() =>
      withMercureAccessToken(
        new Request('https://api.mercure.test/api/v1/rules/snapshots'),
        'sensitive-token-value',
        1_004_999,
        1_000_000,
      ),
    ).toThrow(AuthenticatedMercureRequestError);

    const error = (() => {
      try {
        withMercureAccessToken(
          new Request('https://api.mercure.test/api/v1/rules/snapshots'),
          'sensitive-token-value',
          1_004_999,
          1_000_000,
        );
      } catch (failure) {
        return failure;
      }

      return null;
    })();

    expect(String(error)).not.toContain('sensitive-token-value');
  });
});
