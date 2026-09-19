import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type { RulesUseCaseDetailView } from './models';
import styles from './rules.module.css';

export type RulesUseCaseAdminErrorCode =
  | 'validation'
  | 'conflict'
  | 'not-found'
  | 'unavailable';

export type RulesUseCaseAdminField =
  | 'id'
  | 'name'
  | 'shortName'
  | 'description'
  | 'component'
  | 'vendor'
  | 'product'
  | 'domain'
  | 'category';

interface SharedProps {
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly errorCode?: RulesUseCaseAdminErrorCode;
  readonly errorField?: RulesUseCaseAdminField;
}

interface CreateProps extends SharedProps {
  readonly mode: 'create';
}

interface EditProps extends SharedProps {
  readonly mode: 'edit';
  readonly useCase: RulesUseCaseDetailView;
}

export type RulesUseCaseAdministrationFormProps = CreateProps | EditProps;

const fields = [
  ['name', 'Name', 255],
  ['shortName', 'Short name', 120],
  ['component', 'Component', 255],
  ['vendor', 'Vendor', 255],
  ['product', 'Product', 255],
  ['domain', 'Domain', 255],
  ['category', 'Category', 255],
] as const;

function errorMessage(code: RulesUseCaseAdminErrorCode | undefined): string | undefined {
  if (code === 'validation') return 'Check the highlighted field and submit again.';
  if (code === 'conflict') return 'This change conflicts with the current catalog state.';
  if (code === 'not-found') return 'This use case no longer exists.';
  if (code === 'unavailable') return 'The Rules administration API is temporarily unavailable.';
  return undefined;
}

export function RulesUseCaseAdministrationForm(
  props: RulesUseCaseAdministrationFormProps,
) {
  const useCase = props.mode === 'edit' ? props.useCase : undefined;
  const message = errorMessage(props.errorCode);
  const title = props.mode === 'create' ? 'Create custom use case' : 'Edit custom use case';

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules administration"
        title={title}
        description="Manage canonical custom use-case metadata. System entries and immutable historical snapshots cannot be changed here."
        actions={<StatusBadge tone="accent">Admin</StatusBadge>}
      />

      <div className={styles.headerActions}>
        <a className={styles.actionLink} href="/rules/use-cases">
          ← Use-case catalog
        </a>
        {useCase ? (
          <a className={styles.actionLink} href={'/rules/use-cases/' + useCase.id}>
            View details
          </a>
        ) : null}
      </div>

      {message ? (
        <Panel tone="muted" className={styles.formNotice}>
          <strong>{message}</strong>
        </Panel>
      ) : null}

      <Panel tone="raised" className={styles.adminFormPanel}>
        <form action={props.action} className={styles.adminForm}>
          {props.mode === 'create' ? (
            <label>
              <span>Use-case ID</span>
              <input
                name="id"
                required
                maxLength={255}
                pattern="uc_[a-z0-9_]+"
                placeholder="uc_admin_config"
                aria-invalid={props.errorField === 'id' ? true : undefined}
              />
              <small>Stable ID. Lowercase letters, digits, and underscores after uc_.</small>
            </label>
          ) : (
            <div className={styles.readOnlyField}>
              <span>Use-case ID</span>
              <strong className={styles.mono}>{props.useCase.id}</strong>
              <input type="hidden" name="id" value={props.useCase.id} />
            </div>
          )}

          {fields.map(([name, label, maxLength]) => (
            <label key={name}>
              <span>{label}</span>
              <input
                name={name}
                required
                maxLength={maxLength}
                defaultValue={useCase?.[name]}
                aria-invalid={props.errorField === name ? true : undefined}
              />
            </label>
          ))}

          <label className={styles.fullWidthField}>
            <span>Description</span>
            <textarea
              name="description"
              required
              maxLength={4_096}
              rows={7}
              defaultValue={useCase?.description}
              aria-invalid={props.errorField === 'description' ? true : undefined}
            />
          </label>

          <div className={styles.formActions}>
            <a className={styles.actionLink} href={useCase ? '/rules/use-cases/' + useCase.id : '/rules/use-cases'}>
              Cancel
            </a>
            <button type="submit">
              {props.mode === 'create' ? 'Create use case' : 'Save changes'}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
