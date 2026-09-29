import type { Metadata } from 'next';

import { PlatformDesignSystemFeature } from '@mercure/platform-frontend-shell';

export const metadata: Metadata = {
  title: 'Design system',
  description: 'Mercure component catalog, variants, API reference, and usage guidance.',
};

export default function DesignSystemPage() {
  return <PlatformDesignSystemFeature />;
}
