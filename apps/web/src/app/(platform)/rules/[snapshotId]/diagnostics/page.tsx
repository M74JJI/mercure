import type { Metadata } from 'next';

import { RulesDiagnosticsFeature } from '@mercure/rules-frontend-feature';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rules diagnostics',
  description: 'Inspect safe round-trip diagnostics for an immutable Rules snapshot.',
};

interface RulesDiagnosticsPageProps {
  readonly params: Promise<{
    readonly snapshotId: string;
  }>;
  readonly searchParams: Promise<
    Readonly<Record<string, string | readonly string[] | undefined>>
  >;
}

export default async function RulesDiagnosticsRoute({
  params,
  searchParams,
}: RulesDiagnosticsPageProps) {
  const [{ snapshotId }, query] = await Promise.all([params, searchParams]);

  return <RulesDiagnosticsFeature snapshotId={snapshotId} searchParams={query} />;
}
