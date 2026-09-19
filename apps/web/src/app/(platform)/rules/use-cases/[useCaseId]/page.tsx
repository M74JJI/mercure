import type { Metadata } from 'next';

import { RulesUseCaseDetailFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rules use case',
  description: 'Inspect one canonical Mercure Rules use case.',
};

interface RulesUseCaseDetailPageProps {
  readonly params: Promise<{
    readonly useCaseId: string;
  }>;
}

export default async function RulesUseCaseDetailPage({
  params,
}: RulesUseCaseDetailPageProps) {
  const { useCaseId } = await params;

  return <RulesUseCaseDetailFeature useCaseId={useCaseId} />;
}
