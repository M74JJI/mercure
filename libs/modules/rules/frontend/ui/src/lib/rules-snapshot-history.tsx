import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type { RulesSnapshotSummaryView } from './models';
import { RulesSnapshotImportForm } from './rules-snapshot-import-form';
import styles from './rules.module.css';

export type RulesSnapshotImportStatus = 'unavailable' | 'failed';

export interface RulesSnapshotHistoryProps {
  readonly snapshots: readonly RulesSnapshotSummaryView[];
  readonly total: number;
  readonly canImport: boolean;
  readonly importAction?: (formData: FormData) => Promise<void>;
  readonly importStatus?: RulesSnapshotImportStatus;
}

const dateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function importStatusMessage(status: RulesSnapshotImportStatus | undefined): string | undefined {
  if (status === 'unavailable') {
    return 'No usable configured Rules manager source is currently available to import.';
  }

  if (status === 'failed') {
    return 'The Rules snapshot import could not be completed.';
  }

  return undefined;
}

export function RulesSnapshotHistory({
  canImport,
  importAction,
  importStatus,
  snapshots,
  total,
}: RulesSnapshotHistoryProps) {
  const importMessage = importStatusMessage(importStatus);

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules"
        title="Configuration snapshots"
        description="Immutable views of normalized Wazuh rules, decoders, and validation findings imported from the server-configured manager archive source."
        actions={
          <div className={styles.headerActions}>
            {canImport && importAction ? (
              <RulesSnapshotImportForm action={importAction} />
            ) : null}
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

      {importMessage ? (
        <Panel tone="muted" className={styles.formNotice}>
          <strong>{importMessage}</strong>
        </Panel>
      ) : null}

      {snapshots.length === 0 ? (
        <Panel tone="muted" className={styles.empty}>
          <h2>No Rules snapshots yet</h2>
          <p>
            {canImport
              ? 'Import the configured manager archive source to create the first immutable snapshot.'
              : 'No imported configuration snapshot is currently available to inspect.'}
          </p>
        </Panel>
      ) : (
        <section className={styles.snapshotList} aria-label="Rules snapshot history">
          {snapshots.map((snapshot) => (
            <a className={styles.snapshotLink} href={'/rules/' + snapshot.id} key={snapshot.id}>
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
