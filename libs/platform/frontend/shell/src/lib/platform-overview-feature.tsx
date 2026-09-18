import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import styles from './platform-overview-feature.module.css';

const foundations = [
  {
    label: 'Frontend',
    value: 'One Next.js deployable',
    detail: 'Composition stays in apps/web; feature implementation belongs to Nx libraries.',
    badge: 'Ready',
  },
  {
    label: 'Backend',
    value: 'One NestJS API',
    detail: 'Server behavior, persistence, imports, and external integrations stay behind NestJS.',
    badge: 'Ready',
  },
  {
    label: 'Persistence',
    value: 'PostgreSQL + Prisma',
    detail: 'Canonical persistence with migration validation and database-aware readiness.',
    badge: 'Ready',
  },
  {
    label: 'API contract',
    value: 'OpenAPI generated types',
    detail: 'Frontend request and response types are derived from the backend contract.',
    badge: 'Contract',
  },
] as const;

export function PlatformOverviewFeature() {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Platform foundation"
        title="Security engineering, composed cleanly."
        description="Mercure is ready for bounded product modules. The platform shell, backend runtime, persistence layer, and contract boundaries are established before feature migration begins."
        actions={<StatusBadge tone="positive">Foundation ready</StatusBadge>}
      />

      <section className={styles.grid} aria-label="Platform foundation status">
        {foundations.map((foundation) => (
          <Panel key={foundation.label} className={styles.card} tone="muted">
            <div className={styles.cardTopline}>
              <p className={styles.label}>{foundation.label}</p>
              <StatusBadge tone={foundation.badge === 'Contract' ? 'accent' : 'positive'}>
                {foundation.badge}
              </StatusBadge>
            </div>
            <h2>{foundation.value}</h2>
            <p>{foundation.detail}</p>
          </Panel>
        ))}
      </section>

      <Panel className={styles.next} tone="raised">
        <div>
          <p className={styles.label}>Next boundary</p>
          <h2>Product modules plug into the platform. They do not redefine it.</h2>
        </div>
        <p>
          Rules will arrive as a peer module under <code>libs/modules/rules</code>. Incidents,
          assets, vulnerabilities, threat intelligence, and future capabilities follow the same
          dependency laws.
        </p>
      </Panel>
    </div>
  );
}
