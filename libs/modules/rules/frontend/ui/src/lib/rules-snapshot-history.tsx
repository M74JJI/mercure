import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type { RulesSnapshotSummaryView } from './models';
import styles from './rules.module.css';

export interface RulesSnapshotHistoryProps {
  readonly snapshots: readonly RulesSnapshotSummaryView[];
  readonly total: number;
}

const dateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function RulesSnapshotHistory({ snapshots, total }: RulesSnapshotHistoryProps) {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules"
        title="Configuration snapshots"
        description="Immutable views of normalized Wazuh rules, decoders, and validation findings imported from configured manager archives."
        actions={
          <div className={styles.headerActions}>
            <a className={styles.actionLink} href="/rules/compare">
              Compare
            </a>
            <a className={styles.actionLink} href="/rules/use-cases">
              Use cases
            </a>
            <StatusBadge tone="accent">{String(total) + ' snapshots'}</StatusBadge>
          </div>
        }
      />

      {snapshots.length === 0 ? (
        <Panel tone="muted" className={styles.empty}>
          <h2>No Rules snapshots yet</h2>
          <p>
            The backend is ready, but no imported configuration snapshot is available to inspect.
          </p>
        </Panel>
      ) : (
        <section className={styles.snapshotList} aria-label="Rules snapshot history">
          {snapshots.map((snapshot) => (
            <a className={styles.snapshotLink} href={`/rules/${snapshot.id}`} key={snapshot.id}>
              <Panel tone="raised" className={styles.snapshotCard}>
                <div className={styles.snapshotHeading}>
                  <div>
                    <p className={styles.eyebrow}>Snapshot</p>
                    <h2>{formatDate(snapshot.createdAt)} UTC</h2>
                  </div>
                  <StatusBadge tone={snapshot.complete ? 'positive' : 'accent'}>
                    {snapshot.complete ? 'Complete' : 'Partial'}
                  </StatusBadge>
                </div>

                <div className={styles.inlineStats}>
                  <span>
                    <strong>{snapshot.ruleCount}</strong> rules
                  </span>
                  <span>
                    <strong>{snapshot.decoderCount}</strong> decoders
                  </span>
                  <span>
                    <strong>{snapshot.criticalCount}</strong> critical
                  </span>
                  <span>
                    <strong>{snapshot.brokenDependencyCount}</strong> dependency findings
                  </span>
                </div>

                <div className={styles.snapshotFooter}>
                  <span>{snapshot.productionCount} production rules</span>
                  <span>{snapshot.sourceErrorCount} source errors</span>
                  <span className={styles.mono}>{snapshot.id}</span>
                </div>
              </Panel>
            </a>
          ))}
        </section>
      )}
    </div>
  );
}
