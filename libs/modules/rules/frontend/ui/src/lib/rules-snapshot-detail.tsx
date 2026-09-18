import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type {
  RulesDecoderPreviewView,
  RulesIssuePreviewView,
  RulesRulePreviewView,
  RulesSnapshotSummaryView,
} from './models';
import styles from './rules.module.css';

export interface RulesSnapshotDetailProps {
  readonly snapshot: RulesSnapshotSummaryView;
  readonly rules: readonly RulesRulePreviewView[];
  readonly rulesTotal: number;
  readonly decoders: readonly RulesDecoderPreviewView[];
  readonly decodersTotal: number;
  readonly issues: readonly RulesIssuePreviewView[];
  readonly issuesTotal: number;
}

const dateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function Metric({ label, value }: { readonly label: string; readonly value: string | number }) {
  return (
    <Panel tone="muted" className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </Panel>
  );
}

export function RulesSnapshotDetail({
  decoders,
  decodersTotal,
  issues,
  issuesTotal,
  rules,
  rulesTotal,
  snapshot,
}: RulesSnapshotDetailProps) {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules snapshot"
        title={`Configuration captured ${formatDate(snapshot.createdAt)} UTC`}
        description="Read-only normalized inspection of the imported configuration. Raw XML and server filesystem paths are intentionally not exposed here."
        actions={
          <StatusBadge tone={snapshot.complete ? 'positive' : 'accent'}>
            {snapshot.complete ? 'Complete' : 'Partial'}
          </StatusBadge>
        }
      />

      <a className={styles.backLink} href="/rules">
        ← All snapshots
      </a>

      <section className={styles.metricGrid} aria-label="Snapshot statistics">
        <Metric label="Rules" value={snapshot.ruleCount} />
        <Metric label="Decoders" value={snapshot.decoderCount} />
        <Metric label="Use cases" value={snapshot.useCaseCount} />
        <Metric label="Critical" value={snapshot.criticalCount} />
        <Metric label="MITRE mapped" value={snapshot.mitreMappedCount} />
        <Metric label="Jira visible" value={snapshot.jiraVisibleCount} />
        <Metric label="Missing use case" value={snapshot.missingUseCaseCount} />
        <Metric label="Broken dependencies" value={snapshot.brokenDependencyCount} />
      </section>

      <section className={styles.detailGrid}>
        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Rules</p>
              <h2>Normalized detections</h2>
            </div>
            <span>{rulesTotal} total</span>
          </div>

          {rules.length === 0 ? (
            <p className={styles.emptyInline}>No rules in this snapshot.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Rule</th>
                    <th scope="col">Level</th>
                    <th scope="col">Status</th>
                    <th scope="col">Tenant</th>
                    <th scope="col">MITRE</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={`${rule.tenant}:${rule.id}`}>
                      <td>
                        <strong>{rule.id}</strong>
                        <small>{rule.description}</small>
                      </td>
                      <td>{rule.level}</td>
                      <td>
                        <span>{rule.status}</span>
                        {rule.jiraVisible ? <small>Jira visible</small> : null}
                      </td>
                      <td>{rule.tenant}</td>
                      <td>{rule.mitre.slice(0, 3).join(', ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Validation</p>
              <h2>Issues</h2>
            </div>
            <span>{issuesTotal} total</span>
          </div>

          {issues.length === 0 ? (
            <p className={styles.emptyInline}>No validation issues in this snapshot.</p>
          ) : (
            <ul className={styles.issueList}>
              {issues.map((issue, index) => (
                <li key={`${issue.type}:${issue.ruleId ?? issue.decoderName ?? index}`}>
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

        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Decoders</p>
              <h2>Normalized decoder inventory</h2>
            </div>
            <span>{decodersTotal} total</span>
          </div>

          {decoders.length === 0 ? (
            <p className={styles.emptyInline}>No decoders in this snapshot.</p>
          ) : (
            <ul className={styles.decoderList}>
              {decoders.map((decoder) => (
                <li key={`${decoder.tenant}:${decoder.name}`}>
                  <div>
                    <strong>{decoder.name}</strong>
                    <small>{decoder.tenant}</small>
                  </div>
                  <div>
                    <span>{decoder.parent ? `Parent: ${decoder.parent}` : 'No parent'}</span>
                    <small>{decoder.sourceFile}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <Panel tone="muted" className={styles.provenance}>
        <div>
          <span>Loaded</span>
          <strong>{formatDate(snapshot.loadedAt)} UTC</strong>
        </div>
        <div>
          <span>Archives</span>
          <strong>{snapshot.archiveCount}</strong>
        </div>
        <div>
          <span>Files</span>
          <strong>{snapshot.fileCount}</strong>
        </div>
        <div>
          <span>Source errors</span>
          <strong>{snapshot.sourceErrorCount}</strong>
        </div>
        <div>
          <span>Snapshot ID</span>
          <strong className={styles.mono}>{snapshot.id}</strong>
        </div>
      </Panel>
    </div>
  );
}
