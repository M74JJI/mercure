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
  SNAPSHOT_EXPLORER_PAGE_SIZE,
  snapshotExplorerPagination,
} from './rules-snapshot-explorer-pagination';
import {
  boundedIntegerSearchParam,
  trimmedSearchParam,
  type RulesSearchParams,
} from './rules-search-params';

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
      limit: SNAPSHOT_EXPLORER_PAGE_SIZE,
      ...(selectedTenant === undefined ? {} : { tenant: selectedTenant }),
      ...(selectedName === undefined ? {} : { name: selectedName }),
    });

    const pagination = snapshotExplorerPagination(
      '/rules/' + snapshotId + '/decoders',
      offset,
      page.total,
      {
        ...(selectedTenant === undefined ? {} : { tenant: selectedTenant }),
        ...(selectedName === undefined ? {} : { name: selectedName }),
      },
    );

    return (
      <RulesSnapshotDecodersExplorer
        snapshotId={snapshotId}
        decoders={page.items}
        total={page.total}
        {...(selectedTenant === undefined ? {} : { selectedTenant })}
        {...(selectedName === undefined ? {} : { selectedName })}
        {...pagination}
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
