import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesDataAccess,
  RulesFrontendApiError,
  RulesIntelligenceDataAccess,
  type RulesSnapshotComparisonQuery,
} from '@mercure/rules-frontend-data-access';
import { RulesSnapshotComparison, RulesUnavailableState } from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import {
  COMPARISON_SNAPSHOT_PAGE_SIZE,
  comparisonSnapshotOffset,
  loadComparisonSnapshotSelection,
} from './rules-comparison-selection';

type ComparisonKind = NonNullable<RulesSnapshotComparisonQuery['kind']>;

export interface RulesComparisonFeatureProps {
  readonly beforeSnapshotId?: string;
  readonly afterSnapshotId?: string;
  readonly kind?: string;
  readonly offset?: string;
  readonly snapshotOffset?: string;
}

function comparisonKind(value: string | undefined): ComparisonKind {
  if (value === 'decoders' || value === 'files' || value === 'use_cases' || value === 'issues') {
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
  snapshotOffset,
}: RulesComparisonFeatureProps) {
  const api = new RulesDataAccess({ fetch: authenticatedMercureFetch });
  const intelligenceApi = new RulesIntelligenceDataAccess({
    fetch: authenticatedMercureFetch,
  });

  try {
    const selectedKind = comparisonKind(kind);
    const selectedOffset = comparisonOffset(offset);
    const selectedSnapshotOffset = comparisonSnapshotOffset(snapshotOffset);
    const selection = await loadComparisonSnapshotSelection(
      api,
      selectedSnapshotOffset,
      beforeSnapshotId,
      afterSnapshotId,
    );
    const selectedAfter = selection.selectedAfter;
    const selectedBefore = selection.selectedBefore;
    const effectiveSnapshotOffset = selection.page.offset;

    if (!selectedAfter || !selectedBefore) {
      return <RulesSnapshotComparison snapshots={selection.options} selectedKind={selectedKind} />;
    }

    const comparison = await intelligenceApi.compare({
      beforeSnapshotId: selectedBefore,
      afterSnapshotId: selectedAfter,
      kind: selectedKind,
      offset: selectedOffset,
      limit: PAGE_SIZE,
    });

    const snapshotHref = (snapshotPageOffset: number) =>
      '/rules/compare?' +
      new URLSearchParams({
        before: selectedBefore,
        after: selectedAfter,
        kind: selectedKind,
        snapshotOffset: String(snapshotPageOffset),
      }).toString();
    const snapshotPreviousHref =
      effectiveSnapshotOffset > 0
        ? snapshotHref(Math.max(0, effectiveSnapshotOffset - COMPARISON_SNAPSHOT_PAGE_SIZE))
        : undefined;
    const snapshotNextHref =
      effectiveSnapshotOffset + selection.page.items.length < selection.page.total
        ? snapshotHref(effectiveSnapshotOffset + COMPARISON_SNAPSHOT_PAGE_SIZE)
        : undefined;

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
        snapshots={selection.options}
        comparison={comparison}
        selectedBefore={selectedBefore}
        selectedAfter={selectedAfter}
        selectedKind={selectedKind}
        snapshotPage={{
          offset: effectiveSnapshotOffset,
          shown: selection.page.items.length,
          total: selection.page.total,
        }}
        {...(snapshotPreviousHref === undefined ? {} : { snapshotPreviousHref })}
        {...(snapshotNextHref === undefined ? {} : { snapshotNextHref })}
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
