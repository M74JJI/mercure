import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type { RulesUseCaseDetailView } from './models';
import styles from './rules.module.css';

export interface RulesUseCaseDetailProps {
  readonly useCase: RulesUseCaseDetailView;
}

export function RulesUseCaseDetail({ useCase }: RulesUseCaseDetailProps) {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules use case"
        title={useCase.name}
        description={useCase.description}
        actions={
          <StatusBadge tone={useCase.source === 'system' ? 'neutral' : 'accent'}>
            {useCase.source}
          </StatusBadge>
        }
      />

      <div className={styles.headerActions}>
        <a className={styles.actionLink} href="/rules/use-cases">
          ← Use-case catalog
        </a>
        <a className={styles.actionLink} href="/rules">
          Snapshots
        </a>
      </div>

      <Panel tone="raised" className={styles.useCaseDetail}>
        <div>
          <span>ID</span>
          <strong className={styles.mono}>{useCase.id}</strong>
        </div>
        <div>
          <span>Short name</span>
          <strong>{useCase.shortName}</strong>
        </div>
        <div>
          <span>Component</span>
          <strong>{useCase.component}</strong>
        </div>
        <div>
          <span>Domain</span>
          <strong>{useCase.domain}</strong>
        </div>
        <div>
          <span>Category</span>
          <strong>{useCase.category}</strong>
        </div>
        <div>
          <span>Vendor</span>
          <strong>{useCase.vendor}</strong>
        </div>
        <div>
          <span>Product</span>
          <strong>{useCase.product}</strong>
        </div>
        <div>
          <span>Created by</span>
          <strong>{useCase.createdBy}</strong>
        </div>
        {useCase.createdAt ? (
          <div>
            <span>Created at</span>
            <strong>{useCase.createdAt}</strong>
          </div>
        ) : null}
      </Panel>

      <Panel tone="muted" className={styles.statePanel}>
        <h2>Read-only catalog entry</h2>
        <p>
          This surface exposes canonical use-case metadata only. Editing and deletion are not
          approved by the current Rules administration scope.
        </p>
      </Panel>
    </div>
  );
}
