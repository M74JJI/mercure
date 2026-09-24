import type { ReactNode } from 'react';

import {
  IdentitySignOutButton,
  requireMercureIdentity,
} from '@mercure/platform-frontend-identity-feature';
import { PlatformShell } from '@mercure/platform-frontend-shell';

export default async function PlatformLayout({ children }: Readonly<{ children: ReactNode }>) {
  const identity = await requireMercureIdentity();

  return (
    <PlatformShell
      identity={{ displayName: identity.displayName, role: identity.role }}
      accountAction={<IdentitySignOutButton compact />}
    >
      {children}
    </PlatformShell>
  );
}
