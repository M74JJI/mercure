import type { HTMLAttributes, ReactNode } from 'react';

import styles from './panel.module.css';

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly tone?: 'default' | 'muted' | 'raised';
}

export function Panel({ children, className, tone = 'default', ...props }: PanelProps) {
  const classes = [styles.panel, styles[tone], className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
