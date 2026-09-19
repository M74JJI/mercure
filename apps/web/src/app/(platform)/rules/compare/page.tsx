import type { Metadata } from 'next';

import { RulesComparisonFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Compare Rules snapshots',
  description: 'Compare two immutable Mercure Rules snapshots.',
};

interface RulesComparisonPageProps {
  readonly searchParams: Promise<{
    readonly before?: string | readonly string[];
    readonly after?: string | readonly string[];
    readonly kind?: string | readonly string[];
  }>;
}

function first(value: string | readonly string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : value?.[0];
}

export default async function RulesComparisonPage({
  searchParams,
}: RulesComparisonPageProps) {
  const query = await searchParams;

  return (
    <RulesComparisonFeature
      beforeSnapshotId={first(query.before)}
      afterSnapshotId={first(query.after)}
      kind={first(query.kind)}
    />
  );
}
