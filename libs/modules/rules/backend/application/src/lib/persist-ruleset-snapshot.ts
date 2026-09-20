import type {
  ImportArchivedRuleset,
  ImportArchivedRulesetRequest,
  ImportArchivedRulesetResult,
} from './analyze-ruleset';

export const RULESET_SNAPSHOT_STORE = Symbol('mercure.rules.ruleset-snapshot-store');

export interface RulesetSnapshotIdentity {
  readonly id: string;
  readonly sourceFingerprint: string;
  readonly contentFingerprint: string;
  readonly complete: boolean;
  readonly sourceErrorCount: number;
  readonly loadedAt: string;
  readonly createdAt: string;
}

export interface RulesetSnapshotStore {
  persist(imported: ImportArchivedRulesetResult): Promise<RulesetSnapshotIdentity>;
}

export interface PersistImportedRulesetResult extends ImportArchivedRulesetResult {
  readonly snapshot: RulesetSnapshotIdentity;
}

export class RulesetImportUnavailableError extends Error {
  constructor() {
    super('No Rules source files are currently available to import.');
    this.name = 'RulesetImportUnavailableError';
  }
}

export class RulesetImportInProgressError extends Error {
  constructor() {
    super('A Rules snapshot import is already in progress.');
    this.name = 'RulesetImportInProgressError';
  }
}

export class PersistImportedRuleset {
  private inProgress = false;

  constructor(
    private readonly importer: ImportArchivedRuleset,
    private readonly store: RulesetSnapshotStore,
  ) {}

  execute(request: ImportArchivedRulesetRequest = {}): Promise<PersistImportedRulesetResult> {
    if (this.inProgress) {
      return Promise.reject(new RulesetImportInProgressError());
    }

    this.inProgress = true;
    return this.persist(request).finally(() => {
      this.inProgress = false;
    });
  }

  private async persist(
    request: ImportArchivedRulesetRequest,
  ): Promise<PersistImportedRulesetResult> {
    const imported = await this.importer.execute(request);
    if (imported.analysis.files.length === 0) {
      throw new RulesetImportUnavailableError();
    }

    const snapshot = await this.store.persist(imported);

    return {
      ...imported,
      snapshot,
    };
  }
}
