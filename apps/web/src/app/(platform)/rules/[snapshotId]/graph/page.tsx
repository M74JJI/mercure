import type { Metadata } from 'next';

import { RulesGraphFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rules semantic graph',
  description: 'Inspect bounded semantic relationships for an immutable Rules snapshot.',
};

interface RulesGraphPageProps {
  readonly params: Promise<{
    readonly snapshotId: string;
  }>;
  readonly searchParams: Promise<
    Readonly<Record<string, string | readonly string[] | undefined>>
  >;
}

export default async function RulesGraphRoute({
  params,
  searchParams,
}: RulesGraphPageProps) {
  const [{ snapshotId }, query] = await Promise.all([params, searchParams]);

  return <RulesGraphFeature snapshotId={snapshotId} searchParams={query} />;
}
