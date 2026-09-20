import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import styles from './rules.module.css';

export function RulesUnavailableState() {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules"
        title="Rules data is unavailable"
        description="Mercure could not reach the Rules API. The application shell is healthy, but snapshot data cannot be loaded right now."
        actions={<StatusBadge tone="accent">API unavailable</StatusBadge>}
      />
      <Panel tone="muted" className={styles.statePanel}>
        <h2>Nothing was changed.</h2>
        <p>Refresh after the API or database service is available again.</p>
      </Panel>
    </div>
  );
}

export function RulesSnapshotNotFoundState() {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules"
        title="Snapshot not found"
        description="This immutable Rules snapshot does not exist or is no longer available."
        actions={<StatusBadge>Not found</StatusBadge>}
      />
      <Panel tone="muted" className={styles.statePanel}>
        <a className={styles.backLink} href="/rules">
          ← Return to snapshot history
        </a>
      </Panel>
    </div>
  );
}

export function RulesIntelligenceUnavailableState() {
  return (
    <Panel tone="muted" className={styles.statePanel}>
      <h2>Intelligence is temporarily unavailable</h2>
      <p>
        Core snapshot data remains available. Derived quality, field, graph, and diagnostic
        analysis could not be loaded for this request.
      </p>
    </Panel>
  );
}

export function RulesUseCaseNotFoundState() {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules use case"
        title="Use case not found"
        description="This canonical Rules use-case entry does not exist or is no longer available."
        actions={<StatusBadge>Not found</StatusBadge>}
      />
      <Panel tone="muted" className={styles.statePanel}>
        <a className={styles.backLink} href="/rules/use-cases">
          ← Return to use-case catalog
        </a>
      </Panel>
    </div>
  );
}


export function RulesSnapshotRecordNotFoundState({ collection, snapshotId }: { readonly collection: 'rules' | 'decoders' | 'issues'; readonly snapshotId: string }) {
  const label = collection === 'issues' ? 'Finding' : collection === 'rules' ? 'Rule' : 'Decoder';
  return <div className={styles.page}>
    <PageHeader eyebrow="Rules snapshot" title={label + ' not found'} description="This immutable snapshot record does not exist, or its snapshot is no longer available." actions={<StatusBadge>Not found</StatusBadge>} />
    <Panel tone="muted" className={styles.statePanel}><a className={styles.backLink} href={'/rules/' + snapshotId + '/' + collection}>← Return to explorer</a></Panel>
  </div>;
}
