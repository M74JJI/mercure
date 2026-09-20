import type { Metadata } from 'next';

import { RulesUseCaseCatalogFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rules use cases',
  description: 'Inspect the read-only canonical Mercure Rules use-case catalog.',
};

interface RulesUseCasesPageProps {
  readonly searchParams: Promise<Readonly<Record<string, string | readonly string[] | undefined>>>;
}

export default async function RulesUseCasesPage({ searchParams }: RulesUseCasesPageProps) {
  const query = await searchParams;

  return <RulesUseCaseCatalogFeature searchParams={query} />;
}
