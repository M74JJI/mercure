import type { Metadata } from 'next';

import { RulesUseCaseEditFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Edit Rules use case',
  description: 'Edit a custom Mercure Rules use case.',
};

interface RulesUseCaseEditPageProps {
  readonly params: Promise<{
    readonly useCaseId: string;
  }>;
  readonly searchParams: Promise<
    Readonly<Record<string, string | readonly string[] | undefined>>
  >;
}

export default async function RulesUseCaseEditPage({
  params,
  searchParams,
}: RulesUseCaseEditPageProps) {
  const [{ useCaseId }, query] = await Promise.all([params, searchParams]);

  return <RulesUseCaseEditFeature useCaseId={useCaseId} searchParams={query} />;
}
