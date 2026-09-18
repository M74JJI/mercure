import Link from 'next/link';

import { Panel } from '@mercure/platform-frontend-design-system';

import styles from './platform-state-feature.module.css';

export function PlatformNotFoundFeature() {
  return (
    <div className={styles.viewport}>
      <Panel className={styles.state} tone="raised">
        <p className={styles.eyebrow}>404</p>
        <h1>This Mercure route does not exist.</h1>
        <p>The requested platform location is not registered.</p>
        <Link className={styles.action} href="/">
          Return to overview
        </Link>
      </Panel>
    </div>
  );
}
