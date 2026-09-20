import { redirect } from 'next/navigation';

import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesFrontendApiError,
  RulesIntelligenceDataAccess,
} from '@mercure/rules-frontend-data-access';
import {
  RulesUnavailableState,
  RulesUseCaseAdministrationForm,
  RulesUseCaseNotFoundState,
  type RulesUseCaseAdminErrorCode,
  type RulesUseCaseAdminField,
} from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import { updateRulesUseCaseAction } from './rules-use-case-administration-actions';
import { requireRulesAdminIdentity } from './rules-use-case-admin-boundary';
import { enumSearchParam, type RulesSearchParams } from './rules-search-params';

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
] as const satisfies readonly RulesUseCaseAdminField[];

const canonicalUseCaseId = /^uc_[a-z0-9_]+$/;

export interface RulesUseCaseEditFeatureProps {
  readonly useCaseId: string;
  readonly searchParams: RulesSearchParams;
}

export async function RulesUseCaseEditFeature({
  searchParams,
  useCaseId,
}: RulesUseCaseEditFeatureProps) {
  await requireRulesAdminIdentity();

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

    if (useCase.source === 'system') {
      redirect('/rules/use-cases/' + useCase.id + '?error=protected');
    }

    const errorCode = enumSearchParam(searchParams, 'error', errorCodes);
    const errorField = enumSearchParam(searchParams, 'field', errorFields);

    return (
      <RulesUseCaseAdministrationForm
        mode="edit"
        useCase={useCase}
        action={updateRulesUseCaseAction}
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
