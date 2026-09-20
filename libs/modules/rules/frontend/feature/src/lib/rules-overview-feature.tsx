import {
  authenticatedMercureFetch,
  getServerMercureIdentity,
} from '@mercure/platform-frontend-identity-data-access/server';
import { RulesDataAccess, RulesFrontendApiError } from '@mercure/rules-frontend-data-access';
import { RulesSnapshotHistory, RulesUnavailableState } from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import { importRulesSnapshotAction } from './rules-snapshot-import-action';
import {
  boundedIntegerSearchParam,
  enumSearchParam,
  type RulesSearchParams,
} from './rules-search-params';
import { snapshotExplorerPagination } from './rules-snapshot-explorer-pagination';

const importStatuses = ['unavailable', 'failed'] as const;
const HISTORY_PAGE_SIZE = 25;

export interface RulesOverviewFeatureProps {
  readonly searchParams: RulesSearchParams;
}

export async function RulesOverviewFeature({ searchParams }: RulesOverviewFeatureProps) {
  const api = new RulesDataAccess({ fetch: authenticatedMercureFetch });
  const identity = await getServerMercureIdentity();
  const canImport = identity?.role === 'admin';
  const importStatus = enumSearchParam(searchParams, 'import', importStatuses);
  const offset = boundedIntegerSearchParam(searchParams, 'offset', 0, 0, 1_000_000);

  try {
    const snapshots = await api.listSnapshots({
      offset,
      limit: HISTORY_PAGE_SIZE,
    });
    const pagination = snapshotExplorerPagination(
      '/rules',
      offset,
      snapshots.total,
      {},
      HISTORY_PAGE_SIZE,
    );

    return (
      <RulesSnapshotHistory
        snapshots={snapshots.items}
        total={snapshots.total}
        canAuthor={canImport}
        canImport={canImport}
        {...(canImport ? { importAction: importRulesSnapshotAction } : {})}
        {...(importStatus === undefined ? {} : { importStatus })}
        {...pagination}
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
