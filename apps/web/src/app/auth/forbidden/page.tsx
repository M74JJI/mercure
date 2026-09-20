import type { Metadata } from 'next';

import { IdentityForbiddenFeature } from '@mercure/platform-frontend-identity-feature';

export const metadata: Metadata = {
  title: 'Access denied',
};

export default function ForbiddenPage() {
  return <IdentityForbiddenFeature />;
}
