import { rulesHref } from './rules-search-params';

export const SNAPSHOT_EXPLORER_PAGE_SIZE = 50;

export interface SnapshotExplorerPagination {
  readonly previousHref?: string;
  readonly nextHref?: string;
}

export function snapshotExplorerPagination(
  path: string,
  offset: number,
  total: number,
  filters: Readonly<Record<string, string | number | undefined>>,
): SnapshotExplorerPagination {
  const previousHref =
    offset > 0
      ? rulesHref(path, {
          ...filters,
          offset: Math.max(0, offset - SNAPSHOT_EXPLORER_PAGE_SIZE),
        })
      : undefined;
  const nextHref =
    offset + SNAPSHOT_EXPLORER_PAGE_SIZE < total
      ? rulesHref(path, {
          ...filters,
          offset: offset + SNAPSHOT_EXPLORER_PAGE_SIZE,
        })
      : undefined;

  return {
    ...(previousHref === undefined ? {} : { previousHref }),
    ...(nextHref === undefined ? {} : { nextHref }),
  };
}
