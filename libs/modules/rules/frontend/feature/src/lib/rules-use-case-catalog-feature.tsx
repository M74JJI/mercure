import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesFrontendApiError,
  RulesIntelligenceDataAccess,
} from '@mercure/rules-frontend-data-access';
import { RulesUnavailableState, RulesUseCaseCatalog } from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import {
  boundedIntegerSearchParam,
  enumSearchParam,
  rulesHref,
  trimmedSearchParam,
  type RulesSearchParams,
} from './rules-search-params';

const sourceValues = ['system', 'custom'] as const;
const PAGE_SIZE = 24;

export interface RulesUseCaseCatalogFeatureProps {
  readonly searchParams: RulesSearchParams;
}

export async function RulesUseCaseCatalogFeature({
  searchParams,
}: RulesUseCaseCatalogFeatureProps) {
  const api = new RulesIntelligenceDataAccess({
    fetch: authenticatedMercureFetch,
  });
  const offset = boundedIntegerSearchParam(searchParams, 'offset', 0, 0, 1_000_000);
  const selectedQuery = trimmedSearchParam(searchParams, 'q', 256);
  const selectedSource = enumSearchParam(searchParams, 'source', sourceValues);

  try {
    const useCases = await api.listUseCases({
      offset,
      limit: PAGE_SIZE,
      ...(selectedQuery === undefined ? {} : { query: selectedQuery }),
      ...(selectedSource === undefined ? {} : { source: selectedSource }),
    });
    const shared = {
      ...(selectedQuery === undefined ? {} : { q: selectedQuery }),
      ...(selectedSource === undefined ? {} : { source: selectedSource }),
    };
    const previousHref =
      offset > 0
        ? rulesHref('/rules/use-cases', {
            ...shared,
            offset: Math.max(0, offset - PAGE_SIZE),
          })
        : undefined;
    const nextHref =
      offset + useCases.items.length < useCases.total
        ? rulesHref('/rules/use-cases', {
            ...shared,
            offset: offset + PAGE_SIZE,
          })
        : undefined;

    return (
      <RulesUseCaseCatalog
        useCases={useCases.items}
        total={useCases.total}
        {...(selectedQuery === undefined ? {} : { selectedQuery })}
        {...(selectedSource === undefined ? {} : { selectedSource })}
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
