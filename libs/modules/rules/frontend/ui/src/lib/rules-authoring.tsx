import { PageHeader, Panel, StatusBadge } from '@mercure/platform-frontend-design-system';

import type {
  RulesAuthoringDraftSummaryView,
  RulesAuthoringDraftView,
} from './models';
import styles from './rules.module.css';

type FormAction = (formData: FormData) => void | Promise<void>;

function stateTone(state: RulesAuthoringDraftSummaryView['state']) {
  return state === 'approved' ? 'accent' as const : 'neutral' as const;
}

export function RulesAuthoringDraftList({
  drafts,
}: {
  readonly drafts: readonly RulesAuthoringDraftSummaryView[];
}) {
  return <div className={styles.page}>
    <PageHeader
      eyebrow="Rules administration"
      title="Authoring drafts"
      description="Controlled XML authoring with deterministic validation and explicit approval. Export never writes to a Wazuh manager."
      actions={<a className={styles.actionLink} href="/rules">Rules snapshots</a>}
    />
    {drafts.length === 0 ? (
      <Panel tone="muted" className={styles.statePanel}>
        <h2>No authoring drafts yet</h2>
        <p>Open a rule or decoder in an immutable snapshot and create a draft from its source file.</p>
      </Panel>
    ) : (
      <div className={styles.snapshotList}>
        {drafts.map((draft) => (
          <a key={draft.id} className={styles.snapshotLink} href={'/rules/drafts/' + draft.id}>
            <Panel tone="raised" className={styles.snapshotCard}>
              <div className={styles.snapshotHeading}>
                <div>
                  <p className={styles.eyebrow}>{draft.sourceType}</p>
                  <h2 className={styles.mono}>{draft.fileName}</h2>
                </div>
                <StatusBadge tone={stateTone(draft.state)}>{draft.state}</StatusBadge>
              </div>
              <div className={styles.inlineStats}>
                <span>Revision <strong>{draft.revision}</strong></span>
                <span>Tenant <strong>{draft.tenant}</strong></span>
                {draft.validation ? <span>Validation <strong>{draft.validation.errorCount} errors · {draft.validation.warningCount} warnings</strong></span> : null}
              </div>
              <div className={styles.snapshotFooter}>
                <span>Updated {new Date(draft.updatedAt).toLocaleString()}</span>
                <span className={styles.mono}>{draft.sha256.slice(0, 12)}…</span>
              </div>
            </Panel>
          </a>
        ))}
      </div>
    )}
  </div>;
}

