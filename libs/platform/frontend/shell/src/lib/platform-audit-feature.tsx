'use client';

import { useMemo, useState } from 'react';

import styles from './platform-audit-feature.module.css';

type Severity = 'Critical' | 'Warning' | 'Info' | 'Success';
type EventStatus = 'Open' | 'Investigating' | 'Resolved' | 'Observed';

interface AuditEvent {
  readonly id: string;
  readonly time: string;
  readonly timestamp: string;
  readonly title: string;
  readonly summary: string;
  readonly severity: Severity;
  readonly status: EventStatus;
  readonly actor: string;
  readonly actorType: string;
  readonly source: string;
  readonly environment: string;
  readonly requestId: string;
  readonly ip: string;
  readonly duration: string;
  readonly resource: string;
  readonly action: string;
  readonly result: string;
  readonly payload: string;
}

const events: readonly AuditEvent[] = [
  {
    id: 'AUD-20984',
    time: '14:32:18',
    timestamp: '25 Sep 2026 · 14:32:18.481 UTC',
    title: 'Rules package approval failed',
    summary: 'Policy validation rejected two unresolved decoder dependencies.',
    severity: 'Critical',
    status: 'Investigating',
    actor: 'Mohamed Hajji',
    actorType: 'Administrator',
    source: 'Rules API',
    environment: 'Production',
    requestId: 'req_01K5ZF8W7HV3M6B9Q2TK',
    ip: '10.30.15.10',
    duration: '842 ms',
    resource: 'draft/ruleset-2026-09-25',
    action: 'rules.draft.approve',
    result: 'HTTP 422 · POLICY_VALIDATION_FAILED',
    payload: '{ "draftId": "ruleset-2026-09-25", "unresolvedDependencies": 2, "policy": "controlled-authoring-v3" }',
  },
  {
    id: 'AUD-20983',
    time: '14:28:03',
    timestamp: '25 Sep 2026 · 14:28:03.072 UTC',
    title: 'Keycloak role mapping synchronized',
    summary: 'Application authorities refreshed for the active identity session.',
    severity: 'Success',
    status: 'Resolved',
    actor: 'identity-service',
    actorType: 'System service',
    source: 'Identity',
    environment: 'Production',
    requestId: 'req_01K5ZF12AV8R18BXC71Q',
    ip: '10.30.31.30',
    duration: '116 ms',
    resource: 'session/current',
    action: 'identity.authorities.refresh',
    result: 'HTTP 200 · SYNCHRONIZED',
    payload: '{ "client": "mrc-soc-dashboard", "roles": ["SiemUsers"], "changed": false }',
  },
  {
    id: 'AUD-20982',
    time: '14:20:41',
    timestamp: '25 Sep 2026 · 14:20:41.918 UTC',
    title: 'Elevated API response latency',
    summary: 'Snapshot comparison exceeded the 1.5 second performance threshold.',
    severity: 'Warning',
    status: 'Open',
    actor: 'performance-monitor',
    actorType: 'System service',
    source: 'Platform API',
    environment: 'Production',
    requestId: 'req_01K5ZEP9FSWVKTKNY84H',
    ip: '127.0.0.1',
    duration: '1,864 ms',
    resource: 'rules/intelligence/compare',
    action: 'http.performance.threshold',
    result: 'SLO WARNING · P95 BREACH',
    payload: '{ "thresholdMs": 1500, "observedMs": 1864, "databaseMs": 1211, "sampleWindow": "5m" }',
  },
  {
    id: 'AUD-20981',
    time: '14:12:09',
    timestamp: '25 Sep 2026 · 14:12:09.335 UTC',
    title: 'Configuration snapshot imported',
    summary: 'Wazuh manager archive verified and committed as a new immutable snapshot.',
    severity: 'Info',
    status: 'Observed',
    actor: 'Mohamed Hajji',
    actorType: 'Administrator',
    source: 'Rules ingestion',
    environment: 'Staging',
    requestId: 'req_01K5ZE8JTMMN440YEVB2',
    ip: '10.30.15.10',
    duration: '4.82 s',
    resource: 'snapshot/snp_8472',
    action: 'rules.snapshot.import',
    result: 'HTTP 201 · CREATED',
    payload: '{ "snapshotId": "snp_8472", "files": 384, "rules": 2918, "checksum": "sha256:9a73…d84f" }',
  },
  {
    id: 'AUD-20980',
    time: '13:58:52',
    timestamp: '25 Sep 2026 · 13:58:52.140 UTC',
    title: 'Database connection pool pressure',
    summary: 'Pool utilization reached 80%; no requests were rejected.',
    severity: 'Warning',
    status: 'Resolved',
    actor: 'database-monitor',
    actorType: 'System service',
    source: 'PostgreSQL',
    environment: 'Production',
    requestId: 'trace_01K5ZDN1K40ZP5D1W0FQ',
    ip: '127.0.0.1',
    duration: '2m 14s',
    resource: 'pool/mercure-primary',
    action: 'database.pool.threshold',
    result: 'RECOVERED · 4/10 CONNECTIONS',
    payload: '{ "peak": 8, "maximum": 10, "waiting": 0, "recoverySeconds": 134 }',
  },
  {
    id: 'AUD-20979',
    time: '13:44:17',
    timestamp: '25 Sep 2026 · 13:44:17.603 UTC',
    title: 'Administrative export completed',
    summary: 'Approved detection package exported with complete integrity manifest.',
    severity: 'Success',
    status: 'Resolved',
    actor: 'Mohamed Hajji',
    actorType: 'Administrator',
    source: 'Rules API',
    environment: 'Production',
    requestId: 'req_01K5ZCV4Y5E1MB6D4K71',
    ip: '10.30.15.10',
    duration: '629 ms',
    resource: 'draft/drf_109/export',
    action: 'rules.draft.export',
    result: 'HTTP 200 · EXPORTED',
    payload: '{ "draftId": "drf_109", "format": "zip", "signed": true, "sizeBytes": 1842031 }',
  },
];

