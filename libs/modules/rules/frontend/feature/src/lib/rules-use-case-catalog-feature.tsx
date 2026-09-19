import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesFrontendApiError,
  RulesIntelligenceDataAccess,
} from '@mercure/rules-frontend-data-access';
import { RulesUnavailableState, RulesUseCaseCatalog } from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';

export async function RulesUseCaseCatalogFeature() {
  const api = new RulesIntelligenceDataAccess({
    fetch: authenticatedMercureFetch,
  });

  try {
    const useCases = await api.listUseCases({ offset: 0, limit: 100 });

    return <RulesUseCaseCatalog useCases={useCases.items} total={useCases.total} />;
  } catch (error) {
    if (error instanceof RulesFrontendApiError) {
      redirectRulesAuthorizationFailure(error);
      return <RulesUnavailableState />;
    }

    throw error;
  }
}
