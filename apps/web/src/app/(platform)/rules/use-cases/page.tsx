import type { Metadata } from 'next';

import { RulesUseCaseCatalogFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rules use cases',
  description: 'Inspect the read-only canonical Mercure Rules use-case catalog.',
};

export default function RulesUseCasesPage() {
  return <RulesUseCaseCatalogFeature />;
}
