import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type { RulesUseCasePreviewView } from './models';
import styles from './rules.module.css';

export interface RulesUseCaseCatalogProps {
  readonly useCases: readonly RulesUseCasePreviewView[];
  readonly total: number;
  readonly selectedQuery?: string;
  readonly selectedSource?: 'system' | 'custom';
  readonly previousHref?: string;
  readonly nextHref?: string;
}

export function RulesUseCaseCatalog({
  nextHref,
  previousHref,
  selectedQuery,
  selectedSource,
  total,
  useCases,
}: RulesUseCaseCatalogProps) {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules intelligence"
        title="Use-case catalog"
        description="Read-only canonical use cases used to classify Rules snapshots. System and custom catalog entries are visible here; mutation is intentionally not exposed."
        actions={<StatusBadge tone="neutral">{String(total) + ' use cases'}</StatusBadge>}
      />

      <div className={styles.headerActions}>
        <a className={styles.actionLink} href="/rules">
          ← Snapshots
        </a>
        <a className={styles.actionLink} href="/rules/compare">
          Compare snapshots
        </a>
      </div>

      <Panel tone="raised" className={styles.compareControls}>
        <form action="/rules/use-cases" method="get" className={styles.catalogFilterForm}>
          <label>
            <span>Search</span>
            <input
              name="q"
              defaultValue={selectedQuery}
              placeholder="Name, component, domain, vendor..."
            />
          </label>
          <label>
            <span>Source</span>
            <select name="source" defaultValue={selectedSource ?? ''}>
              <option value="">All</option>
              <option value="system">System</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <button type="submit">Apply filters</button>
        </form>
      </Panel>

      {useCases.length === 0 ? (
        <Panel tone="muted" className={styles.empty}>
          <h2>No use cases available</h2>
          <p>No canonical catalog entries match the selected filters.</p>
        </Panel>
      ) : (
        <section className={styles.useCaseGrid} aria-label="Rules use-case catalog">
          {useCases.map((useCase) => (
            <Panel tone="raised" className={styles.useCaseCard} key={useCase.id}>
              <div className={styles.useCaseCardHeader}>
                <div>
                  <p className={styles.eyebrow}>{useCase.shortName}</p>
                  <h2>{useCase.name}</h2>
                </div>
                <StatusBadge tone={useCase.source === 'system' ? 'neutral' : 'accent'}>
                  {useCase.source}
                </StatusBadge>
              </div>

              <p>{useCase.description}</p>

              <dl className={styles.useCaseMeta}>
                <div>
                  <dt>Component</dt>
                  <dd>{useCase.component}</dd>
                </div>
                <div>
                  <dt>Domain</dt>
                  <dd>{useCase.domain}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{useCase.category}</dd>
                </div>
                <div>
                  <dt>Vendor / product</dt>
                  <dd>
                    {useCase.vendor} / {useCase.product}
                  </dd>
                </div>
              </dl>

              <div className={styles.useCaseCardFooter}>
                <span className={styles.mono}>{useCase.id}</span>
                <a
                  className={styles.actionLink}
                  href={'/rules/use-cases/' + encodeURIComponent(useCase.id)}
                >
                  View details
                </a>
              </div>
            </Panel>
          ))}
        </section>
      )}

      <div className={styles.pagination}>
        {previousHref ? (
          <a className={styles.actionLink} href={previousHref}>
            ← Previous
          </a>
        ) : (
          <span />
        )}
        {nextHref ? (
          <a className={styles.actionLink} href={nextHref}>
            Next →
          </a>
        ) : null}
      </div>
    </div>
  );
}
