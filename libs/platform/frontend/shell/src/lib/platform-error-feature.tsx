'use client';

import { Panel } from '@mercure/platform-frontend-design-system';

import styles from './platform-state-feature.module.css';

export interface PlatformErrorFeatureProps {
  readonly reset: () => void;
}

export function PlatformErrorFeature({ reset }: PlatformErrorFeatureProps) {
  return (
    <div className={styles.viewport}>
      <Panel className={styles.state} tone="raised">
        <p className={styles.eyebrow}>Request interrupted</p>
        <h1>Mercure could not render this view.</h1>
        <p>
          Internal error details are intentionally hidden. Retry the view; if the problem persists,
          use the request and application logs for investigation.
        </p>
        <button type="button" className={styles.action} onClick={reset}>
          Try again
        </button>
      </Panel>
    </div>
  );
}
