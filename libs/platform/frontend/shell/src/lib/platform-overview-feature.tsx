import Link from 'next/link';
import type { CSSProperties } from 'react';

import styles from './platform-overview-feature.module.css';

const kpis = [
  { label: 'Security posture', value: '98.7%', delta: '+1.2%', tone: 'Green' },
  { label: 'Signals processed', value: '847', delta: '+23 today', tone: 'Cyan' },
  { label: 'Mean time to triage', value: '4.2m', delta: '−18%', tone: 'Amber' },
] as const;

const issues = [
  { title: 'Privileged access review due', scope: 'Production', level: 'High', time: '12 min' },
  { title: 'Stale service credential', scope: 'Client portal', level: 'Medium', time: '34 min' },
  { title: 'Log source latency detected', scope: 'EU collector', level: 'Medium', time: '1 hr' },
  { title: 'New rule package available', scope: 'Rules intelligence', level: 'Info', time: '2 hr' },
] as const;

const activities = [
  { title: 'Rule package approved', meta: 'Mohamed Hajji · Rules intelligence', time: '8m' },
  {
    title: 'Keycloak role mapping synchronized',
    meta: 'Identity service · Production',
    time: '26m',
  },
  { title: 'Configuration snapshot imported', meta: 'Wazuh manager · eu-west', time: '41m' },
  { title: 'Database migration verified', meta: 'Release pipeline · Main', time: '2h' },
] as const;

const environments = [
  { name: 'Production', score: 96, status: 'Healthy' },
  { name: 'Staging', score: 88, status: 'Review' },
  { name: 'Development', score: 92, status: 'Healthy' },
  { name: 'Disaster recovery', score: 78, status: 'Attention' },
] as const;

function MiniTrend({ tone }: { readonly tone: 'Green' | 'Cyan' | 'Amber' }) {
  return (
    <svg className={styles.miniTrend} viewBox="0 0 120 34" aria-hidden="true">
      <path className={styles.trendBase} d="M1 27H119" />
      <path
        className={styles[`trend${tone}`]}
        d="M2 26 14 20 25 23 37 11 49 17 61 14 73 20 86 8 98 12 118 4"
      />
    </svg>
  );
}

function EnvironmentMap() {
  return (
    <div className={styles.map} aria-label="Environment configuration map">
      <svg viewBox="0 0 760 300" role="img" aria-label="Connectivity between Mercure services">
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#20d58b" stopOpacity=".16" />
            <stop offset="1" stopColor="#20d58b" stopOpacity="0" />
          </linearGradient>
          <filter id="soft-glow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          className={styles.mapArea}
          d="M70 225 C135 198 176 122 242 160 S355 95 422 126 505 235 571 182 632 82 700 120 V278 H70Z"
        />
        <path
          className={styles.mapLine}
          d="M70 225 C135 198 176 122 242 160 S355 95 422 126 505 235 571 182 632 82 700 120"
        />
        {[110, 190, 300, 380, 480, 545, 655].map((x, index) => (
          <g key={x} opacity={index % 2 === 0 ? 0.7 : 0.35}>
            <line x1={x} y1={80 + (index % 3) * 35} x2={x} y2="252" className={styles.mapStem} />
            <circle cx={x} cy="252" r="3" className={styles.mapAnchor} />
          </g>
        ))}
        <g transform="translate(202 132)">
          <circle r="27" className={styles.nodeHalo} />
          <circle r="15" className={styles.nodeGreen} filter="url(#soft-glow)" />
          <text y="43" textAnchor="middle">
            STAGING
          </text>
        </g>
        <g transform="translate(416 124)">
          <circle r="31" className={styles.nodeHalo} />
          <circle r="17" className={styles.nodeAmber} filter="url(#soft-glow)" />
          <text y="47" textAnchor="middle">
            PRODUCTION
          </text>
        </g>
        <g transform="translate(574 180)">
          <circle r="27" className={styles.nodeHalo} />
          <circle r="15" className={styles.nodeGreen} filter="url(#soft-glow)" />
          <text y="43" textAnchor="middle">
            DR SITE
          </text>
        </g>
        <g transform="translate(675 104)">
          <circle r="22" className={styles.nodeHalo} />
          <circle r="12" className={styles.nodeGreen} filter="url(#soft-glow)" />
          <text y="36" textAnchor="middle">
            EDGE
          </text>
        </g>
      </svg>
      <div className={styles.mapLegend}>
        <span>
          <i className={styles.legendHealthy} /> Synchronized
        </span>
        <span>
          <i className={styles.legendReview} /> Review
        </span>
        <span>
          <i className={styles.legendMuted} /> Observed path
        </span>
      </div>
    </div>
  );
}

