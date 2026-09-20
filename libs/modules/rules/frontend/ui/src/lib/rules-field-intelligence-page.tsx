import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type { RulesFieldIntelligenceDetailView } from './models';
import styles from './rules.module.css';

export interface RulesFieldIntelligencePageProps {
  readonly snapshotId: string;
  readonly intelligence: RulesFieldIntelligenceDetailView;
  readonly selectedQuery?: string;
  readonly selectedTenant?: string;
  readonly selectedFamily?: string;
  readonly selectedHealth?: string;
  readonly selectedCriticality?: string;
  readonly previousHref?: string;
  readonly nextHref?: string;
}

export function RulesFieldIntelligencePage({
  intelligence,
  nextHref,
  previousHref,
  selectedCriticality,
  selectedFamily,
  selectedHealth,
  selectedQuery,
  selectedTenant,
  snapshotId,
}: RulesFieldIntelligencePageProps) {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules intelligence"
        title="Field intelligence"
        description="Tenant-scoped lineage, health, alias, and risk analysis derived from decoder output and rule usage."
        actions={
          <StatusBadge tone="neutral">
            {String(intelligence.page.total) + ' matched fields'}
          </StatusBadge>
        }
      />

      <div className={styles.headerActions}>
        <a className={styles.actionLink} href={'/rules/' + snapshotId}>
          ← Snapshot
        </a>
        <a className={styles.actionLink} href={'/rules/' + snapshotId + '/quality'}>
          Quality
        </a>
        <a className={styles.actionLink} href={'/rules/' + snapshotId + '/graph'}>
          Graph
        </a>
        <a className={styles.actionLink} href={'/rules/' + snapshotId + '/diagnostics'}>
          Diagnostics
        </a>
      </div>

      <section className={styles.intelligenceMetrics} aria-label="Field intelligence summary">
        <Panel tone="muted" className={styles.metric}>
          <strong>{intelligence.stats.totalFields}</strong>
          <span>Total fields</span>
        </Panel>
        <Panel tone="muted" className={styles.metric}>
          <strong>{intelligence.stats.unknownSourceFields}</strong>
          <span>Unknown source</span>
        </Panel>
        <Panel tone="muted" className={styles.metric}>
          <strong>{intelligence.stats.aliasCandidates}</strong>
          <span>Alias candidates</span>
        </Panel>
        <Panel tone="muted" className={styles.metric}>
          <strong>{intelligence.stats.averageRisk}</strong>
          <span>Average risk</span>
        </Panel>
      </section>

      <Panel tone="raised" className={styles.compareControls}>
        <form
          action={'/rules/' + snapshotId + '/fields'}
          method="get"
          className={styles.filterForm}
        >
          <label>
            <span>Search</span>
            <input name="q" defaultValue={selectedQuery} placeholder="source.ip, config, user..." />
          </label>
          <label>
            <span>Tenant</span>
            <input name="tenant" defaultValue={selectedTenant} placeholder="All tenants" />
          </label>
          <label>
            <span>Family</span>
            <input name="family" defaultValue={selectedFamily} placeholder="All families" />
          </label>
          <label>
            <span>Health</span>
            <select name="health" defaultValue={selectedHealth ?? ''}>
              <option value="">All</option>
              <option value="healthy">Healthy</option>
              <option value="underused">Underused</option>
              <option value="unknown_source">Unknown source</option>
              <option value="alias_candidate">Alias candidate</option>
              <option value="orphaned">Orphaned</option>
            </select>
          </label>
          <label>
            <span>Criticality</span>
            <select name="criticality" defaultValue={selectedCriticality ?? ''}>
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <button type="submit">Apply filters</button>
        </form>
      </Panel>

      <Panel tone="raised" className={styles.sectionPanel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Lineage</p>
            <h2>Observed fields</h2>
          </div>
          <span>
            {intelligence.page.offset + 1}–
            {Math.min(
              intelligence.page.offset + intelligence.page.items.length,
              intelligence.page.total,
            )}{' '}
            of {intelligence.page.total}
          </span>
        </div>

        {intelligence.page.items.length === 0 ? (
          <p className={styles.emptyInline}>No fields match the selected filters.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Field</th>
                  <th scope="col">Risk</th>
                  <th scope="col">Health</th>
                  <th scope="col">Produced</th>
                  <th scope="col">Used</th>
                  <th scope="col">Signals</th>
                </tr>
              </thead>
              <tbody>
                {intelligence.page.items.map((field) => (
                  <tr key={field.key}>
                    <td>
                      <strong>{field.field}</strong>
                      <small>
                        {field.tenant} · {field.family}
                      </small>
                    </td>
                    <td>
                      <strong>{field.riskScore}/100</strong>
                      <small>{field.criticality}</small>
                    </td>
                    <td>{field.health.replace('_', ' ')}</td>
                    <td>{field.producedByTotal} decoders</td>
                    <td>
                      <strong>{field.usedByRulesTotal} rules</strong>
                      <small>{field.usedByUseCasesTotal} use cases</small>
                    </td>
                    <td>
                      <strong>{field.jiraVisibleRules} Jira visible</strong>
                      <small>
                        {field.aliasHintsTotal} aliases · {field.decodedAsRulesTotal} decoded-as
                      </small>
                    </td>
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
