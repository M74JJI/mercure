import type { Metadata } from 'next';

import { RulesSnapshotFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rules snapshot',
};

interface RulesSnapshotPageProps {
  readonly params: Promise<{
    readonly snapshotId: string;
  }>;
}

export default async function RulesSnapshotPage({ params }: RulesSnapshotPageProps) {
  const { snapshotId } = await params;

  return <RulesSnapshotFeature snapshotId={snapshotId} />;
}
