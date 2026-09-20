import type { Metadata } from 'next';

import { RulesSnapshotRulesExplorerFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rules snapshot rules',
  description: 'Explore normalized rules in one immutable Mercure Rules snapshot.',
};

interface PageProps {
  readonly params: Promise<{
    readonly snapshotId: string;
  }>;
  readonly searchParams: Promise<Readonly<Record<string, string | readonly string[] | undefined>>>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const [{ snapshotId }, query] = await Promise.all([params, searchParams]);

  return <RulesSnapshotRulesExplorerFeature snapshotId={snapshotId} searchParams={query} />;
}
