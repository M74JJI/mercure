import Link from 'next/link';

import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import styles from './platform-overview-feature.module.css';

const platformSignals = [
  { label: 'Identity', value: 'Keycloak', detail: 'Federated access' },
  { label: 'API boundary', value: 'Protected', detail: 'OIDC enforced' },
  { label: 'Persistence', value: 'PostgreSQL', detail: 'Migration managed' },
] as const;

const modules = [
  {
    name: 'Rules intelligence',
    code: 'RI',
    status: 'Available',
    description: 'Import, normalize, inspect, compare, and govern SIEM rules and decoders.',
    href: '/rules',
  },
  {
    name: 'Inventory',
    code: 'IN',
    status: 'Roadmap',
    description: 'Consolidated infrastructure and security asset visibility.',
    href: null,
  },
  {
    name: 'Storage calculator',
    code: 'SC',
    status: 'Roadmap',
    description: 'Capacity modeling for security data and retention planning.',
    href: null,
  },
  {
    name: 'Client specifics',
    code: 'CS',
    status: 'Roadmap',
    description: 'Operational context, constraints, and deployment knowledge per client.',
    href: null,
  },
  {
    name: 'Analyst toolbox',
    code: 'AT',
    status: 'Roadmap',
    description: 'Focused utilities for repeatable investigation and analysis workflows.',
    href: null,
  },
  {
    name: 'Sandbox',
    code: 'SB',
    status: 'Roadmap',
    description: 'Controlled workspace for safe validation and experimentation.',
    href: null,
  },
  {
    name: 'Client contacts',
    code: 'CC',
    status: 'Roadmap',
    description: 'Structured ownership and escalation contacts at operational reach.',
    href: null,
  },
  {
    name: 'Ticketing',
    code: 'TK',
    status: 'Roadmap',
    description: 'Traceable work intake and security operations coordination.',
    href: null,
  },
  {
    name: 'Anonymizer',
    code: 'AN',
    status: 'Roadmap',
    description: 'Privacy-aware preparation of sensitive operational data.',
    href: null,
  },
] as const;

const foundations = [
  {
    index: '01',
    title: 'Modular by contract',
    detail:
      'Bounded Nx libraries keep product modules independent while sharing platform services.',
  },
  {
    index: '02',
    title: 'Secure by default',
    detail:
      'Keycloak identity, capability enforcement, bounded inputs, and protected operational data.',
  },
  {
    index: '03',
    title: 'Release disciplined',
    detail:
      'Generated API contracts, migration history, deterministic builds, and automated quality gates.',
  },
] as const;

export function PlatformOverviewFeature() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <PageHeader
          eyebrow="Security operations platform"
          title="Operational security, one governed workspace."
          description="Mercure gives security teams a stable platform for specialist tools, shared operational knowledge, and controlled workflows—without turning every module into another isolated application."
          actions={
            <div className={styles.heroActions}>
              <StatusBadge tone="positive">Platform online</StatusBadge>
              <Link href="/rules" className={styles.primaryAction}>
                Open Rules intelligence
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          }
        />

        <div className={styles.signalGrid} aria-label="Platform services">
          {platformSignals.map((signal) => (
            <div key={signal.label} className={styles.signal}>
              <span className={styles.signalDot} aria-hidden="true" />
              <div>
                <small>{signal.label}</small>
                <strong>{signal.value}</strong>
              </div>
              <span>{signal.detail}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.moduleSection} aria-labelledby="module-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.label}>Capability map</p>
            <h2 id="module-heading">A platform designed to grow with operations.</h2>
          </div>
          <p>
            Rules intelligence is live. Every next capability enters through the same security,
            identity, data, and release foundations.
          </p>
        </div>

        <div className={styles.moduleGrid}>
          {modules.map((module) => {
            const content = (
              <>
                <div className={styles.moduleTopline}>
                  <span className={styles.moduleCode}>{module.code}</span>
                  <StatusBadge tone={module.status === 'Available' ? 'positive' : 'neutral'}>
                    {module.status}
                  </StatusBadge>
                </div>
                <div>
                  <h3>{module.name}</h3>
                  <p>{module.description}</p>
                </div>
                <span className={styles.moduleMeta}>
                  {module.href ? 'Enter module →' : 'Planned capability'}
                </span>
              </>
            );

            return module.href ? (
              <Link key={module.name} href={module.href} className={styles.moduleLink}>
                {content}
              </Link>
            ) : (
              <article key={module.name} className={styles.moduleCard}>
                {content}
              </article>
            );
          })}
        </div>
      </section>

      <Panel className={styles.foundation} tone="raised">
        <div className={styles.foundationIntro}>
          <p className={styles.label}>Engineering baseline</p>
          <h2>Built as a platform, not a collection of screens.</h2>
          <p>
            One deployable workspace, explicit module boundaries, and infrastructure that stays
            consistent as the product expands.
          </p>
        </div>
        <div className={styles.foundationList}>
          {foundations.map((foundation) => (
            <article key={foundation.index}>
              <span>{foundation.index}</span>
              <div>
                <h3>{foundation.title}</h3>
                <p>{foundation.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
