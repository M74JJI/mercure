import type { Metadata } from 'next';

import { RulesOverviewFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rules',
  description: 'Inspect immutable Mercure Rules configuration snapshots.',
};

interface RulesPageProps {
  readonly searchParams: Promise<Readonly<Record<string, string | readonly string[] | undefined>>>;
}

export default async function RulesPage({ searchParams }: RulesPageProps) {
  const query = await searchParams;

  return <RulesOverviewFeature searchParams={query} />;
}
