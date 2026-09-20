import type { Metadata } from 'next';
import { RulesSnapshotIssueDetailFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Rules snapshot finding',
  description: 'Inspect one validation finding in an immutable Mercure Rules snapshot.',
};

export default async function Page({
  params,
}: {
  readonly params: Promise<{ readonly snapshotId: string; readonly position: string }>;
}) {
  const { snapshotId, position } = await params;
  return <RulesSnapshotIssueDetailFeature snapshotId={snapshotId} position={position} />;
}