export function PlatformOverviewFeature() {
  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.headerMeta}>
            <span>Security engineering workspace</span>
            <span className={styles.demoBadge}>Demo dataset</span>
          </div>
          <h1>Security operations overview</h1>
          <p>Operational posture, platform health, and prioritized work across Mercure.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.filterButton}>
            Last 7 days <span>⌄</span>
          </button>
          <button type="button" className={styles.filterButton}>
            All environments <span>⌄</span>
          </button>
          <Link href="/rules" className={styles.primaryButton}>
            Open Rules intelligence
          </Link>
        </div>
      </header>

      <section className={styles.kpiGrid} aria-label="Security operations summary">
        {kpis.map((kpi) => (
          <article key={kpi.label} className={styles.kpiCard}>
            <div className={styles.kpiTopline}>
              <span>{kpi.label}</span>
              <i className={styles[`dot${kpi.tone}`]} />
            </div>
            <div className={styles.kpiBody}>
              <strong>{kpi.value}</strong>
              <span>{kpi.delta}</span>
            </div>
            <MiniTrend tone={kpi.tone} />
          </article>
        ))}
        <article className={styles.statusCard}>
          <span>Platform status</span>
          <strong>
            <i /> All systems operational
          </strong>
          <small>Identity, API, database and web healthy</small>
        </article>
      </section>

      <section className={styles.mainGrid}>
        <article className={`${styles.panel} ${styles.environmentPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Live topology</span>
              <h2>Environment configuration</h2>
            </div>
            <button type="button" className={styles.iconButton} aria-label="More map options">
              •••
            </button>
          </div>
          <EnvironmentMap />
        </article>

        <aside className={`${styles.panel} ${styles.issuePanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Priority queue</span>
              <h2>Action required</h2>
            </div>
            <span className={styles.countBadge}>4</span>
          </div>
          <div className={styles.issueList}>
            {issues.map((issue) => (
              <article key={issue.title} className={styles.issue} data-level={issue.level}>
                <i aria-hidden="true" />
                <div>
                  <h3>{issue.title}</h3>
                  <p>
                    {issue.scope} · {issue.time}
                  </p>
                </div>
                <span>{issue.level}</span>
              </article>
            ))}
          </div>
          <button type="button" className={styles.panelAction}>
            View all findings <span>→</span>
          </button>
        </aside>

        <article className={`${styles.panel} ${styles.posturePanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Coverage</span>
              <h2>Environment posture</h2>
            </div>
          </div>
          <div className={styles.environmentList}>
            {environments.map((environment) => (
              <div key={environment.name} className={styles.environmentRow}>
                <div>
                  <strong>{environment.name}</strong>
                  <span>{environment.status}</span>
                </div>
                <div className={styles.progressTrack}>
                  <span style={{ width: `${environment.score}%` }} />
                </div>
                <b>{environment.score}</b>
              </div>
            ))}
          </div>
          <div className={styles.donutRow}>
            <div className={styles.donut} style={{ '--value': '92%' } as CSSProperties}>
              <strong>92</strong>
              <span>/100</span>
            </div>
            <div>
              <strong>Control coverage</strong>
              <p>184 of 200 platform controls verified.</p>
            </div>
          </div>
        </article>

        <article className={`${styles.panel} ${styles.trendPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>30-day history</span>
              <h2>Operational trend</h2>
            </div>
            <div className={styles.legendInline}>
              <span>
                <i className={styles.legendHealthy} />
                Resolved
              </span>
              <span>
                <i className={styles.legendReview} />
                Opened
              </span>
            </div>
          </div>
          <div className={styles.barChart} aria-label="Thirty day issue activity chart">
            {[
              32, 46, 40, 62, 58, 75, 52, 43, 65, 71, 48, 82, 68, 76, 57, 64, 87, 78, 69, 90, 74,
              82, 67, 93,
            ].map((height, index) => (
              <span key={index} style={{ height: `${height}%` }}>
                <i style={{ height: `${Math.max(18, height - 22)}%` }} />
              </span>
            ))}
          </div>
          <div className={styles.chartAxis}>
            <span>Aug 26</span>
            <span>Sep 02</span>
            <span>Sep 09</span>
            <span>Today</span>
          </div>
        </article>

        <aside className={`${styles.panel} ${styles.activityPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Audit trail</span>
              <h2>Recent activity</h2>
            </div>
          </div>
          <div className={styles.activityList}>
            {activities.map((activity) => (
              <article key={activity.title}>
                <i aria-hidden="true" />
                <div>
                  <h3>{activity.title}</h3>
                  <p>{activity.meta}</p>
                </div>
                <time>{activity.time}</time>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
