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

export class PersistImportedRuleset {
  constructor(
    private readonly importer: ImportArchivedRuleset,
    private readonly store: RulesetSnapshotStore,
  ) {}

  async execute(request: ImportArchivedRulesetRequest = {}): Promise<PersistImportedRulesetResult> {
    const imported = await this.importer.execute(request);
    if (imported.analysis.files.length === 0) {
      throw new Error('Cannot persist a Rules snapshot without imported source files.');
    }

    const snapshot = await this.store.persist(imported);

    return {
      ...imported,
      snapshot,
    };
  }
}
