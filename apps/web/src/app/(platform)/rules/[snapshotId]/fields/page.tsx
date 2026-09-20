import type { Metadata } from 'next';

import { RulesFieldIntelligenceFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rules field intelligence',
  description: 'Inspect bounded field lineage and health for an immutable Rules snapshot.',
};

interface RulesFieldIntelligencePageProps {
  readonly params: Promise<{
    readonly snapshotId: string;
  }>;
  readonly searchParams: Promise<Readonly<Record<string, string | readonly string[] | undefined>>>;
}

export default async function RulesFieldIntelligenceRoute({
  params,
  searchParams,
}: RulesFieldIntelligencePageProps) {
  const [{ snapshotId }, query] = await Promise.all([params, searchParams]);

  return <RulesFieldIntelligenceFeature snapshotId={snapshotId} searchParams={query} />;
}
