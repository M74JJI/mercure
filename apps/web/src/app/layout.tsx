import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@mercure/platform-frontend-shell/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Mercure',
    template: '%s | Mercure',
  },
  description: 'Mercure modular security engineering platform',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
