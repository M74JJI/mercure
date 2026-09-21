import type {
  RulesSnapshot,
  RulesSnapshotListQuery,
  RulesSnapshotPage,
} from '@mercure/rules-frontend-data-access';

export const COMPARISON_SNAPSHOT_PAGE_SIZE = 25;

export interface ComparisonSnapshotSource {
  listSnapshots(query: RulesSnapshotListQuery): Promise<RulesSnapshotPage>;
  getSnapshot(snapshotId: string): Promise<RulesSnapshot | null>;
}

export interface ComparisonSnapshotSelection {
  readonly page: RulesSnapshotPage;
  readonly options: readonly RulesSnapshot[];
  readonly selectedBefore?: string;
  readonly selectedAfter?: string;
}

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function comparisonSnapshotOffset(value: string | undefined): number {
  if (value === undefined) return 0;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return 0;
  return Math.min(parsed, 1_000_000);
}

function requestedSnapshotId(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized && uuid.test(normalized) ? normalized : undefined;
}

export async function loadComparisonSnapshotSelection(
  source: ComparisonSnapshotSource,
  offset: number,
  beforeSnapshotId?: string,
  afterSnapshotId?: string,
): Promise<ComparisonSnapshotSelection> {
  const page = await source.listSnapshots({
    offset,
    limit: COMPARISON_SNAPSHOT_PAGE_SIZE,
  });
  const byId = new Map(page.items.map((snapshot) => [snapshot.id, snapshot] as const));
  const requestedIds = [
    requestedSnapshotId(beforeSnapshotId),
    requestedSnapshotId(afterSnapshotId),
  ].filter((value): value is string => value !== undefined);

  await Promise.all(
    [...new Set(requestedIds)].map(async (snapshotId) => {
      if (byId.has(snapshotId)) return;
      const snapshot = await source.getSnapshot(snapshotId);
      if (snapshot) byId.set(snapshot.id, snapshot);
    }),
  );

  if (byId.size < 2 && page.total >= 2) {
    const recent = offset === 0 ? page : await source.listSnapshots({ offset: 0, limit: 2 });
    for (const snapshot of recent.items) byId.set(snapshot.id, snapshot);
  }

  const options = [...byId.values()];
  const fallbackAfter = page.items[0] ?? options[0];
  const fallbackBefore =
    page.items.find((snapshot) => snapshot.id !== fallbackAfter?.id) ??
    options.find((snapshot) => snapshot.id !== fallbackAfter?.id);

  let selectedAfter =
    requestedIds[1] && byId.has(requestedIds[1]) ? requestedIds[1] : fallbackAfter?.id;
  let selectedBefore =
    requestedIds[0] && byId.has(requestedIds[0]) ? requestedIds[0] : fallbackBefore?.id;

  if (selectedBefore && selectedAfter && selectedBefore === selectedAfter) {
    selectedBefore = options.find((snapshot) => snapshot.id !== selectedAfter)?.id;
  }

  return {
    page,
    options,
    ...(selectedBefore === undefined ? {} : { selectedBefore }),
    ...(selectedAfter === undefined ? {} : { selectedAfter }),
  };
}
