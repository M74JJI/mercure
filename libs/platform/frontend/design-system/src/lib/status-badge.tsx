import styles from './status-badge.module.css';

export interface StatusBadgeProps {
  readonly children: string;
  readonly tone?: 'neutral' | 'positive' | 'accent';
}

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return <span className={[styles.badge, styles[tone]].join(' ')}>{children}</span>;
}
