'use client';

import { useState } from 'react';

import styles from './platform-status-feature.module.css';

type ServiceState = 'Operational' | 'Degraded' | 'Maintenance';

interface Service {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly state: ServiceState;
  readonly availability: string;
  readonly latency: string;
  readonly region: string;
  readonly version: string;
  readonly instances: string;
  readonly lastDeploy: string;
  readonly trend: readonly number[];
  readonly checks: readonly { readonly name: string; readonly value: string; readonly state: ServiceState }[];
}

const services: readonly Service[] = [
  {
    id: 'web', name: 'Web application', description: 'Next.js presentation and authentication edge', state: 'Operational', availability: '99.99%', latency: '38 ms', region: 'eu-west', version: '2026.09.25', instances: '2 / 2 healthy', lastDeploy: '42 min ago', trend: [34, 38, 35, 41, 37, 36, 39, 42, 38, 35, 37, 38],
    checks: [{ name: 'HTTP readiness', value: '200 OK', state: 'Operational' }, { name: 'Authentication route', value: '42 ms', state: 'Operational' }, { name: 'Static assets', value: '100% served', state: 'Operational' }],
  },
  {
    id: 'api', name: 'Platform API', description: 'NestJS domain and application services', state: 'Operational', availability: '99.98%', latency: '61 ms', region: 'eu-west', version: '2026.09.25', instances: '2 / 2 healthy', lastDeploy: '42 min ago', trend: [52, 57, 68, 61, 58, 63, 71, 64, 59, 62, 58, 61],
    checks: [{ name: 'Readiness endpoint', value: 'Ready', state: 'Operational' }, { name: 'Database access', value: '12 ms', state: 'Operational' }, { name: 'Request queue', value: '0 waiting', state: 'Operational' }],
  },
  {
    id: 'identity', name: 'Identity provider', description: 'Keycloak authentication and authorization', state: 'Operational', availability: '99.97%', latency: '94 ms', region: 'external', version: '26.3', instances: '1 endpoint', lastDeploy: 'Managed externally', trend: [86, 91, 102, 96, 89, 93, 98, 107, 95, 90, 92, 94],
    checks: [{ name: 'OIDC discovery', value: 'Available', state: 'Operational' }, { name: 'JWKS endpoint', value: '84 ms', state: 'Operational' }, { name: 'Token validation', value: 'Passing', state: 'Operational' }],
  },
  {
    id: 'database', name: 'PostgreSQL', description: 'Primary relational persistence layer', state: 'Operational', availability: '100%', latency: '12 ms', region: 'local', version: '16.4', instances: 'Primary online', lastDeploy: '7 days ago', trend: [11, 13, 12, 14, 11, 12, 12, 13, 11, 12, 13, 12],
    checks: [{ name: 'Connection', value: 'Connected', state: 'Operational' }, { name: 'Pool utilization', value: '4 / 10', state: 'Operational' }, { name: 'Migration status', value: 'Up to date', state: 'Operational' }],
  },
  {
    id: 'archive', name: 'Archive storage', description: 'Rules packages and immutable snapshots', state: 'Degraded', availability: '99.91%', latency: '184 ms', region: 'local', version: 'Filesystem', instances: '1 volume', lastDeploy: 'Not applicable', trend: [81, 92, 97, 110, 105, 124, 131, 143, 152, 167, 176, 184],
    checks: [{ name: 'Read access', value: 'Available', state: 'Operational' }, { name: 'Write latency', value: '184 ms', state: 'Degraded' }, { name: 'Free capacity', value: '31%', state: 'Degraded' }],
  },
  {
    id: 'audit', name: 'Audit pipeline', description: 'Trace ingestion and evidence integrity', state: 'Operational', availability: '99.99%', latency: '18 ms', region: 'local', version: 'v1', instances: '1 consumer', lastDeploy: '42 min ago', trend: [16, 18, 17, 19, 18, 17, 20, 18, 17, 18, 19, 18],
    checks: [{ name: 'Event ingestion', value: '842/min', state: 'Operational' }, { name: 'Evidence hashing', value: 'Verified', state: 'Operational' }, { name: 'Queue lag', value: '< 1 sec', state: 'Operational' }],
  },
];

