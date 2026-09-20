import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import { RulesDataAccess, RulesFrontendApiError } from '@mercure/rules-frontend-data-access';
import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import {
  RulesSnapshotDetail,
  RulesSnapshotNotFoundState,
  RulesUnavailableState,
} from '@mercure/rules-frontend-ui';

export interface RulesSnapshotFeatureProps {
  readonly snapshotId: string;
}

export async function RulesSnapshotFeature({ snapshotId }: RulesSnapshotFeatureProps) {
  const api = new RulesDataAccess({ fetch: authenticatedMercureFetch });

  try {
    const snapshot = await api.getSnapshot(snapshotId);

    if (!snapshot) {
      return <RulesSnapshotNotFoundState />;
    }

    const [rules, decoders, issues] = await Promise.all([
      api.listRules(snapshotId, { offset: 0, limit: 50 }),
      api.listDecoders(snapshotId, { offset: 0, limit: 30 }),
      api.listIssues(snapshotId, { offset: 0, limit: 30 }),
    ]);

    return (
      <RulesSnapshotDetail
        snapshot={snapshot}
        rules={rules.items}
        rulesTotal={rules.total}
        decoders={decoders.items}
        decodersTotal={decoders.total}
        issues={issues.items}
        issuesTotal={issues.total}
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
