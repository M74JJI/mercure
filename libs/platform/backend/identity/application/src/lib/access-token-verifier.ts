import type { MercurePrincipal } from '@mercure/platform-backend-identity-domain';

export const ACCESS_TOKEN_VERIFIER = Symbol('ACCESS_TOKEN_VERIFIER');

export interface AccessTokenVerifier {
  verify(token: string): Promise<MercurePrincipal>;
}
