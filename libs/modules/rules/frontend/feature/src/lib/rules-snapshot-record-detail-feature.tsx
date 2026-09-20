import {
  authenticatedMercureFetch,
  getServerMercureIdentity,
} from '@mercure/platform-frontend-identity-data-access/server';
import { RulesDataAccess, RulesFrontendApiError } from '@mercure/rules-frontend-data-access';
import {
  RulesSnapshotDecoderDetail,
  RulesSnapshotIssueDetail,
  RulesSnapshotRecordNotFoundState,
  RulesSnapshotRuleDetail,
  RulesUnavailableState,
} from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import { createRulesAuthoringDraftAction } from './rules-authoring-actions';

function recordPosition(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const position = Number(value);
  return Number.isSafeInteger(position) ? position : null;
}

function recordError(
  error: unknown,
  snapshotId: string,
  collection: 'rules' | 'decoders' | 'issues',
) {
  if (error instanceof RulesFrontendApiError) {
    if (error.status === 404) {
      return <RulesSnapshotRecordNotFoundState snapshotId={snapshotId} collection={collection} />;
    }
    redirectRulesAuthorizationFailure(error);
    return <RulesUnavailableState />;
  }
  throw error;
}

export async function RulesSnapshotRuleDetailFeature({
  position,
  snapshotId,
}: {
  readonly position: string;
  readonly snapshotId: string;
}) {
  const parsed = recordPosition(position);
  if (parsed === null)
    return <RulesSnapshotRecordNotFoundState snapshotId={snapshotId} collection="rules" />;
  const api = new RulesDataAccess({ fetch: authenticatedMercureFetch });
  try {
    const [rule, identity] = await Promise.all([
      api.getRule(snapshotId, parsed),
      getServerMercureIdentity(),
    ]);
    return rule ? (
      <RulesSnapshotRuleDetail
        snapshotId={snapshotId}
        rule={rule}
        {...(identity?.role === 'admin'
          ? { createDraftAction: createRulesAuthoringDraftAction }
          : {})}
      />
    ) : (
      <RulesSnapshotRecordNotFoundState snapshotId={snapshotId} collection="rules" />
    );
  } catch (error) {
    return recordError(error, snapshotId, 'rules');
  }
}

export async function RulesSnapshotDecoderDetailFeature({
  position,
  snapshotId,
}: {
  readonly position: string;
  readonly snapshotId: string;
}) {
  const parsed = recordPosition(position);
  if (parsed === null)
    return <RulesSnapshotRecordNotFoundState snapshotId={snapshotId} collection="decoders" />;
  const api = new RulesDataAccess({ fetch: authenticatedMercureFetch });
  try {
    const [decoder, identity] = await Promise.all([
      api.getDecoder(snapshotId, parsed),
      getServerMercureIdentity(),
    ]);
    return decoder ? (
      <RulesSnapshotDecoderDetail
        snapshotId={snapshotId}
        decoder={decoder}
        {...(identity?.role === 'admin'
          ? { createDraftAction: createRulesAuthoringDraftAction }
          : {})}
      />
    ) : (
      <RulesSnapshotRecordNotFoundState snapshotId={snapshotId} collection="decoders" />
    );
  } catch (error) {
    return recordError(error, snapshotId, 'decoders');
  }
}

export async function RulesSnapshotIssueDetailFeature({
  position,
  snapshotId,
}: {
  readonly position: string;
  readonly snapshotId: string;
}) {
  const parsed = recordPosition(position);
  if (parsed === null)
    return <RulesSnapshotRecordNotFoundState snapshotId={snapshotId} collection="issues" />;
  const api = new RulesDataAccess({ fetch: authenticatedMercureFetch });
  try {
    const issue = await api.getIssue(snapshotId, parsed);
    return issue ? (
      <RulesSnapshotIssueDetail snapshotId={snapshotId} issue={issue} />
    ) : (
      <RulesSnapshotRecordNotFoundState snapshotId={snapshotId} collection="issues" />
    );
  } catch (error) {
    return recordError(error, snapshotId, 'issues');
  }
}
