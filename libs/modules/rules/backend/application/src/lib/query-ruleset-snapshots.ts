import type {
  RuleDependency,
  RuleField,
  RuleSeverity,
  UseCaseConfidence,
  ValidationSeverity,
} from '@mercure/rules-backend-domain';

export const RULESET_SNAPSHOT_QUERY_STORE = Symbol(
  'mercure.rules.ruleset-snapshot-query-store',
);

export interface PageRequest {
  readonly offset: number;
  readonly limit: number;
}

export interface PageResult<T> extends PageRequest {
  readonly total: number;
  readonly items: readonly T[];
}

export interface RulesetSnapshotSummary {
  readonly id: string;
  readonly sourceFingerprint: string;
  readonly contentFingerprint: string;
  readonly loadedAt: string;
  readonly createdAt: string;
  readonly complete: boolean;
  readonly sourceErrorCount: number;
  readonly archiveCount: number;
  readonly fileCount: number;
  readonly ruleCount: number;
  readonly decoderCount: number;
  readonly useCaseCount: number;
  readonly jiraVisibleCount: number;
  readonly testingCount: number;
  readonly productionCount: number;
  readonly criticalCount: number;
  readonly mitreMappedCount: number;
  readonly missingUseCaseCount: number;
  readonly brokenDependencyCount: number;
}

export interface RulesetSnapshotRuleView {
  readonly id: string;
  readonly level: number;
  readonly description: string;
  readonly groups: readonly string[];
  readonly status: string;
  readonly role: string;
  readonly severity: RuleSeverity;
  readonly jiraVisible: boolean;
  readonly tenant: string;
  readonly sourceFile: string;
  readonly sourceSection?: string;
  readonly useCaseId: string;
  readonly useCaseConfidence: UseCaseConfidence;
  readonly mitre: readonly string[];
  readonly dependencies: readonly RuleDependency[];
  readonly fields: readonly RuleField[];
  readonly frequency?: string;
  readonly timeframe?: string;
  readonly decodedAs: readonly string[];
  readonly options: readonly string[];
}

export interface RulesetSnapshotDecoderView {
  readonly name: string;
  readonly parent?: string;
  readonly prematch: readonly string[];
  readonly regex: readonly string[];
  readonly orderFields: readonly string[];
  readonly tenant: string;
  readonly sourceFile: string;
}

export interface RulesetSnapshotIssueView {
  readonly severity: ValidationSeverity;
  readonly type: string;
  readonly title: string;
  readonly detail: string;
  readonly ruleId?: string;
  readonly decoderName?: string;
  readonly fileName?: string;
  readonly tenant?: string;
}

export interface RulesetSnapshotRuleQuery extends PageRequest {
  readonly tenant?: string;
  readonly severity?: RuleSeverity;
  readonly status?: string;
  readonly useCaseId?: string;
  readonly ruleId?: string;
  readonly jiraVisible?: boolean;
}

export interface RulesetSnapshotDecoderQuery extends PageRequest {
  readonly tenant?: string;
  readonly name?: string;
}

export interface RulesetSnapshotIssueQuery extends PageRequest {
  readonly severity?: ValidationSeverity;
  readonly type?: string;
}

export interface RulesetSnapshotQueryStore {
  listSnapshots(request: PageRequest): Promise<PageResult<RulesetSnapshotSummary>>;
  getSnapshot(snapshotId: string): Promise<RulesetSnapshotSummary | null>;
  listRules(
    snapshotId: string,
    request: RulesetSnapshotRuleQuery,
  ): Promise<PageResult<RulesetSnapshotRuleView>>;
  listDecoders(
    snapshotId: string,
    request: RulesetSnapshotDecoderQuery,
  ): Promise<PageResult<RulesetSnapshotDecoderView>>;
  listIssues(
    snapshotId: string,
    request: RulesetSnapshotIssueQuery,
  ): Promise<PageResult<RulesetSnapshotIssueView>>;
}

export class RulesetSnapshotNotFoundError extends Error {
  constructor(readonly snapshotId: string) {
    super(`Rules snapshot not found: ${snapshotId}`);
    this.name = 'RulesetSnapshotNotFoundError';
  }
}

export class QueryRulesetSnapshots {
  constructor(private readonly store: RulesetSnapshotQueryStore) {}

  list(request: PageRequest): Promise<PageResult<RulesetSnapshotSummary>> {
    return this.store.listSnapshots(request);
  }

  async get(snapshotId: string): Promise<RulesetSnapshotSummary> {
    const snapshot = await this.store.getSnapshot(snapshotId);
    if (!snapshot) {
      throw new RulesetSnapshotNotFoundError(snapshotId);
    }
    return snapshot;
  }

  async listRules(
    snapshotId: string,
    request: RulesetSnapshotRuleQuery,
  ): Promise<PageResult<RulesetSnapshotRuleView>> {
    await this.requireSnapshot(snapshotId);
    return this.store.listRules(snapshotId, request);
  }

  async listDecoders(
    snapshotId: string,
    request: RulesetSnapshotDecoderQuery,
  ): Promise<PageResult<RulesetSnapshotDecoderView>> {
    await this.requireSnapshot(snapshotId);
    return this.store.listDecoders(snapshotId, request);
  }

  async listIssues(
    snapshotId: string,
    request: RulesetSnapshotIssueQuery,
  ): Promise<PageResult<RulesetSnapshotIssueView>> {
    await this.requireSnapshot(snapshotId);
    return this.store.listIssues(snapshotId, request);
  }

  private async requireSnapshot(snapshotId: string): Promise<void> {
    const snapshot = await this.store.getSnapshot(snapshotId);
    if (!snapshot) {
      throw new RulesetSnapshotNotFoundError(snapshotId);
    }
  }
}
