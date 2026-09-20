export type MercureWebRole = 'admin' | 'user';

interface ParsedAccessToken {
  readonly expiresAtMs: number | null;
  readonly preferredUsername: string | null;
  readonly authorities: readonly string[];
}

function isObjectClaim(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function objectClaim(value: unknown): Readonly<Record<string, unknown>> | null {
  return isObjectClaim(value) ? value : null;
}

function stringArray(value: unknown): readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
}

function decodeJwtPayload(accessToken: string): Readonly<Record<string, unknown>> | null {
  const segments = accessToken.split('.');
  if (segments.length !== 3 || !segments[1]) return null;

  try {
    const decoded = Buffer.from(segments[1], 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(decoded);
    return objectClaim(parsed);
  } catch {
    return null;
  }
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function parseAccessToken(
  accessToken: string,
  clientId: string,
): ParsedAccessToken | null {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return null;

  const realmAccess = objectClaim(payload['realm_access']);
  const resourceAccess = objectClaim(payload['resource_access']);
  const clientAccess = objectClaim(resourceAccess?.[clientId]);

  const authorities = [
    ...stringArray(realmAccess?.['roles']),
    ...stringArray(clientAccess?.['roles']),
    ...stringArray(payload['groups']),
  ];

  const exp = payload['exp'];
  const preferredUsername = payload['preferred_username'];

  return {
    expiresAtMs:
      typeof exp === 'number' && Number.isFinite(exp) && exp > 0 ? exp * 1_000 : null,
    preferredUsername:
      typeof preferredUsername === 'string' && preferredUsername.trim()
        ? preferredUsername.trim()
        : null,
    authorities: [...new Set(authorities.map(normalize).filter(Boolean))],
  };
}

export function resolveWebRole(
  accessToken: string,
  clientId: string,
  adminAuthorities: readonly string[],
  userAuthorities: readonly string[],
): MercureWebRole | null {
  const parsed = parseAccessToken(accessToken, clientId);
  if (!parsed) return null;

  const observed = new Set(parsed.authorities);
  const admin = adminAuthorities.map(normalize);
  const user = userAuthorities.map(normalize);

  if (admin.some((authority) => observed.has(authority))) return 'admin';
  if (user.some((authority) => observed.has(authority))) return 'user';
  return null;
}
