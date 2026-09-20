import { redirect } from 'next/navigation';

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
  createNewRulesAuthoringDraftAction,
  updateRulesAuthoringDraftAction,
  validateRulesAuthoringDraftAction,
} from './rules-authoring-actions';
import { boundedIntegerSearchParam } from './rules-search-params';
import { snapshotExplorerPagination } from './rules-snapshot-explorer-pagination';
import { requireRulesAdminIdentity } from './rules-use-case-admin-boundary';

const errorCodes = ['validation', 'conflict', 'not-found', 'unavailable'] as const;
const AUTHORING_PAGE_SIZE = 25;
type ErrorCode = (typeof errorCodes)[number];

function errorCode(value: string | readonly string[] | undefined): ErrorCode | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return errorCodes.find((code) => code === candidate);
}

export async function RulesAuthoringDraftListFeature({
  searchParams,
}: {
  readonly searchParams: Readonly<Record<string, string | readonly string[] | undefined>>;
}) {
  await requireRulesAdminIdentity();
  const api = new RulesAuthoringDataAccess({ fetch: authenticatedMercureFetch });
  const offset = boundedIntegerSearchParam(searchParams, 'offset', 0, 0, 1_000_000);

  try {
    const [page, error] = await Promise.all([
      api.list({ offset, limit: AUTHORING_PAGE_SIZE }),
      Promise.resolve(errorCode(searchParams.error)),
    ]);
    if (page.total > 0 && page.items.length === 0 && offset > 0) {
      const lastOffset = Math.floor((page.total - 1) / AUTHORING_PAGE_SIZE) * AUTHORING_PAGE_SIZE;
      redirect(lastOffset === 0 ? '/rules/drafts' : '/rules/drafts?offset=' + lastOffset);
    }

    const pagination = snapshotExplorerPagination(
      '/rules/drafts',
      offset,
      page.total,
      {},
      AUTHORING_PAGE_SIZE,
    );

    return (
      <RulesAuthoringDraftList
        drafts={page.items}
        total={page.total}
        createNewAction={createNewRulesAuthoringDraftAction}
        {...(error === undefined ? {} : { error })}
        {...pagination}
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
