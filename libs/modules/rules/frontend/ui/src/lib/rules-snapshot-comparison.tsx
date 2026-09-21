import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type { RulesComparisonSnapshotOptionView, RulesSnapshotComparisonView } from './models';

const COMPARISON_SNAPSHOT_PAGE_SIZE = 25;
import styles from './rules.module.css';

export interface RulesSnapshotComparisonProps {
  readonly snapshots: readonly RulesComparisonSnapshotOptionView[];
  readonly comparison?: RulesSnapshotComparisonView;
  readonly selectedBefore?: string;
  readonly selectedAfter?: string;
  readonly selectedKind: RulesSnapshotComparisonView['kind'];
  readonly previousHref?: string;
  readonly nextHref?: string;
  readonly snapshotPreviousHref?: string;
  readonly snapshotNextHref?: string;
  readonly snapshotPage?: {
    readonly offset: number;
    readonly shown: number;
    readonly total: number;
  };
}

const dateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

function snapshotLabel(snapshot: RulesComparisonSnapshotOptionView): string {
  return dateFormatter.format(new Date(snapshot.createdAt)) + ' UTC';
}

export function RulesSnapshotComparison({
  snapshots,
  comparison,
  nextHref,
  previousHref,
  selectedAfter,
  selectedBefore,
  selectedKind,
  snapshotNextHref,
  snapshotPage,
  snapshotPreviousHref,
}: RulesSnapshotComparisonProps) {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules intelligence"
        title="Compare immutable snapshots"
        description="Inspect bounded semantic changes between two known configuration snapshots. Raw XML and source-file contents are excluded from this view."
        actions={
          comparison ? (
            <StatusBadge tone="neutral">{String(comparison.page.total) + ' changes'}</StatusBadge>
          ) : (
            <StatusBadge tone="neutral">Read only</StatusBadge>
          )
        }
      />

      <div className={styles.headerActions}>
        <a className={styles.actionLink} href="/rules">
          ← Snapshots
        </a>
        <a className={styles.actionLink} href="/rules/use-cases">
          Use-case catalog
        </a>
      </div>

      {snapshots.length < 2 ? (
        <Panel tone="muted" className={styles.empty}>
          <h2>Two snapshots are required</h2>
          <p>Import at least two immutable snapshots before using comparison.</p>
        </Panel>
      ) : (
        <>
          <Panel tone="raised" className={styles.compareControls}>
            <form action="/rules/compare" method="get" className={styles.compareForm}>
              <label>
                <span>Before</span>
                <select name="before" defaultValue={selectedBefore}>
                  {snapshots.map((snapshot) => (
                    <option value={snapshot.id} key={'before:' + snapshot.id}>
                      {snapshotLabel(snapshot)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>After</span>
                <select name="after" defaultValue={selectedAfter}>
                  {snapshots.map((snapshot) => (
                    <option value={snapshot.id} key={'after:' + snapshot.id}>
                      {snapshotLabel(snapshot)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Category</span>
                <select name="kind" defaultValue={selectedKind}>
                  <option value="rules">Rules</option>
                  <option value="decoders">Decoders</option>
                  <option value="files">Files</option>
                  <option value="use_cases">Use cases</option>
                  <option value="issues">Issues</option>
                </select>
              </label>

              <button type="submit">Compare</button>
            </form>
            {snapshotPage && snapshotPage.total > COMPARISON_SNAPSHOT_PAGE_SIZE ? (
              <div className={styles.pagination}>
                {snapshotPreviousHref ? (
                  <a className={styles.actionLink} href={snapshotPreviousHref}>
                    ← Newer snapshots
                  </a>
                ) : (
                  <span />
                )}
                <span>
                  {snapshotPage.offset + 1}–{snapshotPage.offset + snapshotPage.shown} of{' '}
                  {snapshotPage.total}
                </span>
                {snapshotNextHref ? (
                  <a className={styles.actionLink} href={snapshotNextHref}>
                    Older snapshots →
                  </a>
                ) : null}
              </div>
            ) : null}
          </Panel>

          {comparison ? (
            <>
              <section
                className={styles.comparisonMetrics}
                aria-label="Snapshot comparison summary"
              >
                <Panel tone="muted" className={styles.metric}>
                  <strong>{comparison.summary.rulesAdded}</strong>
                  <span>Rules added</span>
                </Panel>
                <Panel tone="muted" className={styles.metric}>
                  <strong>{comparison.summary.rulesRemoved}</strong>
                  <span>Rules removed</span>
                </Panel>
                <Panel tone="muted" className={styles.metric}>
                  <strong>{comparison.summary.rulesChanged}</strong>
                  <span>Rules changed</span>
                </Panel>
                <Panel tone="muted" className={styles.metric}>
                  <strong>{comparison.summary.newIssues}</strong>
                  <span>New issues</span>
                </Panel>
              </section>

              <Panel tone="raised" className={styles.sectionPanel}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.eyebrow}>Change set</p>
                    <h2>{selectedKind.replace('_', ' ')}</h2>
                  </div>
                  <span>{comparison.page.total} total</span>
                </div>

                {comparison.page.items.length === 0 ? (
                  <p className={styles.emptyInline}>No changes in this category.</p>
                ) : (
                  <ul className={styles.comparisonList}>
                    {comparison.page.items.map((item) => (
                      <li key={item.state + ':' + item.key}>
                        <div className={styles.issueTopline}>
                          <strong className={styles.mono}>{item.key}</strong>
                          <StatusBadge
                            tone={
                              item.state === 'added'
                                ? 'positive'
                                : item.state === 'removed' || item.state === 'resolved'
                                  ? 'neutral'
                                  : 'accent'
                            }
                          >
                            {item.state}
                          </StatusBadge>
                        </div>
                        <p>{item.changes.join(' · ') || 'Entity membership changed.'}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <div className={styles.pagination}>
                {previousHref ? (
                  <a className={styles.actionLink} href={previousHref}>
                    ← Previous
                  </a>
                ) : (
                  <span />
                )}
                {nextHref ? (
                  <a className={styles.actionLink} href={nextHref}>
                    Next →
                  </a>
                ) : null}
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
