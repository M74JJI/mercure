import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesDataAccess,
  RulesFrontendApiError,
} from '@mercure/rules-frontend-data-access';
import {
  RulesSnapshotDecodersExplorer,
  RulesSnapshotNotFoundState,
  RulesUnavailableState,
} from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import {
  boundedIntegerSearchParam,
  rulesHref,
  trimmedSearchParam,
  type RulesSearchParams,
} from './rules-search-params';

const PAGE_SIZE = 50;

export interface RulesSnapshotDecodersExplorerFeatureProps {
  readonly snapshotId: string;
  readonly searchParams: RulesSearchParams;
}

export async function RulesSnapshotDecodersExplorerFeature({
  searchParams,
  snapshotId,
}: RulesSnapshotDecodersExplorerFeatureProps) {
  const api = new RulesDataAccess({ fetch: authenticatedMercureFetch });
  const offset = boundedIntegerSearchParam(searchParams, 'offset', 0, 0, 1_000_000);
  const selectedTenant = trimmedSearchParam(searchParams, 'tenant', 255);
  const selectedName = trimmedSearchParam(searchParams, 'name', 255);

  try {
    const snapshot = await api.getSnapshot(snapshotId);
    if (!snapshot) {
      return <RulesSnapshotNotFoundState />;
    }

    const page = await api.listDecoders(snapshotId, {
      offset,
      limit: PAGE_SIZE,
      ...(selectedTenant === undefined ? {} : { tenant: selectedTenant }),
      ...(selectedName === undefined ? {} : { name: selectedName }),
    });

    const shared = {
      ...(selectedTenant === undefined ? {} : { tenant: selectedTenant }),
      ...(selectedName === undefined ? {} : { name: selectedName }),
    };
    const path = '/rules/' + snapshotId + '/decoders';
    const previousHref =
      offset > 0
        ? rulesHref(path, {
            ...shared,
            offset: Math.max(0, offset - PAGE_SIZE),
          })
        : undefined;
    const nextHref =
      offset + page.items.length < page.total
        ? rulesHref(path, {
            ...shared,
            offset: offset + PAGE_SIZE,
          })
        : undefined;

    return (
      <RulesSnapshotDecodersExplorer
        snapshotId={snapshotId}
        decoders={page.items}
        total={page.total}
        {...(selectedTenant === undefined ? {} : { selectedTenant })}
        {...(selectedName === undefined ? {} : { selectedName })}
        {...(previousHref === undefined ? {} : { previousHref })}
        {...(nextHref === undefined ? {} : { nextHref })}
      />
    );
  } catch (error) {
    if (error instanceof RulesFrontendApiError) {
      if (error.status === 404) {
        return <RulesSnapshotNotFoundState />;
      }

      redirectRulesAuthorizationFailure(error);
      return <RulesUnavailableState />;
    }

    throw error;
  }
}
