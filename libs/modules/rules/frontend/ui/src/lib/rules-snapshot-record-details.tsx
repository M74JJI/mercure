import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type { RulesDecoderDetailView, RulesIssueDetailView, RulesRuleDetailView } from './models';
import styles from './rules.module.css';

type FormAction = (formData: FormData) => void | Promise<void>;

function Navigation({
  collection,
  snapshotId,
}: {
  readonly collection: 'rules' | 'decoders' | 'issues';
  readonly snapshotId: string;
}) {
  return (
    <div className={styles.headerActions}>
      <a className={styles.actionLink} href={'/rules/' + snapshotId}>
        ← Snapshot
      </a>
      <a className={styles.actionLink} href={'/rules/' + snapshotId + '/' + collection}>
        Back to explorer
      </a>
    </div>
  );
}

function Values({ empty, values }: { readonly empty: string; readonly values: readonly string[] }) {
  return values.length === 0 ? (
    <p className={styles.emptyInline}>{empty}</p>
  ) : (
    <ul className={styles.decoderList}>
      {values.map((value, index) => (
        <li key={value + ':' + index}>
          <span className={styles.mono}>{value}</span>
        </li>
      ))}
    </ul>
  );
}

export function RulesSnapshotRuleDetail({
  createDraftAction,
  rule,
  snapshotId,
}: {
  readonly createDraftAction?: FormAction;
  readonly rule: RulesRuleDetailView;
  readonly snapshotId: string;
}) {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules snapshot rule"
        title={'Rule ' + rule.id}
        description={rule.description}
        actions={
          <StatusBadge tone={rule.severity === 'critical' ? 'accent' : 'neutral'}>
            {'Level ' + rule.level + ' · ' + rule.severity}
          </StatusBadge>
        }
      />
      <Navigation snapshotId={snapshotId} collection="rules" />
      {createDraftAction ? (
        <form action={createDraftAction}>
          <input type="hidden" name="sourceSnapshotId" value={snapshotId} />
          <input type="hidden" name="sourceFilePosition" value={rule.sourceFilePosition} />
          <button className={styles.actionButton} type="submit">
            Create authoring draft from source file
          </button>
        </form>
      ) : null}
      <Panel tone="muted" className={styles.provenance}>
        <div>
          <span>Tenant</span>
          <strong>{rule.tenant}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{rule.status}</strong>
        </div>
        <div>
          <span>Role</span>
          <strong>{rule.role}</strong>
        </div>
        <div>
          <span>Use case</span>
          <strong className={styles.mono}>{rule.useCaseId}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{rule.useCaseConfidence}</strong>
        </div>
        <div>
          <span>Jira</span>
          <strong>{rule.jiraVisible ? 'Visible' : 'Hidden'}</strong>
        </div>
        <div>
          <span>Source file</span>
          <strong className={styles.mono}>{rule.sourceFile}</strong>
        </div>
        {rule.sourceSection ? (
          <div>
            <span>Source section</span>
            <strong className={styles.mono}>{rule.sourceSection}</strong>
          </div>
        ) : null}
        <div>
          <span>Record position</span>
          <strong>{rule.position}</strong>
        </div>
      </Panel>
      <section className={styles.detailGrid}>
        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Dependencies</p>
              <h2>Rule relationships</h2>
            </div>
          </div>
          {rule.dependencies.length === 0 ? (
            <p className={styles.emptyInline}>No rule dependencies.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Type</th>
                    <th scope="col">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {rule.dependencies.map((dependency, index) => (
                    <tr key={dependency.type + ':' + dependency.value + ':' + index}>
                      <td>{dependency.type}</td>
                      <td className={styles.mono}>{dependency.value}</td>
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
              <p className={styles.eyebrow}>Classification</p>
              <h2>Groups and MITRE</h2>
            </div>
          </div>
          <p className={styles.supportingText}>Groups</p>
          <Values values={rule.groups} empty="No groups." />
          <p className={styles.supportingText}>MITRE techniques</p>
          <Values values={rule.mitre} empty="No MITRE mappings." />
        </Panel>
        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Fields</p>
              <h2>Field predicates</h2>
            </div>
          </div>
          {rule.fields.length === 0 ? (
            <p className={styles.emptyInline}>No field predicates.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Field</th>
                    <th scope="col">Type</th>
                    <th scope="col">Expression</th>
                  </tr>
                </thead>
                <tbody>
                  {rule.fields.map((field, index) => (
                    <tr key={field.name + ':' + index}>
                      <td className={styles.mono}>{field.name}</td>
                      <td>{field.type ?? '—'}</td>
                      <td className={styles.mono}>{field.value}</td>
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
              <p className={styles.eyebrow}>Runtime</p>
              <h2>Decoder and options</h2>
            </div>
          </div>
          <p className={styles.supportingText}>
            {[
              rule.frequency ? 'Frequency ' + rule.frequency : undefined,
              rule.timeframe ? 'Timeframe ' + rule.timeframe : undefined,
            ]
              .filter(Boolean)
              .join(' · ') || 'No frequency/timeframe constraint.'}
          </p>
          <p className={styles.supportingText}>Decoded as</p>
          <Values values={rule.decodedAs} empty="No decoded_as constraint." />
          <p className={styles.supportingText}>Options</p>
          <Values values={rule.options} empty="No options." />
        </Panel>
      </section>
    </div>
  );
}

export function RulesSnapshotDecoderDetail({
  createDraftAction,
  decoder,
  snapshotId,
}: {
  readonly createDraftAction?: FormAction;
  readonly decoder: RulesDecoderDetailView;
  readonly snapshotId: string;
}) {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules snapshot decoder"
        title={decoder.name}
        description="Read-only normalized decoder inspection. Raw XML is intentionally not exposed."
        actions={
          <StatusBadge tone="neutral">
            {decoder.parent ? 'Child decoder' : 'Root decoder'}
          </StatusBadge>
        }
      />
      <Navigation snapshotId={snapshotId} collection="decoders" />
      {createDraftAction ? (
        <form action={createDraftAction}>
          <input type="hidden" name="sourceSnapshotId" value={snapshotId} />
          <input type="hidden" name="sourceFilePosition" value={decoder.sourceFilePosition} />
          <button className={styles.actionButton} type="submit">
            Create authoring draft from source file
          </button>
        </form>
      ) : null}
      <Panel tone="muted" className={styles.provenance}>
        <div>
          <span>Tenant</span>
          <strong>{decoder.tenant}</strong>
        </div>
        <div>
          <span>Parent</span>
          <strong>{decoder.parent ?? 'None'}</strong>
        </div>
        <div>
          <span>Source file</span>
          <strong className={styles.mono}>{decoder.sourceFile}</strong>
        </div>
        <div>
          <span>Record position</span>
          <strong>{decoder.position}</strong>
        </div>
      </Panel>
      <section className={styles.detailGrid}>
        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Prematch</p>
              <h2>Prematch expressions</h2>
            </div>
          </div>
          <Values values={decoder.prematch} empty="No prematch expressions." />
        </Panel>
        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Regex</p>
              <h2>Decoder expressions</h2>
            </div>
          </div>
          <Values values={decoder.regex} empty="No regex expressions." />
        </Panel>
        <Panel tone="raised" className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Order</p>
              <h2>Extracted fields</h2>
            </div>
          </div>
          <Values values={decoder.orderFields} empty="No ordered fields." />
        </Panel>
      </section>
    </div>
  );
}

export function RulesSnapshotIssueDetail({
  issue,
  snapshotId,
}: {
  readonly issue: RulesIssueDetailView;
  readonly snapshotId: string;
}) {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Rules snapshot finding"
        title={issue.title}
        description={issue.detail}
        actions={
          <StatusBadge tone={issue.severity === 'error' ? 'accent' : 'neutral'}>
            {issue.severity}
          </StatusBadge>
        }
      />
      <Navigation snapshotId={snapshotId} collection="issues" />
      <Panel tone="raised" className={styles.sectionPanel}>
        <div className={styles.provenance}>
          <div>
            <span>Type</span>
            <strong className={styles.mono}>{issue.type}</strong>
          </div>
          <div>
            <span>Tenant</span>
            <strong>{issue.tenant ?? 'Not scoped'}</strong>
          </div>
          <div>
            <span>Rule ID</span>
            <strong className={styles.mono}>{issue.ruleId ?? '—'}</strong>
          </div>
          <div>
            <span>Decoder</span>
            <strong className={styles.mono}>{issue.decoderName ?? '—'}</strong>
          </div>
          <div>
            <span>File</span>
            <strong className={styles.mono}>{issue.fileName ?? '—'}</strong>
          </div>
          <div>
            <span>Record position</span>
            <strong>{issue.position}</strong>
          </div>
        </div>
      </Panel>
    </div>
  );
}
