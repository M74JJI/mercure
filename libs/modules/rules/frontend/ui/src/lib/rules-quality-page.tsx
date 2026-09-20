import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type { RulesQualityDetailView } from './models';
import styles from './rules.module.css';

export interface RulesQualityPageProps {
  readonly snapshotId: string;
  readonly quality: RulesQualityDetailView;
  readonly selectedKind: RulesQualityDetailView['kind'];
  readonly selectedQuery?: string;
  readonly selectedTenant?: string;
  readonly selectedGrade?: string;
  readonly selectedUseCaseId?: string;
  readonly previousHref?: string;
  readonly nextHref?: string;
}

function toneForGrade(grade: string): 'positive' | 'accent' | 'neutral' {
  if (grade === 'excellent' || grade === 'good') return 'positive';
  if (grade === 'risky' || grade === 'broken') return 'accent';
  return 'neutral';
}

export function RulesQualityPage({
  nextHref,
  previousHref,
  quality,
  selectedGrade,
  selectedKind,
  selectedQuery,
  selectedTenant,
  selectedUseCaseId,
  snapshotId,
}: RulesQualityPageProps) {
  const rulePage = quality.rules;
  const useCasePage = quality.useCases;
  const currentOffset = rulePage?.offset ?? useCasePage?.offset ?? 0;
  const currentItems = rulePage?.items.length ?? useCasePage?.items.length ?? 0;
  const currentTotal = rulePage?.total ?? useCasePage?.total ?? 0;

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules intelligence"
        title="Quality scoring"
        description="Deterministic scoring of rule quality, noise control, decoder confidence, dependency health, MITRE quality, Jira readiness, QA readiness, and client readiness."
        actions={<StatusBadge tone="neutral">{String(currentTotal) + ' matched'}</StatusBadge>}
      />

      <div className={styles.headerActions}>
        <a className={styles.actionLink} href={'/rules/' + snapshotId}>
          ← Snapshot
        </a>
        <a className={styles.actionLink} href={'/rules/' + snapshotId + '/fields'}>
          Fields
        </a>
        <a className={styles.actionLink} href={'/rules/' + snapshotId + '/graph'}>
          Graph
        </a>
        <a className={styles.actionLink} href={'/rules/' + snapshotId + '/diagnostics'}>
          Diagnostics
        </a>
      </div>

      <section className={styles.intelligenceMetrics} aria-label="Quality summary">
        <Panel tone="muted" className={styles.metric}>
          <strong>{quality.stats.averageOverall}</strong>
          <span>Average score</span>
        </Panel>
        <Panel tone="muted" className={styles.metric}>
          <strong>{quality.stats.broken}</strong>
          <span>Broken</span>
        </Panel>
        <Panel tone="muted" className={styles.metric}>
          <strong>{quality.stats.risky}</strong>
          <span>Risky</span>
        </Panel>
        <Panel tone="muted" className={styles.metric}>
          <strong>{quality.stats.jiraReady}</strong>
          <span>Jira ready</span>
        </Panel>
      </section>

      <Panel tone="raised" className={styles.compareControls}>
        <form
          action={'/rules/' + snapshotId + '/quality'}
          method="get"
          className={styles.filterForm}
        >
          <label>
            <span>Mode</span>
            <select name="kind" defaultValue={selectedKind}>
              <option value="rules">Rules</option>
              <option value="use_cases">Use cases</option>
            </select>
          </label>
          <label>
            <span>Search</span>
            <input
              name="q"
              defaultValue={selectedQuery}
              placeholder="Rule, description, signal..."
            />
          </label>
          <label>
            <span>Tenant</span>
            <input name="tenant" defaultValue={selectedTenant} placeholder="All tenants" />
          </label>
          <label>
            <span>Grade</span>
            <select name="grade" defaultValue={selectedGrade ?? ''}>
              <option value="">All</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="needs_review">Needs review</option>
              <option value="risky">Risky</option>
              <option value="broken">Broken</option>
            </select>
          </label>
          <label>
            <span>Use case</span>
            <input name="useCaseId" defaultValue={selectedUseCaseId} placeholder="uc_..." />
          </label>
          <button type="submit">Apply filters</button>
        </form>
      </Panel>

      <Panel tone="raised" className={styles.sectionPanel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Scores</p>
            <h2>{selectedKind === 'rules' ? 'Rule quality' : 'Use-case quality'}</h2>
          </div>
          <span>
            {currentTotal === 0 ? 0 : currentOffset + 1}–
            {Math.min(currentOffset + currentItems, currentTotal)} of {currentTotal}
          </span>
        </div>

        {selectedKind === 'rules' ? (
          !rulePage || rulePage.items.length === 0 ? (
            <p className={styles.emptyInline}>No rules match the selected filters.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Rule</th>
                    <th scope="col">Score</th>
                    <th scope="col">Grade</th>
                    <th scope="col">Noise</th>
                    <th scope="col">Decoder</th>
                    <th scope="col">MITRE</th>
                    <th scope="col">Signals</th>
                  </tr>
                </thead>
                <tbody>
                  {rulePage.items.map((rule) => (
                    <tr key={rule.key}>
                      <td>
                        <strong>{rule.ruleId}</strong>
                        <small>
                          {rule.tenant} · {rule.useCaseId}
                        </small>
                      </td>
                      <td>{rule.overall}/100</td>
                      <td>
                        <StatusBadge tone={toneForGrade(rule.grade)}>
                          {rule.grade.replace('_', ' ')}
                        </StatusBadge>
                      </td>
                      <td>{rule.dimensions.noiseControl}</td>
                      <td>{rule.dimensions.decoderConfidence}</td>
                      <td>{rule.dimensions.mitreQuality}</td>
                      <td>
                        {rule.warnings.slice(0, 2).join(' · ') ||
                          rule.strengths.slice(0, 2).join(' · ') ||
                          'No notable signal'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : !useCasePage || useCasePage.items.length === 0 ? (
          <p className={styles.emptyInline}>No use cases match the selected filters.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Use case</th>
                  <th scope="col">Average</th>
                  <th scope="col">Grade</th>
                  <th scope="col">Rules</th>
                  <th scope="col">Jira visible</th>
                  <th scope="col">Weak signals</th>
                </tr>
              </thead>
              <tbody>
                {useCasePage.items.map((useCase) => (
                  <tr key={useCase.key}>
                    <td>
                      <strong>{useCase.useCaseId}</strong>
                      <small>{useCase.tenant}</small>
                    </td>
                    <td>{useCase.average}/100</td>
                    <td>
                      <StatusBadge tone={toneForGrade(useCase.grade)}>
                        {useCase.grade.replace('_', ' ')}
                      </StatusBadge>
                    </td>
                    <td>{useCase.rules}</td>
                    <td>{useCase.jiraVisible}</td>
                    <td>{useCase.weakSignals.join(' · ') || 'No weak signals'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      </Panel>
    </div>
  );
}
