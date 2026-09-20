import {
  RulesUseCaseAdministrationForm,
  type RulesUseCaseAdminErrorCode,
  type RulesUseCaseAdminField,
} from '@mercure/rules-frontend-ui';

import { createRulesUseCaseAction } from './rules-use-case-administration-actions';
import { requireRulesAdminIdentity } from './rules-use-case-admin-boundary';
import {
  enumSearchParam,
  type RulesSearchParams,
} from './rules-search-params';

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

export interface RulesUseCaseCreateFeatureProps {
  readonly searchParams: RulesSearchParams;
}

export async function RulesUseCaseCreateFeature({
  searchParams,
}: RulesUseCaseCreateFeatureProps) {
  await requireRulesAdminIdentity();

  const errorCode = enumSearchParam(searchParams, 'error', errorCodes);
  const errorField = enumSearchParam(searchParams, 'field', errorFields);

  return (
    <RulesUseCaseAdministrationForm
      mode="create"
      action={createRulesUseCaseAction}
      {...(errorCode === undefined ? {} : { errorCode })}
      {...(errorField === undefined ? {} : { errorField })}
    />
  );
}