const traceSteps = [
  { label: 'Edge request accepted', detail: 'nginx · TLS 1.3 · 8 ms', tone: 'Success' },
  { label: 'Identity verified', detail: 'Keycloak JWT · SiemAdmins · 14 ms', tone: 'Success' },
  { label: 'Approval policy evaluated', detail: 'controlled-authoring-v3 · 603 ms', tone: 'Warning' },
  { label: 'Dependency guard rejected', detail: '2 unresolved references · 217 ms', tone: 'Critical' },
] as const;

function MetricIcon({ kind }: { readonly kind: 'events' | 'errors' | 'coverage' | 'latency' }) {
  const paths = {
    events: 'M5 4h14v16H5zm3 4h8M8 12h8M8 16h5',
    errors: 'M12 3 2.8 19h18.4zm0 5v5m0 3v.5',
    coverage: 'm4 12 5 5L20 6',
    latency: 'M12 3a9 9 0 1 0 9 9M12 7v5l3 2',
  } as const;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[kind]} />
    </svg>
  );
}

export function PlatformAuditFeature() {
  const [severity, setSeverity] = useState<'All' | Severity>('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(events[0]?.id ?? '');

  const filteredEvents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesSeverity = severity === 'All' || event.severity === severity;
      const matchesQuery =
        !normalized ||
        [event.id, event.title, event.summary, event.actor, event.source, event.requestId].some(
          (value) => value.toLowerCase().includes(normalized),
        );
      return matchesSeverity && matchesQuery;
    });
  }, [query, severity]);

  const selected =
    filteredEvents.find((event) => event.id === selectedId) ?? filteredEvents[0] ?? events[0];

  function exportEvidence(): void {
    const columns = ['ID', 'Timestamp', 'Severity', 'Status', 'Event', 'Actor', 'Source', 'Environment', 'Request ID', 'Action', 'Result'];
    const rows = filteredEvents.map((event) => [
      event.id,
      event.timestamp,
      event.severity,
      event.status,
      event.title,
      event.actor,
      event.source,
      event.environment,
      event.requestId,
      event.action,
      event.result,
    ]);
    const csv = [columns, ...rows]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `mercure-audit-evidence-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.audit}>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.headerMeta}>
            <span>Platform observability</span>
            <span className={styles.demoBadge}>Demo dataset</span>
          </div>
          <h1>Audit &amp; traceability</h1>
          <p>Understand every platform action, warning, error, and system decision from one view.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.liveStatus}><i /> Collection healthy</span>
          <select className={styles.secondaryButton} aria-label="Audit time range" defaultValue="24h">
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
          <button type="button" className={styles.primaryButton} onClick={exportEvidence}>Export evidence</button>
        </div>
      </header>

      <section className={styles.metrics} aria-label="Audit health summary">
        <article><span className={styles.metricIcon}><MetricIcon kind="events" /></span><div><small>Events captured</small><strong>18,429</strong><em>+8.4% vs yesterday</em></div><b className={styles.sparkGreen}>⌁</b></article>
        <article><span className={`${styles.metricIcon} ${styles.redIcon}`}><MetricIcon kind="errors" /></span><div><small>Critical events</small><strong>3</strong><em className={styles.redText}>1 requires action</em></div><b className={styles.sparkRed}>⌁</b></article>
        <article><span className={`${styles.metricIcon} ${styles.cyanIcon}`}><MetricIcon kind="coverage" /></span><div><small>Trace coverage</small><strong>99.98%</strong><em>All services reporting</em></div><b className={styles.sparkCyan}>⌁</b></article>
        <article><span className={`${styles.metricIcon} ${styles.amberIcon}`}><MetricIcon kind="latency" /></span><div><small>P95 processing</small><strong>184ms</strong><em className={styles.amberText}>Target &lt; 250ms</em></div><b className={styles.sparkAmber}>⌁</b></article>
      </section>

      <section className={styles.healthStrip} aria-label="Component status">
        <div><span>Service health</span><strong><i /> 6 / 6 operational</strong></div>
        {[
          ['Web', '38ms'], ['API', '61ms'], ['Identity', '94ms'], ['Database', '12ms'], ['Workers', '24ms'], ['Audit sink', '18ms'],
        ].map(([name, latency]) => <div key={name} className={styles.service}><i /><span>{name}</span><small>{latency}</small></div>)}
      </section>

      <section className={styles.workspace}>
        <article className={styles.eventPanel}>
          <div className={styles.panelHeading}>
            <div><span className={styles.eyebrow}>Immutable activity stream</span><h2>Platform events</h2></div>
            <span className={styles.eventCount}>{filteredEvents.length} shown</span>
          </div>
          <div className={styles.filters}>
            <label className={styles.searchBox}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 20-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" /></svg>
              <span className={styles.srOnly}>Search audit events</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ID, actor, source or request…" />
            </label>
            <div className={styles.severityFilters} aria-label="Filter by severity">
              {(['All', 'Critical', 'Warning', 'Info', 'Success'] as const).map((item) => (
                <button key={item} type="button" data-active={severity === item || undefined} onClick={() => setSeverity(item)}>{item}</button>
              ))}
            </div>
          </div>
          <div className={styles.tableHeader}><span>Time / ID</span><span>Event</span><span>Source</span><span>Actor</span><span>Status</span></div>
          <div className={styles.eventList}>
            {filteredEvents.map((event) => (
              <button key={event.id} type="button" className={styles.eventRow} data-selected={selected?.id === event.id || undefined} onClick={() => setSelectedId(event.id)}>
                <span className={styles.eventTime}><strong>{event.time}</strong><small>{event.id}</small></span>
                <span className={styles.eventName}><i data-severity={event.severity} /><span><strong>{event.title}</strong><small>{event.summary}</small></span></span>
                <span className={styles.source}><strong>{event.source}</strong><small>{event.environment}</small></span>
                <span className={styles.actor}><strong>{event.actor}</strong><small>{event.actorType}</small></span>
                <span className={styles.status} data-status={event.status}>{event.status}</span>
              </button>
            ))}
            {filteredEvents.length === 0 ? <div className={styles.emptyState}>No audit events match this investigation filter.</div> : null}
          </div>
        </article>

        <aside className={styles.detailPanel}>
          {selected ? (
            <>
              <div className={styles.detailHeader}>
                <div><span className={styles.eyebrow}>Investigation detail</span><h2>{selected.id}</h2></div>
                <span className={styles.severityBadge} data-severity={selected.severity}>{selected.severity}</span>
              </div>
              <div className={styles.detailBody}>
                <div className={styles.eventTitle}><span className={styles.largeSignal} data-severity={selected.severity}>!</span><div><h3>{selected.title}</h3><p>{selected.summary}</p></div></div>
                <dl className={styles.metadata}>
                  <div><dt>Timestamp</dt><dd>{selected.timestamp}</dd></div>
                  <div><dt>Actor</dt><dd>{selected.actor}<small>{selected.actorType}</small></dd></div>
                  <div><dt>Source</dt><dd>{selected.source}<small>{selected.environment}</small></dd></div>
                  <div><dt>Origin IP</dt><dd className={styles.mono}>{selected.ip}</dd></div>
                  <div><dt>Action</dt><dd className={styles.mono}>{selected.action}</dd></div>
                  <div><dt>Duration</dt><dd>{selected.duration}</dd></div>
                </dl>
                <div className={styles.traceBlock}>
                  <div className={styles.subheading}><span>Correlated trace</span><small>4 spans · {selected.duration}</small></div>
                  <div className={styles.traceSteps}>
                    {traceSteps.map((step, index) => <div key={step.label}><span data-tone={step.tone}>{index + 1}</span><div><strong>{step.label}</strong><small>{step.detail}</small></div></div>)}
                  </div>
                </div>
                <div className={styles.resultBlock}><span>Outcome</span><strong>{selected.result}</strong><small>Resource · {selected.resource}</small></div>
                <div className={styles.payloadBlock}><div className={styles.subheading}><span>Structured context</span><small>JSON</small></div><code>{selected.payload}</code></div>
                <div className={styles.integrity}><span>✓</span><div><strong>Evidence integrity verified</strong><small>Request ID · {selected.requestId}</small></div></div>
              </div>
            </>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
