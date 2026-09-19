import type { Metadata } from 'next';

import { RulesAuthoringDraftListFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Rules authoring drafts',
  description: 'Controlled Mercure Rules draft authoring.',
};

export default async function Page() {
  return <RulesAuthoringDraftListFeature />;
}