const incidents = [
  { time: 'Today · 13:58', title: 'Archive write latency elevated', detail: 'Mitigation active · No data loss', status: 'Monitoring', tone: 'Warning' },
  { time: '24 Sep · 21:35', title: 'Identity callback verification failures', detail: 'Resolved in 11 minutes · Configuration corrected', status: 'Resolved', tone: 'Success' },
  { time: '22 Sep · 08:14', title: 'Database pool pressure', detail: 'Resolved automatically in 2 minutes', status: 'Resolved', tone: 'Success' },
] as const;

const capacities = [
  { name: 'CPU', value: 23, detail: '1.8 / 8 cores', tone: 'Green' },
  { name: 'Memory', value: 41, detail: '6.6 / 16 GB', tone: 'Cyan' },
  { name: 'Storage', value: 69, detail: '32.7 / 47.4 GB', tone: 'Amber' },
  { name: 'Database pool', value: 40, detail: '4 / 10 connections', tone: 'Green' },
] as const;

function LatencyChart({ values, state }: { readonly values: readonly number[]; readonly state: ServiceState }) {
  const width = 240;
  const height = 70;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * width},${height - ((value - min) / range) * 48 - 10}`).join(' ');
  return (
    <svg className={styles.latencyChart} viewBox={`0 0 ${width} ${height}`} aria-label="Service latency trend">
      <line x1="0" y1="60" x2={width} y2="60" />
      <polyline points={points} data-state={state} />
    </svg>
  );
}

function StatusIcon({ kind }: { readonly kind: 'uptime' | 'latency' | 'requests' | 'incidents' }) {
  const paths = {
    uptime: 'm4 12 5 5L20 6',
    latency: 'M4 14h3l2-5 3 9 2-6 2 2h4',
    requests: 'M5 5h14v14H5zm3 4h8m-8 4h5',
    incidents: 'M12 3 3 20h18zm0 6v4m0 3v1',
  } as const;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[kind]} /></svg>;
}

export function PlatformStatusFeature() {
  const [selectedId, setSelectedId] = useState('archive');
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState('14:35:22 UTC');
  const selected = services.find((service) => service.id === selectedId) ?? services[0];

  function runHealthCheck(): void {
    setChecking(true);
    window.setTimeout(() => {
      setChecking(false);
      setLastChecked(`${new Date().toISOString().slice(11, 19)} UTC`);
    }, 900);
  }

  return (
    <div className={styles.statusPage}>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.headerMeta}><span>Reliability command center</span><span className={styles.demoBadge}>Demo dataset</span></div>
          <h1>System health &amp; status</h1>
          <p>Availability, dependencies, service levels, and infrastructure capacity across Mercure.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.lastCheck}>Last checked <strong>{lastChecked}</strong></span>
          <select className={styles.rangeSelect} aria-label="Status time range" defaultValue="24h"><option value="1h">Last hour</option><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option></select>
          <button type="button" className={styles.checkButton} onClick={runHealthCheck} disabled={checking}><span className={checking ? styles.spinner : undefined}>↻</span>{checking ? 'Checking…' : 'Run health check'}</button>
        </div>
      </header>

      <section className={styles.banner}>
        <span className={styles.bannerSignal}><i /><i /><i /></span>
        <div><strong>All core systems operational</strong><p>One non-critical storage advisory is being monitored. No customer impact detected.</p></div>
        <span className={styles.uptimeBadge}>99.98% platform uptime</span>
      </section>

      <section className={styles.metrics} aria-label="Reliability summary">
        <article><span className={styles.metricIcon}><StatusIcon kind="uptime" /></span><div><small>30-day availability</small><strong>99.98%</strong><em>Above 99.9% objective</em></div></article>
        <article><span className={`${styles.metricIcon} ${styles.cyanIcon}`}><StatusIcon kind="latency" /></span><div><small>Platform P95 latency</small><strong>84 ms</strong><em>−12 ms from yesterday</em></div></article>
        <article><span className={`${styles.metricIcon} ${styles.blueIcon}`}><StatusIcon kind="requests" /></span><div><small>Requests processed</small><strong>1.84M</strong><em>0.02% error rate</em></div></article>
        <article><span className={`${styles.metricIcon} ${styles.amberIcon}`}><StatusIcon kind="incidents" /></span><div><small>Active advisories</small><strong>1</strong><em className={styles.amberText}>No customer impact</em></div></article>
      </section>

      <section className={styles.mainGrid}>
        <article className={styles.servicesPanel}>
          <div className={styles.panelHeader}><div><span className={styles.eyebrow}>Live dependency map</span><h2>Services &amp; components</h2></div><span className={styles.operationalCount}><i /> 5 operational · 1 advisory</span></div>
          <div className={styles.serviceHeader}><span>Component</span><span>Status</span><span>Availability</span><span>Latency</span><span>Region</span></div>
          <div className={styles.serviceList}>
            {services.map((service) => (
              <button key={service.id} type="button" className={styles.serviceRow} data-selected={selected?.id === service.id || undefined} onClick={() => setSelectedId(service.id)}>
                <span className={styles.serviceName}><i data-state={service.state}>{service.name.slice(0, 1)}</i><span><strong>{service.name}</strong><small>{service.description}</small></span></span>
                <span className={styles.stateBadge} data-state={service.state}>{service.state}</span>
                <strong className={styles.numeric}>{service.availability}</strong>
                <strong className={styles.numeric}>{service.latency}</strong>
                <span className={styles.region}>{service.region}</span>
              </button>
            ))}
          </div>
        </article>

        <aside className={styles.detailPanel}>
          {selected ? <>
            <div className={styles.detailHeader}><div><span className={styles.eyebrow}>Component telemetry</span><h2>{selected.name}</h2></div><span className={styles.stateBadge} data-state={selected.state}>{selected.state}</span></div>
            <div className={styles.detailBody}>
              <div className={styles.latencyHeading}><div><span>Response latency</span><strong>{selected.latency}</strong></div><small>Last 60 minutes</small></div>
              <LatencyChart values={selected.trend} state={selected.state} />
              <div className={styles.serviceFacts}><div><span>Version</span><strong>{selected.version}</strong></div><div><span>Instances</span><strong>{selected.instances}</strong></div><div><span>Region</span><strong>{selected.region}</strong></div><div><span>Last deploy</span><strong>{selected.lastDeploy}</strong></div></div>
              <div className={styles.checks}><div className={styles.subheading}><span>Health checks</span><small>{selected.checks.length} checks</small></div>{selected.checks.map((check) => <div key={check.name}><span><i data-state={check.state} />{check.name}</span><strong>{check.value}</strong></div>)}</div>
              <div className={styles.endpoint}><span>Probe endpoint</span><code>/api/v1/health/ready</code><small>HTTP 200 · checked every 30 seconds</small></div>
            </div>
          </> : null}
        </aside>

        <article className={styles.capacityPanel}>
          <div className={styles.panelHeader}><div><span className={styles.eyebrow}>Host telemetry</span><h2>Infrastructure capacity</h2></div><span className={styles.capacityLabel}>Healthy headroom</span></div>
          <div className={styles.capacityGrid}>{capacities.map((capacity) => <div key={capacity.name} className={styles.capacityItem}><div><span>{capacity.name}</span><strong>{capacity.value}%</strong></div><div className={styles.progress}><i className={styles[`progress${capacity.tone}`]} style={{ width: `${capacity.value}%` }} /></div><small>{capacity.detail}</small></div>)}</div>
        </article>

        <article className={styles.sloPanel}>
          <div className={styles.panelHeader}><div><span className={styles.eyebrow}>Service objectives</span><h2>SLO performance</h2></div><span className={styles.sloPeriod}>Rolling 30 days</span></div>
          <div className={styles.sloRows}>
            <div><span><strong>Availability</strong><small>Target 99.90%</small></span><span className={styles.sloTrack}><i style={{ width: '99.98%' }} /></span><b>99.98%</b></div>
            <div><span><strong>API latency</strong><small>P95 under 250 ms</small></span><span className={styles.sloTrack}><i style={{ width: '83%' }} /></span><b>84 ms</b></div>
            <div><span><strong>Error budget</strong><small>43m 12s remaining</small></span><span className={styles.sloTrack}><i style={{ width: '72%' }} /></span><b>72%</b></div>
          </div>
        </article>

        <article className={styles.incidentPanel}>
          <div className={styles.panelHeader}><div><span className={styles.eyebrow}>Operational history</span><h2>Recent incidents</h2></div><span className={styles.incidentPeriod}>Last 7 days</span></div>
          <div className={styles.incidentList}>{incidents.map((incident) => <div key={incident.title}><span className={styles.incidentDot} data-tone={incident.tone} /><div><strong>{incident.title}</strong><p>{incident.detail}</p><small>{incident.time}</small></div><span className={styles.incidentStatus} data-tone={incident.tone}>{incident.status}</span></div>)}</div>
        </article>
      </section>
    </div>
  );
}
