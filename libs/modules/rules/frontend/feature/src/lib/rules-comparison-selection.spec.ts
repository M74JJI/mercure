import { describe, expect, it } from 'vitest';

import type {
  RulesSnapshot,
  RulesSnapshotListQuery,
  RulesSnapshotPage,
} from '@mercure/rules-frontend-data-access';

import {
  COMPARISON_SNAPSHOT_PAGE_SIZE,
  comparisonSnapshotOffset,
  loadComparisonSnapshotSelection,
  type ComparisonSnapshotSource,
} from './rules-comparison-selection';

function snapshot(index: number): RulesSnapshot {
  const id = '00000000-0000-4000-8000-' + String(index).padStart(12, '0');
  return {
    id,
    sourceFingerprint: 'a'.repeat(64),
    contentFingerprint: 'b'.repeat(64),
    loadedAt: '2026-09-21T00:00:00.000Z',
    createdAt: new Date(Date.UTC(2026, 8, 21, 0, index)).toISOString(),
    complete: true,
    sourceErrorCount: 0,
    archiveCount: 1,
    fileCount: 1,
    ruleCount: 1,
    decoderCount: 0,
    useCaseCount: 0,
    jiraVisibleCount: 0,
    testingCount: 0,
    productionCount: 1,
    criticalCount: 0,
    mitreMappedCount: 0,
    missingUseCaseCount: 1,
    unresolvedDependencyCount: 0,
  };
}

function source(items: readonly RulesSnapshot[]): ComparisonSnapshotSource {
  return {
    async listSnapshots(query: RulesSnapshotListQuery): Promise<RulesSnapshotPage> {
      const offset = query.offset ?? 0;
      const limit = query.limit ?? 25;
      return {
        offset,
        limit,
        total: items.length,
        items: items.slice(offset, offset + limit),
      };
    },
    async getSnapshot(snapshotId: string) {
      return items.find((item) => item.id === snapshotId) ?? null;
    },
  };
}

describe('comparison snapshot selection', () => {
  it('preserves valid historical snapshot IDs outside the current options page', async () => {
    const snapshots = Array.from({ length: 30 }, (_value, index) => snapshot(index + 1));
    const historical = snapshots[29];
    const recent = snapshots[0];

    const selection = await loadComparisonSnapshotSelection(
      source(snapshots),
      0,
      historical?.id,
      recent?.id,
    );

    expect(selection.page.items).toHaveLength(COMPARISON_SNAPSHOT_PAGE_SIZE);
    expect(selection.selectedBefore).toBe(historical?.id);
    expect(selection.selectedAfter).toBe(recent?.id);
    expect(selection.options.some((item) => item.id === historical?.id)).toBe(true);
  });

  it('supports paging through historical snapshot options without losing explicit selections', async () => {
    const snapshots = Array.from({ length: 30 }, (_value, index) => snapshot(index + 1));
    const before = snapshots[1];
    const after = snapshots[28];

    const selection = await loadComparisonSnapshotSelection(
      source(snapshots),
      25,
      before?.id,
      after?.id,
    );

    expect(selection.page.offset).toBe(25);
    expect(selection.page.items).toHaveLength(5);
    expect(selection.selectedBefore).toBe(before?.id);
    expect(selection.selectedAfter).toBe(after?.id);
  });

  it('bounds invalid snapshot-page offsets', () => {
    expect(comparisonSnapshotOffset('-1')).toBe(0);
    expect(comparisonSnapshotOffset('invalid')).toBe(0);
    expect(comparisonSnapshotOffset('9999999')).toBe(1_000_000);
  });
});
