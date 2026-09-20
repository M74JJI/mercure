import type { Metadata } from 'next';
import { RulesSnapshotRuleDetailFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Rules snapshot rule',
  description: 'Inspect one normalized rule record in an immutable Mercure Rules snapshot.',
};

export default async function Page({ params }: { readonly params: Promise<{ readonly snapshotId: string; readonly position: string }> }) {
  const { snapshotId, position } = await params;
  return <RulesSnapshotRuleDetailFeature snapshotId={snapshotId} position={position} />;
}
