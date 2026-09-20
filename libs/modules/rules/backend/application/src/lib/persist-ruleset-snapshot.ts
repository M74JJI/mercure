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

export class PersistImportedRuleset {
  private tail: Promise<void> = Promise.resolve();

  constructor(
    private readonly importer: ImportArchivedRuleset,
    private readonly store: RulesetSnapshotStore,
  ) {}

  execute(request: ImportArchivedRulesetRequest = {}): Promise<PersistImportedRulesetResult> {
    const operation = this.tail.then(() => this.persist(request));
    this.tail = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
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
