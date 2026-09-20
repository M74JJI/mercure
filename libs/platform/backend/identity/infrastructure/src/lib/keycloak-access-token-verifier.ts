import type { AccessTokenVerifier } from '@mercure/platform-backend-identity-application';
import {
  resolveMercurePrincipal,
  type AuthorityRoleMapping,
  type ExternalIdentity,
  type MercurePrincipal,
} from '@mercure/platform-backend-identity-domain';

type JoseJwtPayload = import('jose').JWTPayload;
type RemoteJwkSet = ReturnType<(typeof import('jose'))['createRemoteJWKSet']>;

export interface KeycloakAccessTokenVerifierOptions {
  readonly issuer: string;
  readonly jwksUrl: string;
  readonly audience: string;
  readonly clientId: string;
  readonly authorityMapping: AuthorityRoleMapping;
  readonly jwksTimeoutMs: number;
  readonly jwksCooldownMs: number;
  readonly jwksCacheMaxAgeMs: number;
}

export class InvalidAccessTokenError extends Error {
  constructor() {
    super('Access token is invalid.');
    this.name = 'InvalidAccessTokenError';
  }
}

function stringArray(value: unknown): readonly string[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new InvalidAccessTokenError();
  }

  return value;
}

function isObjectClaim(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function objectClaim(value: unknown): Readonly<Record<string, unknown>> | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isObjectClaim(value)) {
    throw new InvalidAccessTokenError();
  }

  return value;
}

function identityFromPayload(payload: JoseJwtPayload, clientId: string): ExternalIdentity {
  if (typeof payload.sub !== 'string' || payload.sub.trim() === '') {
    throw new InvalidAccessTokenError();
  }

  const realmAccess = objectClaim(payload['realm_access']);
  const resourceAccess = objectClaim(payload['resource_access']);
  const clientAccess = objectClaim(resourceAccess?.[clientId]);

  const username = payload['preferred_username'];
  if (username !== undefined && typeof username !== 'string') {
    throw new InvalidAccessTokenError();
  }

  return {
    subject: payload.sub,
    realmRoles: stringArray(realmAccess?.['roles']),
    clientRoles: stringArray(clientAccess?.['roles']),
    groups: stringArray(payload['groups']),
    ...(typeof username === 'string' ? { username } : {}),
  };
}

export class KeycloakAccessTokenVerifier implements AccessTokenVerifier {
  private readonly verificationKey: Promise<RemoteJwkSet>;

  constructor(private readonly options: KeycloakAccessTokenVerifierOptions) {
    this.verificationKey = import('jose').then(({ createRemoteJWKSet }) =>
      createRemoteJWKSet(new URL(options.jwksUrl), {
        timeoutDuration: options.jwksTimeoutMs,
        cooldownDuration: options.jwksCooldownMs,
        cacheMaxAge: options.jwksCacheMaxAgeMs,
      }),
    );
  }

  async verify(token: string): Promise<MercurePrincipal> {
    try {
      const { jwtVerify } = await import('jose');
      const verificationKey = await this.verificationKey;
      const verified = await jwtVerify(token, verificationKey, {
        issuer: this.options.issuer,
        audience: this.options.audience,
        algorithms: ['RS256'],
      });

      return resolveMercurePrincipal(
        identityFromPayload(verified.payload, this.options.clientId),
        this.options.authorityMapping,
      );
    } catch (error) {
      if (error instanceof InvalidAccessTokenError) {
        throw error;
      }

      throw new InvalidAccessTokenError();
    }
  }
}
