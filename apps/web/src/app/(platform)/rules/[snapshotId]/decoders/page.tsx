import type { Metadata } from 'next';

import { RulesSnapshotDecodersExplorerFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rules snapshot decoders',
  description: 'Explore normalized decoders in one immutable Mercure Rules snapshot.',
};

interface PageProps {
  readonly params: Promise<{
    readonly snapshotId: string;
  }>;
  readonly searchParams: Promise<
    Readonly<Record<string, string | readonly string[] | undefined>>
  >;
}

export default async function Page({ params, searchParams }: PageProps) {
  const [{ snapshotId }, query] = await Promise.all([params, searchParams]);

  return <RulesSnapshotDecodersExplorerFeature snapshotId={snapshotId} searchParams={query} />;
}
