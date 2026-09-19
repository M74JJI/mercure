import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesDataAccess,
  RulesFrontendApiError,
} from '@mercure/rules-frontend-data-access';
import {
  RulesSnapshotNotFoundState,
  RulesSnapshotRulesExplorer,
  RulesUnavailableState,
} from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import {
  boundedIntegerSearchParam,
  enumSearchParam,
  rulesHref,
  trimmedSearchParam,
  type RulesSearchParams,
} from './rules-search-params';

const PAGE_SIZE = 50;
const severities = ['informational', 'low', 'medium', 'high', 'critical'] as const;
const jiraVisibility = ['true', 'false'] as const;

export interface RulesSnapshotRulesExplorerFeatureProps {
  readonly snapshotId: string;
  readonly searchParams: RulesSearchParams;
}

export async function RulesSnapshotRulesExplorerFeature({
  searchParams,
  snapshotId,
}: RulesSnapshotRulesExplorerFeatureProps) {
  const api = new RulesDataAccess({ fetch: authenticatedMercureFetch });
  const offset = boundedIntegerSearchParam(searchParams, 'offset', 0, 0, 1_000_000);
  const selectedTenant = trimmedSearchParam(searchParams, 'tenant', 255);
  const selectedSeverity = enumSearchParam(searchParams, 'severity', severities);
  const selectedStatus = trimmedSearchParam(searchParams, 'status', 64);
  const selectedUseCaseId = trimmedSearchParam(searchParams, 'useCaseId', 255);
  const selectedRuleId = trimmedSearchParam(searchParams, 'ruleId', 255);
  const selectedJiraVisible = enumSearchParam(
    searchParams,
    'jiraVisible',
    jiraVisibility,
  );

  try {
    const snapshot = await api.getSnapshot(snapshotId);
    if (!snapshot) {
      return <RulesSnapshotNotFoundState />;
    }

    const page = await api.listRules(snapshotId, {
      offset,
      limit: PAGE_SIZE,
      ...(selectedTenant === undefined ? {} : { tenant: selectedTenant }),
      ...(selectedSeverity === undefined ? {} : { severity: selectedSeverity }),
      ...(selectedStatus === undefined ? {} : { status: selectedStatus }),
      ...(selectedUseCaseId === undefined ? {} : { useCaseId: selectedUseCaseId }),
      ...(selectedRuleId === undefined ? {} : { ruleId: selectedRuleId }),
      ...(selectedJiraVisible === undefined
        ? {}
        : { jiraVisible: selectedJiraVisible }),
    });

    const shared = {
      ...(selectedTenant === undefined ? {} : { tenant: selectedTenant }),
      ...(selectedSeverity === undefined ? {} : { severity: selectedSeverity }),
      ...(selectedStatus === undefined ? {} : { status: selectedStatus }),
      ...(selectedUseCaseId === undefined ? {} : { useCaseId: selectedUseCaseId }),
      ...(selectedRuleId === undefined ? {} : { ruleId: selectedRuleId }),
      ...(selectedJiraVisible === undefined
        ? {}
        : { jiraVisible: selectedJiraVisible }),
    };
    const path = '/rules/' + snapshotId + '/rules';
    const previousHref =
      offset > 0
        ? rulesHref(path, {
            ...shared,
            offset: Math.max(0, offset - PAGE_SIZE),
          })
        : undefined;
    const nextHref =
      offset + page.items.length < page.total
        ? rulesHref(path, {
            ...shared,
            offset: offset + PAGE_SIZE,
          })
        : undefined;

    return (
      <RulesSnapshotRulesExplorer
        snapshotId={snapshotId}
        rules={page.items}
        total={page.total}
        {...(selectedTenant === undefined ? {} : { selectedTenant })}
        {...(selectedSeverity === undefined ? {} : { selectedSeverity })}
        {...(selectedStatus === undefined ? {} : { selectedStatus })}
        {...(selectedUseCaseId === undefined ? {} : { selectedUseCaseId })}
        {...(selectedRuleId === undefined ? {} : { selectedRuleId })}
        {...(selectedJiraVisible === undefined ? {} : { selectedJiraVisible })}
        {...(previousHref === undefined ? {} : { previousHref })}
        {...(nextHref === undefined ? {} : { nextHref })}
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
