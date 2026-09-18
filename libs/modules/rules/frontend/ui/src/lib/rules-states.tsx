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
