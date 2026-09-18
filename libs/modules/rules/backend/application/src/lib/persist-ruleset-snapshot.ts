import type {
  ImportArchivedRulesetRequest,
  ImportArchivedRulesetResult,
} from './analyze-ruleset';
import { ImportArchivedRuleset } from './analyze-ruleset';

export const RULESET_SNAPSHOT_STORE = Symbol('mercure.rules.ruleset-snapshot-store');

export interface RulesetSnapshotIdentity {
  readonly id: string;
  readonly sourceFingerprint: string;
  readonly contentFingerprint: string;
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

  async execute(
    request: ImportArchivedRulesetRequest = {},
  ): Promise<PersistImportedRulesetResult> {
    const imported = await this.importer.execute(request);
    const snapshot = await this.store.persist(imported);

    return {
      ...imported,
      snapshot,
    };
  }
}
