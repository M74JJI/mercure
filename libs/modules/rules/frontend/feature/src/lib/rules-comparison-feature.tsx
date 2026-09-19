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
  readonly offset?: string;
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

const PAGE_SIZE = 50;

function comparisonOffset(value: string | undefined): number {
  if (value === undefined) return 0;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return 0;
  return Math.min(parsed, 1_000_000);
}

export async function RulesComparisonFeature({
  afterSnapshotId,
  beforeSnapshotId,
  kind,
  offset,
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
    const selectedOffset = comparisonOffset(offset);

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
      offset: selectedOffset,
      limit: PAGE_SIZE,
    });

    const previousHref =
      selectedOffset > 0
        ? '/rules/compare?' +
          new URLSearchParams({
            before: selectedBefore,
            after: selectedAfter,
            kind: selectedKind,
            offset: String(Math.max(0, selectedOffset - PAGE_SIZE)),
          }).toString()
        : undefined;
    const nextHref =
      selectedOffset + comparison.page.items.length < comparison.page.total
        ? '/rules/compare?' +
          new URLSearchParams({
            before: selectedBefore,
            after: selectedAfter,
            kind: selectedKind,
            offset: String(selectedOffset + PAGE_SIZE),
          }).toString()
        : undefined;

    return (
      <RulesSnapshotComparison
        snapshots={snapshots.items}
        comparison={comparison}
        selectedBefore={selectedBefore}
        selectedAfter={selectedAfter}
        selectedKind={selectedKind}
        {...(previousHref === undefined ? {} : { previousHref })}
        {...(nextHref === undefined ? {} : { nextHref })}
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
