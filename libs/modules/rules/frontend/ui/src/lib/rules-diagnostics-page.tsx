import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type { RulesDiagnosticsDetailView } from './models';
import styles from './rules.module.css';

export interface RulesDiagnosticsPageProps {
  readonly snapshotId: string;
  readonly diagnostics: RulesDiagnosticsDetailView;
  readonly previousHref?: string;
  readonly nextHref?: string;
}

export function RulesDiagnosticsPage({
  diagnostics,
  nextHref,
  previousHref,
  snapshotId,
}: RulesDiagnosticsPageProps) {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules intelligence"
        title="Round-trip diagnostics"
        description="Safe structural diagnostics for source sections, commented rules, group flows, and use-case gaps. Raw XML, snippets, reconstructed files, and patch XML are excluded."
        actions={
          <StatusBadge tone="neutral">
            {String(diagnostics.summary.sourceSections) + ' source sections'}
          </StatusBadge>
        }
      />

      <div className={styles.headerActions}>
        <a className={styles.actionLink} href={'/rules/' + snapshotId}>
          ← Snapshot
        </a>
        <a className={styles.actionLink} href={'/rules/' + snapshotId + '/fields'}>
          Fields
        </a>
        <a className={styles.actionLink} href={'/rules/' + snapshotId + '/quality'}>
          Quality
        </a>
        <a className={styles.actionLink} href={'/rules/' + snapshotId + '/graph'}>
          Graph
        </a>
      </div>

      <section className={styles.intelligenceMetrics} aria-label="Round-trip diagnostics summary">
        <Panel tone="muted" className={styles.metric}>
          <strong>{diagnostics.summary.idRangeWarnings}</strong>
          <span>ID range warnings</span>
        </Panel>
        <Panel tone="muted" className={styles.metric}>
          <strong>{diagnostics.summary.commentedRules}</strong>
          <span>Commented rules</span>
        </Panel>
        <Panel tone="muted" className={styles.metric}>
          <strong>{diagnostics.summary.missingGroupProducers}</strong>
          <span>Missing producers</span>
        </Panel>
        <Panel tone="muted" className={styles.metric}>
          <strong>{diagnostics.summary.missingUseCaseSuggestions}</strong>
          <span>Use-case gaps</span>
        </Panel>
      </section>

      <div className={styles.intelligenceGrid}>
        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Source sections</p>
              <h2>Rule-range health</h2>
            </div>
            <span>{diagnostics.sourceSections.total} total</span>
          </div>

          {diagnostics.sourceSections.items.length === 0 ? (
            <p className={styles.emptyInline}>No source-section diagnostics on this page.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Section</th>
                    <th scope="col">Rules</th>
                    <th scope="col">Range</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnostics.sourceSections.items.map((section) => (
                    <tr key={section.key}>
                      <td>
                        <strong>{section.sourceFile}</strong>
                        <small>{section.tenant}</small>
                      </td>
                      <td>{section.ruleCount}</td>
                      <td>
                        {section.minRuleId === undefined || section.maxRuleId === undefined
                          ? '—'
                          : String(section.minRuleId) + '–' + String(section.maxRuleId)}
                      </td>
                      <td>
                        <StatusBadge
                          tone={section.idRangeStatus === 'warning' ? 'accent' : 'neutral'}
                        >
                          {section.idRangeStatus}
                        </StatusBadge>
                        <small>{section.statusSummary}</small>
                      </td>
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
              <p className={styles.eyebrow}>Group flow</p>
              <h2>Producer / consumer integrity</h2>
            </div>
            <span>{diagnostics.groupFlows.total} total</span>
          </div>

          {diagnostics.groupFlows.items.length === 0 ? (
            <p className={styles.emptyInline}>No group-flow diagnostics on this page.</p>
          ) : (
            <ul className={styles.intelligenceList}>
              {diagnostics.groupFlows.items.map((flow) => (
                <li key={flow.tenant + ':' + flow.group}>
                  <div>
                    <strong>{flow.group}</strong>
                    <small>{flow.tenant}</small>
                  </div>
                  <div className={styles.intelligenceListMeta}>
                    <StatusBadge tone={flow.status === 'active' ? 'positive' : 'accent'}>
                      {flow.status.replace('_', ' ')}
                    </StatusBadge>
                    <span>
                      {flow.producedByRules.length} producers · {flow.consumedByRules.length} consumers
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Commented rules</p>
              <h2>Detected rule metadata</h2>
            </div>
            <span>{diagnostics.commentedRules.total} total</span>
          </div>

          {diagnostics.commentedRules.items.length === 0 ? (
            <p className={styles.emptyInline}>No commented rules on this page.</p>
          ) : (
            <ul className={styles.intelligenceList}>
              {diagnostics.commentedRules.items.map((rule) => (
                <li key={rule.tenant + ':' + rule.fileName + ':' + rule.ruleId}>
                  <div>
                    <strong>{rule.ruleId}</strong>
                    <small>
                      {rule.tenant} · {rule.fileName}
                    </small>
                  </div>
                  <div className={styles.intelligenceListMeta}>
                    <span>{rule.level ? 'Level ' + rule.level : 'Level unknown'}</span>
                    <span>{rule.description ?? 'No description metadata'}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Use-case gaps</p>
              <h2>Safe metadata suggestions</h2>
            </div>
            <span>{diagnostics.missingUseCaseSuggestions.total} total</span>
          </div>

          {diagnostics.missingUseCaseSuggestions.items.length === 0 ? (
            <p className={styles.emptyInline}>No use-case suggestions on this page.</p>
          ) : (
            <ul className={styles.intelligenceList}>
              {diagnostics.missingUseCaseSuggestions.items.map((suggestion) => (
                <li key={suggestion.tenant + ':' + suggestion.ruleId}>
                  <div>
                    <strong>{suggestion.ruleId}</strong>
                    <small>
                      {suggestion.tenant} · {suggestion.sourceFile}
                    </small>
                  </div>
                  <div className={styles.intelligenceListMeta}>
                    <span>{suggestion.useCaseId}</span>
                    <StatusBadge tone="neutral">{suggestion.confidence}</StatusBadge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

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
