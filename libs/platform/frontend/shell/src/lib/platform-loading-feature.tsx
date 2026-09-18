import styles from './platform-state-feature.module.css';

export function PlatformLoadingFeature() {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.loadingBar} />
      <span className={styles.loadingBar} />
      <span className={styles.loadingBarShort} />
      <span className={styles.srOnly}>Loading Mercure</span>
    </div>
  );
}
