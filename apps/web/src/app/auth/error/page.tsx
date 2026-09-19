import type { Metadata } from 'next';

import { IdentityAuthErrorFeature } from '@mercure/platform-frontend-identity-feature';

export const metadata: Metadata = {
  title: 'Authentication error',
};

export default function AuthenticationErrorPage() {
  return <IdentityAuthErrorFeature />;
}
