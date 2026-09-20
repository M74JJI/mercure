import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import { RulesDataAccess, RulesFrontendApiError } from '@mercure/rules-frontend-data-access';
import {
  RulesSnapshotIssuesExplorer,
  RulesSnapshotNotFoundState,
  RulesUnavailableState,
} from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import {
  SNAPSHOT_EXPLORER_PAGE_SIZE,
  snapshotExplorerPagination,
} from './rules-snapshot-explorer-pagination';
import {
  boundedIntegerSearchParam,
  enumSearchParam,
  trimmedSearchParam,
  type RulesSearchParams,
} from './rules-search-params';

const severities = ['error', 'warning', 'info'] as const;

export interface RulesSnapshotIssuesExplorerFeatureProps {
  readonly snapshotId: string;
  readonly searchParams: RulesSearchParams;
}

export async function RulesSnapshotIssuesExplorerFeature({
  searchParams,
  snapshotId,
}: RulesSnapshotIssuesExplorerFeatureProps) {
  const api = new RulesDataAccess({ fetch: authenticatedMercureFetch });
  const offset = boundedIntegerSearchParam(searchParams, 'offset', 0, 0, 1_000_000);
  const selectedSeverity = enumSearchParam(searchParams, 'severity', severities);
  const selectedType = trimmedSearchParam(searchParams, 'type', 128);

  try {
    const snapshot = await api.getSnapshot(snapshotId);
    if (!snapshot) {
      return <RulesSnapshotNotFoundState />;
    }

    const page = await api.listIssues(snapshotId, {
      offset,
      limit: SNAPSHOT_EXPLORER_PAGE_SIZE,
      ...(selectedSeverity === undefined ? {} : { severity: selectedSeverity }),
      ...(selectedType === undefined ? {} : { type: selectedType }),
    });

    const pagination = snapshotExplorerPagination(
      '/rules/' + snapshotId + '/issues',
      offset,
      page.total,
      {
        ...(selectedSeverity === undefined ? {} : { severity: selectedSeverity }),
        ...(selectedType === undefined ? {} : { type: selectedType }),
      },
    );

    return (
      <RulesSnapshotIssuesExplorer
        snapshotId={snapshotId}
        issues={page.items}
        total={page.total}
        {...(selectedSeverity === undefined ? {} : { selectedSeverity })}
        {...(selectedType === undefined ? {} : { selectedType })}
        {...pagination}
      />
    );
  } catch (error) {
    if (error instanceof RulesFrontendApiError) {
      if (error.status === 404) {
        return <RulesSnapshotNotFoundState />;
      }

      redirectRulesAuthorizationFailure(error);
      return <RulesUnavailableState />;
    }

    throw error;
  }
}
