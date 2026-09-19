import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesFrontendApiError,
  RulesIntelligenceDataAccess,
} from '@mercure/rules-frontend-data-access';
import {
  RulesUnavailableState,
  RulesUseCaseDetail,
  RulesUseCaseNotFoundState,
} from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';

const canonicalUseCaseId = /^uc_[a-z0-9_]+$/;

export interface RulesUseCaseDetailFeatureProps {
  readonly useCaseId: string;
}

export async function RulesUseCaseDetailFeature({
  useCaseId,
}: RulesUseCaseDetailFeatureProps) {
  if (!canonicalUseCaseId.test(useCaseId)) {
    return <RulesUseCaseNotFoundState />;
  }

  const api = new RulesIntelligenceDataAccess({
    fetch: authenticatedMercureFetch,
  });

  try {
    const useCase = await api.getUseCase(useCaseId);

    if (!useCase) {
      return <RulesUseCaseNotFoundState />;
    }

    return <RulesUseCaseDetail useCase={useCase} />;
  } catch (error) {
    if (error instanceof RulesFrontendApiError) {
      redirectRulesAuthorizationFailure(error);
      return <RulesUnavailableState />;
    }

    throw error;
  }
}
