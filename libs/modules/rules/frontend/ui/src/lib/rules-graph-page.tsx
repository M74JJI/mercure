import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type { RulesGraphDetailView } from './models';
import styles from './rules.module.css';

export interface RulesGraphPageProps {
  readonly snapshotId: string;
  readonly graph: RulesGraphDetailView;
  readonly selectedMode: string;
  readonly selectedQuery?: string;
  readonly selectedTenant?: string;
  readonly selectedUseCaseId?: string;
  readonly selectedStatus?: string;
  readonly selectedRole?: string;
  readonly selectedJiraOnly?: string;
  readonly selectedIncludeExternal?: string;
  readonly selectedLimit: number;
}

export function RulesGraphPage({
  graph,
  selectedIncludeExternal,
  selectedJiraOnly,
  selectedLimit,
  selectedMode,
  selectedQuery,
  selectedRole,
  selectedStatus,
  selectedTenant,
  selectedUseCaseId,
  snapshotId,
}: RulesGraphPageProps) {
  const nodePreview = graph.graph.nodes.slice(0, 120);
  const edgePreview = graph.graph.edges.slice(0, 120);

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules intelligence"
        title="Semantic dependency graph"
        description="Layout-free relationships across rules, decoders, fields, groups, use cases, MITRE techniques, and bounded external references."
        actions={<StatusBadge tone="neutral">{String(graph.graph.stats.nodes) + ' nodes'}</StatusBadge>}
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
        <a className={styles.actionLink} href={'/rules/' + snapshotId + '/diagnostics'}>
          Diagnostics
        </a>
      </div>

      <section className={styles.intelligenceMetrics} aria-label="Graph summary">
        <Panel tone="muted" className={styles.metric}>
          <strong>{graph.graph.stats.rules}</strong>
          <span>Rules</span>
        </Panel>
        <Panel tone="muted" className={styles.metric}>
          <strong>{graph.graph.stats.decoders}</strong>
          <span>Decoders</span>
        </Panel>
        <Panel tone="muted" className={styles.metric}>
          <strong>{graph.graph.stats.fields}</strong>
          <span>Fields</span>
        </Panel>
        <Panel tone="muted" className={styles.metric}>
          <strong>{graph.graph.stats.edges}</strong>
          <span>Edges</span>
        </Panel>
      </section>

      <Panel tone="raised" className={styles.compareControls}>
        <form action={'/rules/' + snapshotId + '/graph'} method="get" className={styles.graphFilterForm}>
          <label>
            <span>Mode</span>
            <select name="mode" defaultValue={selectedMode}>
              <option value="all">All</option>
              <option value="rules">Rules</option>
              <option value="decoders">Decoders</option>
              <option value="decoder_rules">Decoder → rules</option>
              <option value="fields">Fields</option>
              <option value="use_cases">Use cases</option>
              <option value="mitre">MITRE</option>
            </select>
          </label>
          <label>
            <span>Search</span>
            <input name="q" defaultValue={selectedQuery} placeholder="Rule, field, decoder..." />
          </label>
          <label>
            <span>Tenant</span>
            <input name="tenant" defaultValue={selectedTenant} placeholder="All tenants" />
          </label>
          <label>
            <span>Use case</span>
            <input name="useCaseId" defaultValue={selectedUseCaseId} placeholder="uc_..." />
          </label>
          <label>
            <span>Status</span>
            <input name="status" defaultValue={selectedStatus} placeholder="All statuses" />
          </label>
          <label>
            <span>Role</span>
            <input name="role" defaultValue={selectedRole} placeholder="All roles" />
          </label>
          <label>
            <span>Jira only</span>
            <select name="jiraOnly" defaultValue={selectedJiraOnly ?? ''}>
              <option value="">Either</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
          <label>
            <span>External refs</span>
            <select name="includeExternal" defaultValue={selectedIncludeExternal ?? ''}>
              <option value="">Default</option>
              <option value="true">Include</option>
              <option value="false">Hide</option>
            </select>
          </label>
          <label>
            <span>Limit</span>
            <select name="limit" defaultValue={String(selectedLimit)}>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="300">300</option>
              <option value="500">500</option>
            </select>
          </label>
          <button type="submit">Build graph</button>
        </form>
      </Panel>

      <div className={styles.intelligenceGrid}>
        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Nodes</p>
              <h2>Semantic entities</h2>
            </div>
            <span>
              Showing {nodePreview.length} of {graph.graph.nodes.length}
            </span>
          </div>

          {nodePreview.length === 0 ? (
            <p className={styles.emptyInline}>No nodes match the selected graph filters.</p>
          ) : (
            <div className={styles.graphNodeGrid}>
              {nodePreview.map((node) => (
                <article className={styles.graphNode} key={node.id}>
                  <div className={styles.issueTopline}>
                    <strong>{node.label}</strong>
                    <StatusBadge tone={node.type === 'external' ? 'accent' : 'neutral'}>
                      {node.type.replace('_', ' ')}
                    </StatusBadge>
                  </div>
                  <small>{node.tenant ?? 'global'}</small>
                  <span>Weight {node.weight}</span>
                </article>
              ))}
            </div>
          )}
        </Panel>

        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Edges</p>
              <h2>Relationships</h2>
            </div>
            <span>
              Showing {edgePreview.length} of {graph.graph.edges.length}
            </span>
          </div>

          {edgePreview.length === 0 ? (
            <p className={styles.emptyInline}>No edges match the selected graph filters.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Type</th>
                    <th scope="col">Source</th>
                    <th scope="col">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {edgePreview.map((edge) => (
                    <tr key={edge.id}>
                      <td>{edge.type.replace('_', ' ')}</td>
                      <td className={styles.mono}>{edge.source}</td>
                      <td className={styles.mono}>{edge.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
