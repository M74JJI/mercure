import type { Metadata } from 'next';
import { RulesSnapshotDecoderDetailFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Rules snapshot decoder',
  description: 'Inspect one normalized decoder record in an immutable Mercure Rules snapshot.',
};

export default async function Page({
  params,
}: {
  readonly params: Promise<{ readonly snapshotId: string; readonly position: string }>;
}) {
  const { snapshotId, position } = await params;
  return <RulesSnapshotDecoderDetailFeature snapshotId={snapshotId} position={position} />;
}