export function RulesAuthoringDraftDetail({
  approveAction,
  draft,
  error,
  updateAction,
  validateAction,
}: {
  readonly approveAction: FormAction;
  readonly draft: RulesAuthoringDraftView;
  readonly error?: 'validation' | 'conflict' | 'not-found' | 'unavailable';
  readonly updateAction: FormAction;
  readonly validateAction: FormAction;
}) {
  const canApprove =
    draft.state === 'validated' &&
    draft.validation?.revision === draft.revision &&
    draft.validation.errorCount === 0;

  return <div className={styles.page}>
    <PageHeader
      eyebrow="Rules authoring"
      title={draft.fileName}
      description="Edit a database-backed working copy. The imported snapshot and Wazuh manager remain untouched."
      actions={<StatusBadge tone={stateTone(draft.state)}>{draft.state + ' · r' + draft.revision}</StatusBadge>}
    />

    <div className={styles.headerActions}>
      <a className={styles.actionLink} href="/rules/drafts">← Drafts</a>
      <a className={styles.actionLink} href={'/rules/' + draft.sourceSnapshotId}>Source snapshot</a>
      {draft.state === 'approved' ? <a className={styles.actionLink} href={'/rules/drafts/' + draft.id + '/export'}>Download approved XML</a> : null}
    </div>

    {error ? <Panel tone="muted" className={styles.statePanel}>
      <strong>{error === 'conflict' ? 'The draft changed before your action completed.' : error === 'validation' ? 'The submitted draft content is invalid.' : error === 'not-found' ? 'The draft could not be found.' : 'The authoring API is unavailable.'}</strong>
      <p>Reload the current revision before retrying if this was a conflict.</p>
    </Panel> : null}

    <Panel tone="muted" className={styles.provenance}>
      <div><span>Tenant</span><strong>{draft.tenant}</strong></div>
      <div><span>Source type</span><strong>{draft.sourceType}</strong></div>
      <div><span>Source file position</span><strong>{draft.sourceFilePosition}</strong></div>
      <div><span>Revision</span><strong>{draft.revision}</strong></div>
      <div><span>SHA-256</span><strong className={styles.mono}>{draft.sha256}</strong></div>
      <div><span>Updated by</span><strong className={styles.mono}>{draft.updatedBy}</strong></div>
    </Panel>

    <Panel tone="raised" className={styles.adminFormPanel}>
      <form action={updateAction} className={styles.adminForm}>
        <input type="hidden" name="draftId" value={draft.id} />
        <input type="hidden" name="expectedRevision" value={draft.revision} />
        <label className={styles.fullWidthField}>
          <span>XML working copy</span>
          <textarea
            name="content"
            defaultValue={draft.content}
            rows={28}
            required
            spellCheck={false}
            className={styles.mono}
          />
          <small>Maximum 1 MiB. Saving creates a new revision and invalidates prior validation/approval.</small>
        </label>
        <div className={styles.formActions}>
          <button type="submit">Save new revision</button>
        </div>
      </form>
    </Panel>

    <section className={styles.detailGrid}>
      <Panel tone="raised" className={styles.sectionPanel}>
        <div className={styles.sectionHeader}>
          <div><p className={styles.eyebrow}>Validation</p><h2>Deterministic parser checks</h2></div>
          {draft.validation ? <StatusBadge tone={draft.validation.errorCount > 0 ? 'accent' : 'neutral'}>{draft.validation.errorCount + ' errors'}</StatusBadge> : null}
        </div>
        {draft.validation ? <>
          <div className={styles.inlineStats}>
            <span>Rules <strong>{draft.validation.ruleCount}</strong></span>
            <span>Decoders <strong>{draft.validation.decoderCount}</strong></span>
            <span>Warnings <strong>{draft.validation.warningCount}</strong></span>
            <span>Info <strong>{draft.validation.infoCount}</strong></span>
          </div>
          {draft.validation.issues.length === 0 ? <p className={styles.emptyInline}>No validation findings.</p> : (
            <ul className={styles.issueList}>
              {draft.validation.issues.map((issue, index) => <li key={issue.type + ':' + index}>
                <div className={styles.issueTopline}><strong>{issue.title}</strong><StatusBadge tone={issue.severity === 'error' ? 'accent' : 'neutral'}>{issue.severity}</StatusBadge></div>
                <p>{issue.detail}</p>
                <small>{[issue.ruleId && 'Rule ' + issue.ruleId, issue.decoderName && 'Decoder ' + issue.decoderName, issue.tenant].filter(Boolean).join(' · ')}</small>
              </li>)}
            </ul>
          )}
        </> : <p className={styles.emptyInline}>This revision has not been validated.</p>}

        <form action={validateAction}>
          <input type="hidden" name="draftId" value={draft.id} />
          <input type="hidden" name="expectedRevision" value={draft.revision} />
          <button className={styles.actionButton} type="submit">Validate revision {draft.revision}</button>
        </form>
      </Panel>

      <Panel tone="raised" className={styles.sectionPanel}>
        <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>Approval</p><h2>Human release gate</h2></div></div>
        <p className={styles.supportingText}>Approval is bound to the exact validated revision and SHA-256. Any edit returns the draft to draft state.</p>
        <form action={approveAction}>
          <input type="hidden" name="draftId" value={draft.id} />
          <input type="hidden" name="expectedRevision" value={draft.revision} />
          <button className={styles.actionButton} type="submit" disabled={!canApprove}>Approve validated revision</button>
        </form>
        {draft.approvedAt ? <p className={styles.supportingText}>Approved by <span className={styles.mono}>{draft.approvedBy}</span> at {new Date(draft.approvedAt).toLocaleString()}.</p> : null}
      </Panel>

      <Panel tone="raised" className={styles.sectionPanel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Audit trail</p>
            <h2>Authoring history</h2>
          </div>
          <StatusBadge tone="neutral">{draft.events.length + ' events'}</StatusBadge>
        </div>
        {draft.events.length === 0 ? (
          <p className={styles.emptyInline}>No authoring events are recorded.</p>
        ) : (
          <ul className={styles.issueList}>
            {draft.events.map((event, index) => (
              <li key={event.createdAt + ':' + event.eventType + ':' + index}>
                <div className={styles.issueTopline}>
                  <strong>{event.eventType}</strong>
                  <StatusBadge tone={event.state === 'approved' ? 'accent' : 'neutral'}>
                    {event.state + ' · r' + event.revision}
                  </StatusBadge>
                </div>
                <p>
                  <span className={styles.mono}>{event.actorSubject}</span>
                  {' · '}
                  {new Date(event.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel tone="muted" className={styles.sectionPanel}>
        <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>Deployment boundary</p><h2>Export only</h2></div></div>
        <p className={styles.supportingText}>Mercure does not write this draft to a manager, archive directory, SSH target, Git repository, or Wazuh API.</p>
      </Panel>
    </section>
  </div>;
}
