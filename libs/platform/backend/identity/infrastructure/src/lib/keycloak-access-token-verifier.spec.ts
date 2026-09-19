import { createServer, type Server } from 'node:http';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

type JoseModule = typeof import('jose');

import { KeycloakAccessTokenVerifier } from './keycloak-access-token-verifier';

const issuer = 'https://identity.example.test/realms/mercure';
const audience = 'mercure-api';
const clientId = 'mercure-api';

let server: Server;
let SignJWT: JoseModule['SignJWT'];
let exportJWK: JoseModule['exportJWK'];
let generateKeyPair: JoseModule['generateKeyPair'];
let jwksUrl = '';
let signingKey: CryptoKey;
let alternateSigningKey: CryptoKey;
let jwksRequests = 0;

function verifier() {
  return new KeycloakAccessTokenVerifier({
    issuer,
    jwksUrl,
    audience,
    clientId,
    authorityMapping: {
      admin: ['admin', '/security-admins'],
      user: ['user', '/security-users'],
    },
    jwksTimeoutMs: 2_000,
    jwksCooldownMs: 60_000,
    jwksCacheMaxAgeMs: 60_000,
  });
}

async function token(
  claims: Record<string, unknown> = {},
  options: {
    readonly key?: CryptoKey;
    readonly kid?: string;
    readonly tokenIssuer?: string;
    readonly tokenAudience?: string;
    readonly expiresIn?: string;
  } = {},
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: options.kid ?? 'primary' })
    .setSubject('subject-1')
    .setIssuer(options.tokenIssuer ?? issuer)
    .setAudience(options.tokenAudience ?? audience)
    .setIssuedAt()
    .setExpirationTime(options.expiresIn ?? '5m')
    .sign(options.key ?? signingKey);
}

beforeAll(async () => {
  ({ SignJWT, exportJWK, generateKeyPair } = await import('jose'));

  const primary = await generateKeyPair('RS256', { extractable: true });
  const alternate = await generateKeyPair('RS256', { extractable: true });
  signingKey = primary.privateKey;
  alternateSigningKey = alternate.privateKey;

  const publicJwk = await exportJWK(primary.publicKey);
  const jwks = {
    keys: [
      {
        ...publicJwk,
        kid: 'primary',
        alg: 'RS256',
        use: 'sig',
      },
    ],
  };

  server = createServer((_request, response) => {
    jwksRequests += 1;
    response.statusCode = 200;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(jwks));
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('JWKS fixture did not expose a TCP port.');
  }

  jwksUrl = `http://127.0.0.1:${address.port}/jwks`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

beforeEach(() => {
  jwksRequests = 0;
});

describe('KeycloakAccessTokenVerifier', () => {
  it('verifies RS256 issuer/audience and maps realm, client, and group authorities', async () => {
    const accessToken = await token({
      preferred_username: 'analyst',
      realm_access: { roles: ['offline_access'] },
      resource_access: {
        [clientId]: { roles: ['user'] },
      },
      groups: ['/security-users'],
    });

    const principal = await verifier().verify(accessToken);

    expect(principal).toMatchObject({
      subject: 'subject-1',
      username: 'analyst',
      roles: ['user'],
      capabilities: ['platform:read', 'rules:read'],
    });
    expect(jwksRequests).toBe(1);
  });

  it.each([
    ['issuer', { tokenIssuer: 'https://identity.example.test/realms/other' }],
    ['audience', { tokenAudience: 'other-api' }],
    ['expiry', { expiresIn: '-1s' }],
  ] as const)('rejects an invalid %s', async (_name, invalid) => {
    const accessToken = await token(
      {
        realm_access: { roles: ['user'] },
      },
      invalid,
    );

    await expect(verifier().verify(accessToken)).rejects.toThrow('Access token is invalid.');
  });

  it('rejects tokens signed by an untrusted key and throttles unknown-kid JWKS refreshes', async () => {
    const accessToken = await token(
      {
        realm_access: { roles: ['user'] },
      },
      {
        key: alternateSigningKey,
        kid: 'unknown',
      },
    );
    const instance = verifier();

    await expect(instance.verify(accessToken)).rejects.toThrow('Access token is invalid.');
    await expect(instance.verify(accessToken)).rejects.toThrow('Access token is invalid.');

    expect(jwksRequests).toBe(1);
  });

  it('rejects structurally malformed role claims after cryptographic verification', async () => {
    const accessToken = await token({
      realm_access: { roles: 'user' },
    });

    await expect(verifier().verify(accessToken)).rejects.toThrow('Access token is invalid.');
  });

  it('preserves a valid but unmapped identity for deny-by-default authorization', async () => {
    const accessToken = await token({
      realm_access: { roles: ['offline_access'] },
      groups: ['/other'],
    });

    const principal = await verifier().verify(accessToken);

    expect(principal.roles).toEqual([]);
    expect(principal.capabilities).toEqual([]);
  });
});
