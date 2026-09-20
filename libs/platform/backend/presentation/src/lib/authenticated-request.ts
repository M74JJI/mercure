import type { MercurePrincipal } from '@mercure/platform-backend-identity-domain';

export interface MercureAuthenticatedRequest {
  readonly headers: Readonly<{
    authorization?: string | readonly string[];
  }>;
  mercurePrincipal?: MercurePrincipal;
}
