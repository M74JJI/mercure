'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import {
  platformNavigation,
  type PlatformNavigationIcon,
} from '@mercure/platform-frontend-navigation';

import styles from './platform-shell.module.css';

export interface PlatformShellProps {
  readonly children: ReactNode;
}

function NavigationIcon({ icon }: { readonly icon: PlatformNavigationIcon }) {
  if (icon === 'overview') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.navIcon}>
        <path d="M4 4.75A.75.75 0 0 1 4.75 4h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.75.75h-5.5A.75.75 0 0 1 4 10.25zm9 0a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1-.75-.75zm0 7a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1-.75-.75zm-9 2a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1-.75-.75z" />
      </svg>
    );
  }

  return null;
}

function isCurrentPath(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PlatformShell({ children }: PlatformShellProps) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#platform-main">
        Skip to main content
      </a>

      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            M
          </span>
          <span className={styles.brandCopy}>
            <strong>Mercure</strong>
            <small>Security platform</small>
          </span>
        </div>

        <nav aria-label="Primary navigation" className={styles.navigation}>
          <p className={styles.navigationLabel}>Workspace</p>
          {platformNavigation.map((item) => {
            const current = isCurrentPath(pathname, item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={styles.navigationLink}
                aria-current={current ? 'page' : undefined}
                data-active={current || undefined}
              >
                <NavigationIcon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <span className={styles.healthDot} aria-hidden="true" />
          <span>
            <strong>Foundation</strong>
            <small>Platform baseline</small>
          </span>
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.topbarEyebrow}>Mercure</p>
            <p className={styles.topbarTitle}>Security engineering workspace</p>
          </div>
          <span className={styles.environment}>Foundation</span>
        </header>

        <main id="platform-main" tabIndex={-1} className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}
