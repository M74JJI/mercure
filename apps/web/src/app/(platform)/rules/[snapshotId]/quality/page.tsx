import type { Metadata } from 'next';

import { RulesQualityFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rules quality',
  description: 'Inspect deterministic quality scoring for an immutable Rules snapshot.',
};

interface RulesQualityPageProps {
  readonly params: Promise<{
    readonly snapshotId: string;
  }>;
  readonly searchParams: Promise<Readonly<Record<string, string | readonly string[] | undefined>>>;
}

export default async function RulesQualityRoute({ params, searchParams }: RulesQualityPageProps) {
  const [{ snapshotId }, query] = await Promise.all([params, searchParams]);

  return <RulesQualityFeature snapshotId={snapshotId} searchParams={query} />;
}
