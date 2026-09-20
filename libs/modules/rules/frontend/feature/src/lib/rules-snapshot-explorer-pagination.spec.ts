import { describe, expect, it } from 'vitest';

import {
  SNAPSHOT_EXPLORER_PAGE_SIZE,
  snapshotExplorerPagination,
} from './rules-snapshot-explorer-pagination';

describe('snapshotExplorerPagination', () => {
  it('preserves filters across previous and next links', () => {
    expect(
      snapshotExplorerPagination('/rules/snapshot/rules', 50, 180, {
        tenant: 'manager-a',
        severity: 'high',
      }),
    ).toEqual({
      previousHref: '/rules/snapshot/rules?tenant=manager-a&severity=high&offset=0',
      nextHref: '/rules/snapshot/rules?tenant=manager-a&severity=high&offset=100',
    });
  });

  it('omits previous navigation on the first page', () => {
    expect(
      snapshotExplorerPagination('/rules/snapshot/decoders', 0, 51, {
        tenant: 'manager-a',
      }),
    ).toEqual({
      nextHref: '/rules/snapshot/decoders?tenant=manager-a&offset=50',
    });
  });

  it('omits next navigation on the final page', () => {
    expect(
      snapshotExplorerPagination('/rules/snapshot/issues', 100, 149, {
        severity: 'warning',
      }),
    ).toEqual({
      previousHref: '/rules/snapshot/issues?severity=warning&offset=50',
    });
  });

  it('supports a smaller bounded history page without changing explorer defaults', () => {
    expect(SNAPSHOT_EXPLORER_PAGE_SIZE).toBe(50);
    expect(snapshotExplorerPagination('/rules', 25, 80, {}, 25)).toEqual({
      previousHref: '/rules?offset=0',
      nextHref: '/rules?offset=50',
    });
  });
});
