import type { ReactNode } from 'react';

import { PlatformShell } from '@mercure/platform-frontend-shell';

export default function PlatformLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PlatformShell>{children}</PlatformShell>;
}
