import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesDataAccess,
  RulesFrontendApiError,
  RulesIntelligenceDataAccess,
} from '@mercure/rules-frontend-data-access';
import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import {
  RulesSnapshotDetail,
  RulesSnapshotIntelligence,
  RulesSnapshotNotFoundState,
  RulesUnavailableState,
} from '@mercure/rules-frontend-ui';

export interface RulesSnapshotFeatureProps {
  readonly snapshotId: string;
}

export async function RulesSnapshotFeature({ snapshotId }: RulesSnapshotFeatureProps) {
  const api = new RulesDataAccess({ fetch: authenticatedMercureFetch });
  const intelligenceApi = new RulesIntelligenceDataAccess({
    fetch: authenticatedMercureFetch,
  });

  try {
    const snapshot = await api.getSnapshot(snapshotId);

    if (!snapshot) {
      return <RulesSnapshotNotFoundState />;
    }

    const [rules, decoders, issues, fields, quality, graph, roundtrip] = await Promise.all([
      api.listRules(snapshotId, { offset: 0, limit: 50 }),
      api.listDecoders(snapshotId, { offset: 0, limit: 30 }),
      api.listIssues(snapshotId, { offset: 0, limit: 30 }),
      intelligenceApi.fieldIntelligence(snapshotId, { offset: 0, limit: 10 }),
      intelligenceApi.quality(snapshotId, { kind: 'rules', offset: 0, limit: 10 }),
      intelligenceApi.graph(snapshotId, { mode: 'all', limit: 120 }),
      intelligenceApi.roundtrip(snapshotId, { offset: 0, limit: 10 }),
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
        intelligence={
          <RulesSnapshotIntelligence
            fields={fields}
            quality={quality}
            graph={graph}
            roundtrip={roundtrip}
          />
        }
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
