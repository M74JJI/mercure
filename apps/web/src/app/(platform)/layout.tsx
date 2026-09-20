import type { ReactNode } from 'react';

import { requireMercureIdentity } from '@mercure/platform-frontend-identity-feature';
import { PlatformShell } from '@mercure/platform-frontend-shell';

export default async function PlatformLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireMercureIdentity();

  return <PlatformShell>{children}</PlatformShell>;
}
