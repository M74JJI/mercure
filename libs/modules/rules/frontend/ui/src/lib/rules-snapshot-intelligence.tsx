import { Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type {
  RulesFieldIntelligenceView,
  RulesGraphSummaryView,
  RulesQualityView,
  RulesRoundtripSummaryView,
} from './models';
import styles from './rules.module.css';

export interface RulesSnapshotIntelligenceProps {
  readonly snapshotId: string;
  readonly fields: RulesFieldIntelligenceView;
  readonly quality: RulesQualityView;
  readonly graph: RulesGraphSummaryView;
  readonly roundtrip: RulesRoundtripSummaryView;
}

function toneForGrade(grade: string): 'positive' | 'accent' | 'neutral' {
  if (grade === 'excellent' || grade === 'good') return 'positive';
  if (grade === 'risky' || grade === 'broken') return 'accent';
  return 'neutral';
}

export function RulesSnapshotIntelligence({
  fields,
  graph,
  quality,
  roundtrip,
  snapshotId,
}: RulesSnapshotIntelligenceProps) {
  const qualityRules = quality.rules?.items ?? [];

  return (
    <section className={styles.intelligenceSection} aria-labelledby="rules-intelligence-title">
      <div className={styles.intelligenceHeading}>
        <div>
          <p className={styles.eyebrow}>Intelligence</p>
          <h2 id="rules-intelligence-title">Read-only configuration intelligence</h2>
          <p>
            Deterministic analysis derived from this immutable snapshot. No AI generation or
            configuration mutation is performed.
          </p>
        </div>
        <StatusBadge tone="neutral">Snapshot derived</StatusBadge>
      </div>

      <div className={styles.headerActions}>
        <a className={styles.actionLink} href={'/rules/' + snapshotId + '/fields'}>
          Explore fields
        </a>
        <a className={styles.actionLink} href={'/rules/' + snapshotId + '/quality'}>
          Explore quality
        </a>
        <a className={styles.actionLink} href={'/rules/' + snapshotId + '/graph'}>
          Explore graph
        </a>
        <a className={styles.actionLink} href={'/rules/' + snapshotId + '/diagnostics'}>
          Explore diagnostics
        </a>
      </div>

      <div className={styles.intelligenceMetrics} aria-label="Rules intelligence summary">
        <Panel tone="muted" className={styles.metric}>
          <strong>{quality.stats.averageOverall}</strong>
          <span>Average quality</span>
        </Panel>
        <Panel tone="muted" className={styles.metric}>
          <strong>{fields.stats.totalFields}</strong>
          <span>Observed fields</span>
        </Panel>
        <Panel tone="muted" className={styles.metric}>
          <strong>{graph.graph.stats.nodes}</strong>
          <span>Graph nodes</span>
        </Panel>
        <Panel tone="muted" className={styles.metric}>
          <strong>{roundtrip.summary.idRangeWarnings}</strong>
          <span>ID range warnings</span>
        </Panel>
      </div>

      <div className={styles.intelligenceGrid}>
        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Quality</p>
              <h2>Rules needing attention</h2>
            </div>
            <span>{quality.rules?.total ?? 0} scored</span>
          </div>

          {qualityRules.length === 0 ? (
            <p className={styles.emptyInline}>No scored rules are available.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Rule</th>
                    <th scope="col">Score</th>
                    <th scope="col">Grade</th>
                    <th scope="col">Signals</th>
                  </tr>
                </thead>
                <tbody>
                  {qualityRules.map((rule) => (
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
          )}
        </Panel>

        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Fields</p>
              <h2>Highest-risk field lineage</h2>
            </div>
            <span>{fields.page.total} matched</span>
          </div>

          {fields.page.items.length === 0 ? (
            <p className={styles.emptyInline}>No field intelligence is available.</p>
          ) : (
            <ul className={styles.intelligenceList}>
              {fields.page.items.map((field) => (
                <li key={field.key}>
                  <div>
                    <strong>{field.field}</strong>
                    <small>
                      {field.tenant} · {field.family}
                    </small>
                  </div>
                  <div className={styles.intelligenceListMeta}>
                    <span>{field.riskScore}/100 risk</span>
                    <StatusBadge tone={field.health === 'healthy' ? 'positive' : 'neutral'}>
                      {field.health.replace('_', ' ')}
                    </StatusBadge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Semantic graph</p>
              <h2>Configuration relationships</h2>
            </div>
            <span>{graph.graph.stats.edges} edges</span>
          </div>

          <div className={styles.graphStats}>
            <span>
              <strong>{graph.graph.stats.rules}</strong> rules
            </span>
            <span>
              <strong>{graph.graph.stats.decoders}</strong> decoders
            </span>
            <span>
              <strong>{graph.graph.stats.fields}</strong> fields
            </span>
            <span>
              <strong>{graph.graph.stats.useCases}</strong> use cases
            </span>
            <span>
              <strong>{graph.graph.stats.mitre}</strong> MITRE
            </span>
            <span>
              <strong>{graph.graph.stats.external}</strong> external refs
            </span>
          </div>

          <p className={styles.supportingText}>
            This API returns semantic nodes and edges only. Visual layout remains a frontend
            concern so the backend stays deterministic and layout-free.
          </p>
        </Panel>

        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Diagnostics</p>
              <h2>Round-trip health</h2>
            </div>
            <span>{roundtrip.summary.sourceSections} sections</span>
          </div>

          <div className={styles.diagnosticGrid}>
            <span>
              <strong>{roundtrip.summary.commentedRules}</strong>
              Commented rules
            </span>
            <span>
              <strong>{roundtrip.summary.orphanGroups}</strong>
              Orphan groups
            </span>
            <span>
              <strong>{roundtrip.summary.missingGroupProducers}</strong>
              Missing producers
            </span>
            <span>
              <strong>{roundtrip.summary.missingUseCaseSuggestions}</strong>
              Use-case suggestions
            </span>
          </div>

          <p className={styles.supportingText}>
            Raw XML, reconstructed split files, snippets and suggested XML patches are deliberately
            excluded from the public response.
          </p>
        </Panel>
      </div>
    </section>
  );
}
