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
  readonly identity: { readonly displayName: string; readonly role: 'admin' | 'user' | null };
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

function NavigationIcon({ icon }: { readonly icon: PlatformNavigationIcon }) {
  if (icon === 'overview') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.navIcon}>
        <path d="M4 4.75A.75.75 0 0 1 4.75 4h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.75.75h-5.5A.75.75 0 0 1 4 10.25zm9 0a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1-.75-.75zm0 7a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1-.75-.75zm-9 2a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1-.75-.75z" />
      </svg>
    );
  }
  if (icon === 'audit') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.navIcon}>
        <path d="M12 2.75 20 6v5.4c0 4.75-3.22 8.56-8 9.85-4.78-1.29-8-5.1-8-9.85V6zm0 2.16L6 7.35v4.05c0 3.62 2.3 6.58 6 7.7 3.7-1.12 6-4.08 6-7.7V7.35zM11.25 8h1.5v4.25h-1.5zm0 5.75h1.5v1.5h-1.5z" />
      </svg>
    );
  }
  if (icon === 'status') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.navIcon}>
        <path d="M3 12h4l2.15-5.1a.75.75 0 0 1 1.4.05l2.8 8.05 1.85-3.58A.75.75 0 0 1 15.87 11H21v1.5h-4.67l-2.45 4.73a.75.75 0 0 1-1.38-.1l-2.7-7.77-1.62 3.68a.75.75 0 0 1-.68.46H3z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.navIcon}>
      <path d="M6.25 3.5h11.5A2.25 2.25 0 0 1 20 5.75v12.5a2.25 2.25 0 0 1-2.25 2.25H6.25A2.25 2.25 0 0 1 4 18.25V5.75A2.25 2.25 0 0 1 6.25 3.5m1.5 4a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5zm0 4a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5zm0 4a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5z" />
    </svg>
  );
}

function isCurrentPath(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function PlatformShell({ accountAction, children, identity }: PlatformShellProps) {
  const pathname = usePathname();
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#platform-main">
        Skip to main content
      </a>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand} aria-label="Mercure overview">
          <span className={styles.brandMark}>
            <Image src="/mercure-logo.png" alt="" width={32} height={32} priority unoptimized />
          </span>
          <span>
            <strong>Mercure</strong>
            <small>Security Operations</small>
          </span>
        </Link>

        <div className={styles.workspacePicker}>
          <span className={styles.healthDot} /> SOC Workspace <b>⌄</b>
        </div>

        <nav aria-label="Primary navigation" className={styles.navigation}>
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

        <div className={styles.toolbar}>
          <div className={styles.search} aria-label="Search is a visual placeholder">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m20 20-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
            </svg>
            <span>Search workspace</span>
            <kbd>⌘ K</kbd>
          </div>
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
  );
}
