import { RulesDataAccess, RulesFrontendApiError } from '@mercure/rules-frontend-data-access';
import { RulesSnapshotHistory, RulesUnavailableState } from '@mercure/rules-frontend-ui';

export async function RulesOverviewFeature() {
  const api = new RulesDataAccess();

  try {
    const snapshots = await api.listSnapshots({ offset: 0, limit: 25 });

    return <RulesSnapshotHistory snapshots={snapshots.items} total={snapshots.total} />;
  } catch (error) {
    if (error instanceof RulesFrontendApiError) {
      return <RulesUnavailableState />;
    }

    throw error;
  }
}
