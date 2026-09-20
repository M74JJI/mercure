import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type {
  RulesDecoderPreviewView,
  RulesIssuePreviewView,
  RulesRulePreviewView,
} from './models';
import styles from './rules.module.css';

interface ExplorerNavigationProps {
  readonly snapshotId: string;
}

function ExplorerNavigation({ snapshotId }: ExplorerNavigationProps) {
  const base = '/rules/' + snapshotId;

  return (
    <div className={styles.headerActions}>
      <a className={styles.actionLink} href={base}>
        ← Snapshot
      </a>
      <a className={styles.actionLink} href={base + '/rules'}>
        Rules
      </a>
      <a className={styles.actionLink} href={base + '/decoders'}>
        Decoders
      </a>
      <a className={styles.actionLink} href={base + '/issues'}>
        Findings
      </a>
    </div>
  );
}

interface PaginationProps {
  readonly previousHref?: string;
  readonly nextHref?: string;
}

function Pagination({ nextHref, previousHref }: PaginationProps) {
  return (
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
  );
}

export interface RulesSnapshotRulesExplorerProps extends PaginationProps {
  readonly snapshotId: string;
  readonly rules: readonly RulesRulePreviewView[];
  readonly total: number;
  readonly selectedTenant?: string;
  readonly selectedSeverity?: 'informational' | 'low' | 'medium' | 'high' | 'critical';
  readonly selectedStatus?: string;
  readonly selectedUseCaseId?: string;
  readonly selectedRuleId?: string;
  readonly selectedJiraVisible?: 'true' | 'false';
}

