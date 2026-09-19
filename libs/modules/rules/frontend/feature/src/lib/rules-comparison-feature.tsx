import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesDataAccess,
  RulesFrontendApiError,
  RulesIntelligenceDataAccess,
  type RulesSnapshotComparisonQuery,
} from '@mercure/rules-frontend-data-access';
import {
  RulesSnapshotComparison,
  RulesUnavailableState,
} from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';

type ComparisonKind = NonNullable<RulesSnapshotComparisonQuery['kind']>;

export interface RulesComparisonFeatureProps {
  readonly beforeSnapshotId?: string;
  readonly afterSnapshotId?: string;
  readonly kind?: string;
}

function comparisonKind(value: string | undefined): ComparisonKind {
  if (
    value === 'decoders' ||
    value === 'files' ||
    value === 'use_cases' ||
    value === 'issues'
  ) {
    return value;
  }

  return 'rules';
}

export async function RulesComparisonFeature({
  afterSnapshotId,
  beforeSnapshotId,
  kind,
}: RulesComparisonFeatureProps) {
  const api = new RulesDataAccess({ fetch: authenticatedMercureFetch });
  const intelligenceApi = new RulesIntelligenceDataAccess({
    fetch: authenticatedMercureFetch,
  });

  try {
    const snapshots = await api.listSnapshots({ offset: 0, limit: 25 });
    const knownIds = new Set(snapshots.items.map((snapshot) => snapshot.id));
    const latest = snapshots.items[0];
    const previous = snapshots.items[1];
    const selectedKind = comparisonKind(kind);

    if (!latest || !previous) {
      return (
        <RulesSnapshotComparison
          snapshots={snapshots.items}
          selectedKind={selectedKind}
        />
      );
    }

    let selectedAfter =
      afterSnapshotId && knownIds.has(afterSnapshotId) ? afterSnapshotId : latest.id;
    let selectedBefore =
      beforeSnapshotId && knownIds.has(beforeSnapshotId) ? beforeSnapshotId : previous.id;

    if (selectedBefore === selectedAfter) {
      selectedBefore =
        snapshots.items.find((snapshot) => snapshot.id !== selectedAfter)?.id ?? previous.id;
      selectedAfter =
        snapshots.items.find((snapshot) => snapshot.id !== selectedBefore)?.id ?? latest.id;
    }

    const comparison = await intelligenceApi.compare({
      beforeSnapshotId: selectedBefore,
      afterSnapshotId: selectedAfter,
      kind: selectedKind,
      offset: 0,
      limit: 50,
    });

    return (
      <RulesSnapshotComparison
        snapshots={snapshots.items}
        comparison={comparison}
        selectedBefore={selectedBefore}
        selectedAfter={selectedAfter}
        selectedKind={selectedKind}
      />
    );
  } catch (error) {
    if (error instanceof RulesFrontendApiError) {
      redirectRulesAuthorizationFailure(error);
      return <RulesUnavailableState />;
    }

    throw error;
  }
}
