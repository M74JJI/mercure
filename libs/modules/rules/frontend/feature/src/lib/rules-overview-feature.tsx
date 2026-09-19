import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import { RulesDataAccess, RulesFrontendApiError } from '@mercure/rules-frontend-data-access';
import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import { RulesSnapshotHistory, RulesUnavailableState } from '@mercure/rules-frontend-ui';

export async function RulesOverviewFeature() {
  const api = new RulesDataAccess({ fetch: authenticatedMercureFetch });

  try {
    const snapshots = await api.listSnapshots({ offset: 0, limit: 25 });

    return <RulesSnapshotHistory snapshots={snapshots.items} total={snapshots.total} />;
  } catch (error) {
    if (error instanceof RulesFrontendApiError) {
      redirectRulesAuthorizationFailure(error);
      return <RulesUnavailableState />;
    }

    throw error;
  }
}
