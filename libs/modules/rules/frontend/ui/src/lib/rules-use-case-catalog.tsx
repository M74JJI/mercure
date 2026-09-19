import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type { RulesUseCasePreviewView } from './models';
import styles from './rules.module.css';

export interface RulesUseCaseCatalogProps {
  readonly useCases: readonly RulesUseCasePreviewView[];
  readonly total: number;
}

export function RulesUseCaseCatalog({ useCases, total }: RulesUseCaseCatalogProps) {
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

      {useCases.length === 0 ? (
        <Panel tone="muted" className={styles.empty}>
          <h2>No use cases available</h2>
          <p>The canonical catalog does not currently contain any readable entries.</p>
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

              <span className={styles.mono}>{useCase.id}</span>
            </Panel>
          ))}
        </section>
      )}
    </div>
  );
}
