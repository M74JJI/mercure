import type { Metadata } from 'next';

import { RulesOverviewFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rules',
  description: 'Inspect immutable Mercure Rules configuration snapshots.',
};

export default function RulesPage() {
  return <RulesOverviewFeature />;
}
