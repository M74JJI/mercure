export class AuthenticatedMercureRequestError extends Error {
  constructor() {
    super('Authenticated Mercure server session is unavailable.');
    this.name = 'AuthenticatedMercureRequestError';
  }
}

export function withMercureAccessToken(
  request: Request,
  accessToken: string,
  accessTokenExpiresAt: number,
  now = Date.now(),
): Request {
  const normalizedToken = accessToken.trim();

  if (
    !normalizedToken ||
    !Number.isFinite(accessTokenExpiresAt) ||
    accessTokenExpiresAt <= now + 5_000
  ) {
    throw new AuthenticatedMercureRequestError();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('cookie');
  requestHeaders.set('authorization', `Bearer ${normalizedToken}`);

  return new Request(request, {
    headers: requestHeaders,
  });
}
