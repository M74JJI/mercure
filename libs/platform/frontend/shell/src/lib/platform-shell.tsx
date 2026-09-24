'use client';

import Image from 'next/image';
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
  readonly identity: {
    readonly displayName: string;
    readonly role: 'admin' | 'user' | null;
  };
  readonly accountAction?: ReactNode;
}

function initials(displayName: string): string {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function currentSection(pathname: string): string {
  if (pathname.startsWith('/rules')) return 'Rules intelligence';
  return 'Operations overview';
}

function NavigationIcon({ icon }: { readonly icon: PlatformNavigationIcon }) {
  if (icon === 'overview') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.navIcon}>
        <path d="M4 4.75A.75.75 0 0 1 4.75 4h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.75.75h-5.5A.75.75 0 0 1 4 10.25zm9 0a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1-.75-.75zm0 7a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1-.75-.75zm-9 2a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1-.75-.75z" />
      </svg>
    );
  }

  if (icon === 'rules') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.navIcon}>
        <path d="M6.25 3.5h11.5A2.25 2.25 0 0 1 20 5.75v12.5a2.25 2.25 0 0 1-2.25 2.25H6.25A2.25 2.25 0 0 1 4 18.25V5.75A2.25 2.25 0 0 1 6.25 3.5m1.5 4a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5zm0 4a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5zm0 4a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5z" />
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

export function PlatformShell({ accountAction, children, identity }: PlatformShellProps) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#platform-main">
        Skip to main content
      </a>

      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <Image src="/mercure-logo.png" alt="" width={38} height={38} priority unoptimized />
          </span>
          <span className={styles.brandCopy}>
            <strong>Mercure</strong>
            <small>Security operations</small>
          </span>
        </div>

        <div className={styles.workspaceLabel}>
          <span className={styles.workspacePulse} aria-hidden="true" />
          <span>
            <small>Workspace</small>
            <strong>SOC Operations</strong>
          </span>
        </div>

        <nav aria-label="Primary navigation" className={styles.navigation}>
          <p className={styles.navigationLabel}>Command center</p>
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
          <span className={styles.footerCopy}>
            <strong>Systems operational</strong>
            <small>Identity · API · Database</small>
          </span>
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.topbarContext}>
            <p className={styles.topbarEyebrow}>Mercure / Workspace</p>
            <p className={styles.topbarTitle}>{currentSection(pathname)}</p>
          </div>
          <div className={styles.account}>
            <span className={styles.environment}>Production</span>
            <span className={styles.avatar} aria-hidden="true">
              {initials(identity.displayName)}
            </span>
            <span className={styles.accountCopy}>
              <strong>{identity.displayName}</strong>
              <small>{identity.role === 'admin' ? 'Administrator' : 'Analyst'}</small>
            </span>
            {accountAction ? <div className={styles.accountAction}>{accountAction}</div> : null}
          </div>
        </header>

        <main id="platform-main" tabIndex={-1} className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}
