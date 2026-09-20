import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type {
  RulesUseCaseAdminErrorCode,
  RulesUseCaseAdminField,
} from './rules-use-case-administration-form';
import type { RulesUseCaseDetailView } from './models';
import styles from './rules.module.css';

export interface RulesUseCaseDetailProps {
  readonly useCase: RulesUseCaseDetailView;
  readonly canAdminister: boolean;
  readonly deleteAction?: (formData: FormData) => void | Promise<void>;
  readonly errorCode?: RulesUseCaseAdminErrorCode;
  readonly errorField?: RulesUseCaseAdminField;
}

function mutationErrorMessage(code: RulesUseCaseAdminErrorCode | undefined): string | undefined {
  if (code === 'validation') return 'The administration request was invalid.';
  if (code === 'conflict') return 'The requested change conflicts with the current catalog state.';
  if (code === 'not-found') return 'This use case no longer exists.';
  if (code === 'unavailable') return 'The Rules administration API is temporarily unavailable.';
  if (code === 'protected') return 'System Rules use cases are immutable.';
  if (code === 'confirmation') return 'Type the exact use-case ID to confirm deletion.';
  return undefined;
}

export function RulesUseCaseDetail({
  canAdminister,
  deleteAction,
  errorCode,
  errorField,
  useCase,
}: RulesUseCaseDetailProps) {
  const errorMessage = mutationErrorMessage(errorCode);
  const canMutate = canAdminister && useCase.source === 'custom';

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules use case"
        title={useCase.name}
        description={useCase.description}
        actions={
          <div className={styles.headerActions}>
            {canMutate ? (
              <a className={styles.actionLink} href={'/rules/use-cases/' + useCase.id + '/edit'}>
                Edit
              </a>
            ) : null}
            <StatusBadge tone={useCase.source === 'system' ? 'neutral' : 'accent'}>
              {useCase.source}
            </StatusBadge>
          </div>
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

      {errorMessage ? (
        <Panel tone="muted" className={styles.formNotice}>
          <strong>{errorMessage}</strong>
          {errorField ? <span>{' Field: ' + errorField}</span> : null}
        </Panel>
      ) : null}

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

      {useCase.source === 'system' ? (
        <Panel tone="muted" className={styles.statePanel}>
          <h2>System entry is immutable</h2>
          <p>
            System use cases can be inspected but cannot be edited or deleted through Rules
            administration.
          </p>
        </Panel>
      ) : canMutate && deleteAction ? (
        <Panel tone="raised" className={styles.dangerPanel}>
          <div>
            <p className={styles.eyebrow}>Danger zone</p>
            <h2>Delete custom use case</h2>
          </div>
          <p>
            Historical snapshots remain unchanged. Future imports that still reference this ID may
            surface missing or unassigned use-case findings.
          </p>
          <form action={deleteAction} className={styles.dangerForm}>
            <input type="hidden" name="id" value={useCase.id} />
            <label>
              <span>{'Type ' + useCase.id + ' to confirm'}</span>
              <input
                name="confirmation"
                required
                autoComplete="off"
                aria-invalid={errorField === 'confirmation' ? true : undefined}
              />
            </label>
            <button type="submit">Delete use case</button>
          </form>
        </Panel>
      ) : (
        <Panel tone="muted" className={styles.statePanel}>
          <h2>Read-only catalog entry</h2>
          <p>
            You can inspect this custom use case, but Rules administration requires the admin role
            and the backend `rules:admin` capability.
          </p>
        </Panel>
      )}
    </div>
  );
}
