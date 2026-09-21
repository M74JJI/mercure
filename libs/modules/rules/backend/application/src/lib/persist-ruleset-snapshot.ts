import type {
  ImportArchivedRuleset,
  ImportArchivedRulesetRequest,
  ImportArchivedRulesetResult,
} from './analyze-ruleset';

export const RULESET_SNAPSHOT_STORE = Symbol('mercure.rules.ruleset-snapshot-store');
export const RULESET_IMPORT_LEASE = Symbol('mercure.rules.ruleset-import-lease');

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

export interface RulesetImportLeaseHandle {
  release(): Promise<void>;
}

export interface RulesetImportLease {
  acquire(): Promise<RulesetImportLeaseHandle | null>;
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
  constructor(
    private readonly importer: ImportArchivedRuleset,
    private readonly store: RulesetSnapshotStore,
    private readonly lease: RulesetImportLease,
  ) {}

  async execute(request: ImportArchivedRulesetRequest = {}): Promise<PersistImportedRulesetResult> {
    const lease = await this.lease.acquire();
    if (!lease) {
      throw new RulesetImportInProgressError();
    }

    try {
      return await this.persist(request);
    } finally {
      await lease.release();
    }
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
