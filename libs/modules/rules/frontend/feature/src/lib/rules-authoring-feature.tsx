import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesAuthoringDataAccess,
  RulesFrontendApiError,
} from '@mercure/rules-frontend-data-access';
import {
  RulesAuthoringDraftDetail,
  RulesAuthoringDraftList,
  RulesUnavailableState,
} from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import {
  approveRulesAuthoringDraftAction,
  updateRulesAuthoringDraftAction,
  validateRulesAuthoringDraftAction,
} from './rules-authoring-actions';
import { requireRulesAdminIdentity } from './rules-use-case-admin-boundary';

const errorCodes = ['validation', 'conflict', 'not-found', 'unavailable'] as const;
type ErrorCode = (typeof errorCodes)[number];

function errorCode(value: string | readonly string[] | undefined): ErrorCode | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return errorCodes.find((code) => code === candidate);
}

export async function RulesAuthoringDraftListFeature() {
  await requireRulesAdminIdentity();
  const api = new RulesAuthoringDataAccess({ fetch: authenticatedMercureFetch });
  try {
    return <RulesAuthoringDraftList drafts={await api.list()} />;
  } catch (error) {
    if (error instanceof RulesFrontendApiError) {
      redirectRulesAuthorizationFailure(error);
      return <RulesUnavailableState />;
    }
    throw error;
  }
}

export async function RulesAuthoringDraftDetailFeature({
  draftId,
  searchParams,
}: {
  readonly draftId: string;
  readonly searchParams: Readonly<Record<string, string | readonly string[] | undefined>>;
}) {
  await requireRulesAdminIdentity();
  if (!/^[0-9a-f-]{36}$/i.test(draftId)) return <RulesUnavailableState />;

  const api = new RulesAuthoringDataAccess({ fetch: authenticatedMercureFetch });
  try {
    const draft = await api.get(draftId);
    if (!draft) return <RulesUnavailableState />;

    const error = errorCode(searchParams.error);
    return <RulesAuthoringDraftDetail
      draft={draft}
      updateAction={updateRulesAuthoringDraftAction}
      validateAction={validateRulesAuthoringDraftAction}
      approveAction={approveRulesAuthoringDraftAction}
      {...(error === undefined ? {} : { error })}
    />;
  } catch (caught) {
    if (caught instanceof RulesFrontendApiError) {
      redirectRulesAuthorizationFailure(caught);
      return <RulesUnavailableState />;
    }
    throw caught;
  }
}