export function RulesSnapshotRulesExplorer({
  nextHref,
  previousHref,
  rules,
  selectedJiraVisible,
  selectedRuleId,
  selectedSeverity,
  selectedStatus,
  selectedTenant,
  selectedUseCaseId,
  snapshotId,
  total,
}: RulesSnapshotRulesExplorerProps) {
  const path = '/rules/' + snapshotId + '/rules';

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules snapshot"
        title="Rule explorer"
        description="Filter and page through normalized immutable rule records for this snapshot."
        actions={<StatusBadge tone="neutral">{String(total) + ' rules'}</StatusBadge>}
      />

      <ExplorerNavigation snapshotId={snapshotId} />

      <Panel tone="raised" className={styles.compareControls}>
        <form action={path} method="get" className={styles.explorerFilterForm}>
          <label>
            <span>Tenant</span>
            <input name="tenant" defaultValue={selectedTenant} placeholder="All tenants" />
          </label>
          <label>
            <span>Severity</span>
            <select name="severity" defaultValue={selectedSeverity ?? ''}>
              <option value="">All</option>
              <option value="informational">Informational</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <input name="status" defaultValue={selectedStatus} placeholder="All statuses" />
          </label>
          <label>
            <span>Use case</span>
            <input name="useCaseId" defaultValue={selectedUseCaseId} placeholder="uc_..." />
          </label>
          <label>
            <span>Rule ID</span>
            <input name="ruleId" defaultValue={selectedRuleId} placeholder="Exact rule ID" />
          </label>
          <label>
            <span>Jira visibility</span>
            <select name="jiraVisible" defaultValue={selectedJiraVisible ?? ''}>
              <option value="">Either</option>
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
            </select>
          </label>
          <button type="submit">Apply filters</button>
        </form>
      </Panel>

      <Panel tone="raised" className={styles.sectionPanel}>
        {rules.length === 0 ? (
          <p className={styles.emptyInline}>No rules match the selected filters.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Rule</th>
                  <th scope="col">Severity</th>
                  <th scope="col">Status</th>
                  <th scope="col">Tenant</th>
                  <th scope="col">Use case</th>
                  <th scope="col">MITRE</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.tenant + ':' + rule.id}>
                    <td>
                      <strong>{rule.id}</strong>
                      <small>{rule.description}</small>
                    </td>
                    <td>
                      <span>{rule.severity}</span>
                      <small>{'Level ' + rule.level}</small>
                    </td>
                    <td>
                      <span>{rule.status}</span>
                      {rule.jiraVisible ? <small>Jira visible</small> : null}
                    </td>
                    <td>{rule.tenant}</td>
                    <td className={styles.mono}>{rule.useCaseId}</td>
                    <td>{rule.mitre.slice(0, 4).join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Pagination
        {...(previousHref === undefined ? {} : { previousHref })}
        {...(nextHref === undefined ? {} : { nextHref })}
      />
    </div>
  );
}

export interface RulesSnapshotDecodersExplorerProps extends PaginationProps {
  readonly snapshotId: string;
  readonly decoders: readonly RulesDecoderPreviewView[];
  readonly total: number;
  readonly selectedTenant?: string;
  readonly selectedName?: string;
}

export function RulesSnapshotDecodersExplorer({
  decoders,
  nextHref,
  previousHref,
  selectedName,
  selectedTenant,
  snapshotId,
  total,
}: RulesSnapshotDecodersExplorerProps) {
  const path = '/rules/' + snapshotId + '/decoders';

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules snapshot"
        title="Decoder explorer"
        description="Filter and page through normalized immutable decoder records for this snapshot."
        actions={<StatusBadge tone="neutral">{String(total) + ' decoders'}</StatusBadge>}
      />

      <ExplorerNavigation snapshotId={snapshotId} />

      <Panel tone="raised" className={styles.compareControls}>
        <form action={path} method="get" className={styles.explorerFilterForm}>
          <label>
            <span>Tenant</span>
            <input name="tenant" defaultValue={selectedTenant} placeholder="All tenants" />
          </label>
          <label>
            <span>Name</span>
            <input name="name" defaultValue={selectedName} placeholder="Exact decoder name" />
          </label>
          <button type="submit">Apply filters</button>
        </form>
      </Panel>

      <Panel tone="raised" className={styles.sectionPanel}>
        {decoders.length === 0 ? (
          <p className={styles.emptyInline}>No decoders match the selected filters.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Decoder</th>
                  <th scope="col">Parent</th>
                  <th scope="col">Tenant</th>
                  <th scope="col">Source file</th>
                </tr>
              </thead>
              <tbody>
                {decoders.map((decoder) => (
                  <tr key={decoder.tenant + ':' + decoder.name}>
                    <td>
                      <strong>{decoder.name}</strong>
                    </td>
                    <td>{decoder.parent ?? '—'}</td>
                    <td>{decoder.tenant}</td>
                    <td className={styles.mono}>{decoder.sourceFile}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Pagination
        {...(previousHref === undefined ? {} : { previousHref })}
        {...(nextHref === undefined ? {} : { nextHref })}
      />
    </div>
  );
}

export interface RulesSnapshotIssuesExplorerProps extends PaginationProps {
  readonly snapshotId: string;
  readonly issues: readonly RulesIssuePreviewView[];
  readonly total: number;
  readonly selectedSeverity?: 'error' | 'warning' | 'info';
  readonly selectedType?: string;
}

export function RulesSnapshotIssuesExplorer({
  issues,
  nextHref,
  previousHref,
  selectedSeverity,
  selectedType,
  snapshotId,
  total,
}: RulesSnapshotIssuesExplorerProps) {
  const path = '/rules/' + snapshotId + '/issues';

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules snapshot"
        title="Validation findings"
        description="Filter and page through deterministic validation findings for this snapshot."
        actions={<StatusBadge tone="neutral">{String(total) + ' findings'}</StatusBadge>}
      />

      <ExplorerNavigation snapshotId={snapshotId} />

      <Panel tone="raised" className={styles.compareControls}>
        <form action={path} method="get" className={styles.explorerFilterForm}>
          <label>
            <span>Severity</span>
            <select name="severity" defaultValue={selectedSeverity ?? ''}>
              <option value="">All</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </label>
          <label>
            <span>Type</span>
            <input name="type" defaultValue={selectedType} placeholder="Exact finding type" />
          </label>
          <button type="submit">Apply filters</button>
        </form>
      </Panel>

      <Panel tone="raised" className={styles.sectionPanel}>
        {issues.length === 0 ? (
          <p className={styles.emptyInline}>No findings match the selected filters.</p>
        ) : (
          <ul className={styles.issueList}>
            {issues.map((issue, index) => (
              <li key={issue.type + ':' + (issue.ruleId ?? issue.decoderName ?? String(index))}>
                <div className={styles.issueTopline}>
                  <strong>{issue.title}</strong>
                  <StatusBadge tone={issue.severity === 'error' ? 'accent' : 'neutral'}>
                    {issue.severity}
                  </StatusBadge>
                </div>
                <p>{issue.detail}</p>
                <small>
                  {[issue.type, issue.ruleId, issue.decoderName, issue.tenant]
                    .filter(Boolean)
                    .join(' · ')}
                </small>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Pagination
        {...(previousHref === undefined ? {} : { previousHref })}
        {...(nextHref === undefined ? {} : { nextHref })}
      />
    </div>
  );
}
