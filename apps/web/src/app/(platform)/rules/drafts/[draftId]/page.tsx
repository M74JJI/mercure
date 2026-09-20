import type { Metadata } from 'next';

import { RulesAuthoringDraftDetailFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Rules authoring draft',
  description: 'Edit, validate and approve a Mercure Rules authoring draft.',
};

export default async function Page({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly draftId: string }>;
  readonly searchParams: Promise<Readonly<Record<string, string | readonly string[] | undefined>>>;
}) {
  const [{ draftId }, query] = await Promise.all([params, searchParams]);
  return <RulesAuthoringDraftDetailFeature draftId={draftId} searchParams={query} />;
}
