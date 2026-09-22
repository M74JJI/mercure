import type { Metadata } from 'next';
import { connection } from 'next/server';
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

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  // Request-scoped CSP nonces require request-time rendering so Next.js can attach the nonce.
  await connection();

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
