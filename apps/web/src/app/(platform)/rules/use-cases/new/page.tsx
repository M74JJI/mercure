import type { Metadata } from 'next';

import { RulesUseCaseCreateFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create Rules use case',
  description: 'Create a custom Mercure Rules use case.',
};

interface RulesUseCaseCreatePageProps {
  readonly searchParams: Promise<
    Readonly<Record<string, string | readonly string[] | undefined>>
  >;
}

export default async function RulesUseCaseCreatePage({
  searchParams,
}: RulesUseCaseCreatePageProps) {
  const query = await searchParams;

  return <RulesUseCaseCreateFeature searchParams={query} />;
}
