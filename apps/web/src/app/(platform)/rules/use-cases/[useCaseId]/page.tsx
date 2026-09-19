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
  readonly searchParams: Promise<
    Readonly<Record<string, string | readonly string[] | undefined>>
  >;
}

export default async function RulesUseCaseDetailPage({
  params,
  searchParams,
}: RulesUseCaseDetailPageProps) {
  const [{ useCaseId }, query] = await Promise.all([params, searchParams]);

  return <RulesUseCaseDetailFeature useCaseId={useCaseId} searchParams={query} />;
}
