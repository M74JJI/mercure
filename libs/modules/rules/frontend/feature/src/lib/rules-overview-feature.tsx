import {
  authenticatedMercureFetch,
  getServerMercureIdentity,
} from '@mercure/platform-frontend-identity-data-access/server';
import { RulesDataAccess, RulesFrontendApiError } from '@mercure/rules-frontend-data-access';
import { RulesSnapshotHistory, RulesUnavailableState } from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import { importRulesSnapshotAction } from './rules-snapshot-import-action';
import {
  enumSearchParam,
  type RulesSearchParams,
} from './rules-search-params';

const importStatuses = ['unavailable', 'failed'] as const;

export interface RulesOverviewFeatureProps {
  readonly searchParams: RulesSearchParams;
}

export async function RulesOverviewFeature({
  searchParams,
}: RulesOverviewFeatureProps) {
  const api = new RulesDataAccess({ fetch: authenticatedMercureFetch });
  const identity = await getServerMercureIdentity();
  const canImport = identity?.role === 'admin';
  const importStatus = enumSearchParam(searchParams, 'import', importStatuses);

  try {
    const snapshots = await api.listSnapshots({ offset: 0, limit: 25 });

    return (
      <RulesSnapshotHistory
        snapshots={snapshots.items}
        total={snapshots.total}
        canImport={canImport}
        {...(canImport ? { importAction: importRulesSnapshotAction } : {})}
        {...(importStatus === undefined ? {} : { importStatus })}
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
