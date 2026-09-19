import {
  authenticatedMercureFetch,
  getServerMercureIdentity,
} from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesFrontendApiError,
  RulesIntelligenceDataAccess,
} from '@mercure/rules-frontend-data-access';
import {
  RulesUnavailableState,
  RulesUseCaseDetail,
  RulesUseCaseNotFoundState,
  type RulesUseCaseAdminErrorCode,
  type RulesUseCaseAdminField,
} from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import { deleteRulesUseCaseAction } from './rules-use-case-administration-actions';
import {
  enumSearchParam,
  type RulesSearchParams,
} from './rules-search-params';

const canonicalUseCaseId = /^uc_[a-z0-9_]+$/;

const errorCodes = [
  'validation',
  'conflict',
  'not-found',
  'unavailable',
  'protected',
  'confirmation',
] as const satisfies readonly RulesUseCaseAdminErrorCode[];

const errorFields = [
  'id',
  'name',
  'shortName',
  'description',
  'component',
  'vendor',
  'product',
  'domain',
  'category',
  'confirmation',
] as const satisfies readonly RulesUseCaseAdminField[];

export interface RulesUseCaseDetailFeatureProps {
  readonly useCaseId: string;
  readonly searchParams: RulesSearchParams;
}

export async function RulesUseCaseDetailFeature({
  searchParams,
  useCaseId,
}: RulesUseCaseDetailFeatureProps) {
  if (!canonicalUseCaseId.test(useCaseId)) {
    return <RulesUseCaseNotFoundState />;
  }

  const api = new RulesIntelligenceDataAccess({
    fetch: authenticatedMercureFetch,
  });

  try {
    const [useCase, identity] = await Promise.all([
      api.getUseCase(useCaseId),
      getServerMercureIdentity(),
    ]);

    if (!useCase) {
      return <RulesUseCaseNotFoundState />;
    }

    const canAdminister = identity?.role === 'admin';
    const errorCode = enumSearchParam(searchParams, 'error', errorCodes);
    const errorField = enumSearchParam(searchParams, 'field', errorFields);

    return (
      <RulesUseCaseDetail
        useCase={useCase}
        canAdminister={canAdminister}
        {...(canAdminister && useCase.source === 'custom'
          ? { deleteAction: deleteRulesUseCaseAction }
          : {})}
        {...(errorCode === undefined ? {} : { errorCode })}
        {...(errorField === undefined ? {} : { errorField })}
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
