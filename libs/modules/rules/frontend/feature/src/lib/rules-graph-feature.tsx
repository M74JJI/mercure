import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesFrontendApiError,
  RulesIntelligenceDataAccess,
} from '@mercure/rules-frontend-data-access';
import { RulesGraphPage, RulesUnavailableState } from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import {
  enumSearchParam,
  trimmedSearchParam,
  type RulesSearchParams,
} from './rules-search-params';

const modeValues = [
  'all',
  'rules',
  'decoders',
  'decoder_rules',
  'fields',
  'use_cases',
  'mitre',
] as const;
const jiraOnlyValues = ['true'] as const;
const booleanValues = ['true', 'false'] as const;
const limitValues = ['100', '200', '300', '500'] as const;

export interface RulesGraphFeatureProps {
  readonly snapshotId: string;
  readonly searchParams: RulesSearchParams;
}

export async function RulesGraphFeature({
  searchParams,
  snapshotId,
}: RulesGraphFeatureProps) {
  const api = new RulesIntelligenceDataAccess({
    fetch: authenticatedMercureFetch,
  });

  const selectedMode = enumSearchParam(searchParams, 'mode', modeValues) ?? 'all';
  const selectedQuery = trimmedSearchParam(searchParams, 'q', 256);
  const selectedTenant = trimmedSearchParam(searchParams, 'tenant', 255);
  const selectedUseCaseId = trimmedSearchParam(searchParams, 'useCaseId', 255);
  const selectedStatus = trimmedSearchParam(searchParams, 'status', 64);
  const selectedRole = trimmedSearchParam(searchParams, 'role', 64);
  const selectedJiraOnly = enumSearchParam(searchParams, 'jiraOnly', jiraOnlyValues);
  const selectedIncludeExternal = enumSearchParam(
    searchParams,
    'includeExternal',
    booleanValues,
  );
  const selectedLimit = Number(
    enumSearchParam(searchParams, 'limit', limitValues) ?? '200',
  );

  const query = {
    mode: selectedMode,
    limit: selectedLimit,
    ...(selectedQuery === undefined ? {} : { query: selectedQuery }),
    ...(selectedTenant === undefined ? {} : { tenant: selectedTenant }),
    ...(selectedUseCaseId === undefined ? {} : { useCaseId: selectedUseCaseId }),
    ...(selectedStatus === undefined ? {} : { status: selectedStatus }),
    ...(selectedRole === undefined ? {} : { role: selectedRole }),
    ...(selectedJiraOnly === undefined ? {} : { jiraOnly: selectedJiraOnly }),
    ...(selectedIncludeExternal === undefined
      ? {}
      : { includeExternal: selectedIncludeExternal }),
  };

  try {
    const graph = await api.graph(snapshotId, query);

    return (
      <RulesGraphPage
        snapshotId={snapshotId}
        graph={graph}
        selectedMode={selectedMode}
        selectedLimit={selectedLimit}
        {...(selectedQuery === undefined ? {} : { selectedQuery })}
        {...(selectedTenant === undefined ? {} : { selectedTenant })}
        {...(selectedUseCaseId === undefined ? {} : { selectedUseCaseId })}
        {...(selectedStatus === undefined ? {} : { selectedStatus })}
        {...(selectedRole === undefined ? {} : { selectedRole })}
        {...(selectedJiraOnly === undefined ? {} : { selectedJiraOnly })}
        {...(selectedIncludeExternal === undefined
          ? {}
          : { selectedIncludeExternal })}
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
