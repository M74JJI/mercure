import {
  parseAccessToken,
  resolveWebRole,
  type MercureWebRole,
} from './token-claims';
import type { WebIdentityEnvironment } from './environment';

export interface ProviderSessionState {
  readonly accessToken: string;
  readonly accessTokenExpiresAt: number;
  readonly refreshToken?: string;
  readonly mercureRole: MercureWebRole | null;
  readonly refreshBoundary: boolean;
  readonly refreshError: boolean;
}

export class ProviderTokenRefreshError extends Error {
  constructor() {
    super('OIDC access-token refresh failed.');
    this.name = 'ProviderTokenRefreshError';
  }
}

function expiryFromToken(accessToken: string, clientId: string): number | null {
  return parseAccessToken(accessToken, clientId)?.expiresAtMs ?? null;
}

export function initialProviderSession(
  accessToken: string,
  expiresAtSeconds: number | undefined,
  refreshToken: string | undefined,
  environment: WebIdentityEnvironment,
): ProviderSessionState {
  const expiresAt =
    typeof expiresAtSeconds === 'number' && Number.isFinite(expiresAtSeconds)
      ? expiresAtSeconds * 1_000
      : expiryFromToken(accessToken, environment.authorityClientId);

  if (!expiresAt) {
    throw new ProviderTokenRefreshError();
  }

  return {
    accessToken,
    accessTokenExpiresAt: expiresAt,
    ...(refreshToken?.trim() ? { refreshToken: refreshToken.trim() } : {}),
    mercureRole: resolveWebRole(
      accessToken,
      environment.authorityClientId,
      environment.adminAuthorities,
      environment.userAuthorities,
    ),
    refreshBoundary: false,
    refreshError: false,
  };
}

interface RefreshResponse {
  readonly accessToken: string;
  readonly expiresInSeconds: number;
  readonly refreshToken?: string;
}

function isObjectRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRefreshResponse(value: unknown): RefreshResponse {
  if (!isObjectRecord(value)) {
    throw new ProviderTokenRefreshError();
  }

  const response = value;
  const accessToken = response['access_token'];
  const expiresIn = response['expires_in'];
  const refreshToken = response['refresh_token'];

  if (
    typeof accessToken !== 'string' ||
    !accessToken.trim() ||
    typeof expiresIn !== 'number' ||
    !Number.isFinite(expiresIn) ||
    expiresIn <= 0 ||
    (refreshToken !== undefined && typeof refreshToken !== 'string')
  ) {
    throw new ProviderTokenRefreshError();
  }

  return {
    accessToken: accessToken.trim(),
    expiresInSeconds: expiresIn,
    ...(typeof refreshToken === 'string' && refreshToken.trim()
      ? { refreshToken: refreshToken.trim() }
      : {}),
  };
}

export async function refreshProviderSession(
  current: ProviderSessionState,
  environment: WebIdentityEnvironment,
  fetchImplementation: typeof fetch = fetch,
): Promise<ProviderSessionState> {
  if (!current.refreshToken) {
    throw new ProviderTokenRefreshError();
  }

  const tokenEndpoint = `${environment.issuer}/protocol/openid-connect/token`;
  let response: Response;

  try {
    response = await fetchImplementation(tokenEndpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: current.refreshToken,
        client_id: environment.clientId,
        client_secret: environment.clientSecret,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(environment.refreshTimeoutMs),
    });
  } catch {
    throw new ProviderTokenRefreshError();
  }

  if (!response.ok) {
    throw new ProviderTokenRefreshError();
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ProviderTokenRefreshError();
  }

  const refreshed = parseRefreshResponse(payload);

  return {
    accessToken: refreshed.accessToken,
    accessTokenExpiresAt: Date.now() + refreshed.expiresInSeconds * 1_000,
    refreshToken: refreshed.refreshToken ?? current.refreshToken,
    mercureRole: resolveWebRole(
      refreshed.accessToken,
      environment.authorityClientId,
      environment.adminAuthorities,
      environment.userAuthorities,
    ),
    refreshBoundary: true,
    refreshError: false,
  };
}

export function shouldRefreshProviderSession(
  current: ProviderSessionState,
  environment: WebIdentityEnvironment,
  now = Date.now(),
): boolean {
  return current.accessTokenExpiresAt <= now + environment.refreshSkewMs;
}
