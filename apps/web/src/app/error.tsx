'use client';

import { PlatformErrorFeature } from '@mercure/platform-frontend-shell';

export default function GlobalError({ reset }: Readonly<{ reset: () => void }>) {
  return <PlatformErrorFeature reset={reset} />;
}
