import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesFrontendApiError,
  RulesIntelligenceDataAccess,
} from '@mercure/rules-frontend-data-access';
import { RulesDiagnosticsPage, RulesUnavailableState } from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import {
  boundedIntegerSearchParam,
  rulesHref,
  type RulesSearchParams,
} from './rules-search-params';

const PAGE_SIZE = 25;

export interface RulesDiagnosticsFeatureProps {
  readonly snapshotId: string;
  readonly searchParams: RulesSearchParams;
}

export async function RulesDiagnosticsFeature({
  searchParams,
  snapshotId,
}: RulesDiagnosticsFeatureProps) {
  const api = new RulesIntelligenceDataAccess({
    fetch: authenticatedMercureFetch,
  });
  const offset = boundedIntegerSearchParam(searchParams, 'offset', 0, 0, 1_000_000);

  try {
    const diagnostics = await api.roundtrip(snapshotId, {
      offset,
      limit: PAGE_SIZE,
    });
    const maxTotal = Math.max(
      diagnostics.sourceSections.total,
      diagnostics.commentedRules.total,
      diagnostics.groupFlows.total,
      diagnostics.missingUseCaseSuggestions.total,
    );
    const path = '/rules/' + snapshotId + '/diagnostics';
    const previousHref =
      offset > 0
        ? rulesHref(path, {
            offset: Math.max(0, offset - PAGE_SIZE),
          })
        : undefined;
    const nextHref =
      offset + PAGE_SIZE < maxTotal
        ? rulesHref(path, {
            offset: offset + PAGE_SIZE,
          })
        : undefined;

    return (
      <RulesDiagnosticsPage
        snapshotId={snapshotId}
        diagnostics={diagnostics}
        {...(previousHref === undefined ? {} : { previousHref })}
        {...(nextHref === undefined ? {} : { nextHref })}
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
