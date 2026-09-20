import type {
  RuleDependency,
  RuleField,
  RuleSeverity,
  UseCaseConfidence,
  ValidationSeverity,
} from '@mercure/rules-backend-domain';

export const RULESET_SNAPSHOT_QUERY_STORE = Symbol('mercure.rules.ruleset-snapshot-query-store');

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
  readonly position: number;
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
  readonly position: number;
  readonly name: string;
  readonly parent?: string;
  readonly prematch: readonly string[];
  readonly regex: readonly string[];
  readonly orderFields: readonly string[];
  readonly tenant: string;
  readonly sourceFile: string;
}

export interface RulesetSnapshotIssueView {
  readonly position: number;
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
  getRule(snapshotId: string, position: number): Promise<RulesetSnapshotRuleView | null>;
  listDecoders(
    snapshotId: string,
    request: RulesetSnapshotDecoderQuery,
  ): Promise<PageResult<RulesetSnapshotDecoderView>>;
  getDecoder(snapshotId: string, position: number): Promise<RulesetSnapshotDecoderView | null>;
  listIssues(
    snapshotId: string,
    request: RulesetSnapshotIssueQuery,
  ): Promise<PageResult<RulesetSnapshotIssueView>>;
  getIssue(snapshotId: string, position: number): Promise<RulesetSnapshotIssueView | null>;
}

export type RulesetSnapshotRecordKind = 'rule' | 'decoder' | 'issue';

export class RulesetSnapshotRecordNotFoundError extends Error {
  constructor(
    readonly snapshotId: string,
    readonly kind: RulesetSnapshotRecordKind,
    readonly position: number,
  ) {
    super(`Rules snapshot ${kind} record not found: ${snapshotId}#${position}`);
    this.name = 'RulesetSnapshotRecordNotFoundError';
  }
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

  async getRule(snapshotId: string, position: number): Promise<RulesetSnapshotRuleView> {
    await this.requireSnapshot(snapshotId);
    const rule = await this.store.getRule(snapshotId, position);
    if (!rule) {
      throw new RulesetSnapshotRecordNotFoundError(snapshotId, 'rule', position);
    }
    return rule;
  }

  async listDecoders(
    snapshotId: string,
    request: RulesetSnapshotDecoderQuery,
  ): Promise<PageResult<RulesetSnapshotDecoderView>> {
    await this.requireSnapshot(snapshotId);
    return this.store.listDecoders(snapshotId, request);
  }

  async getDecoder(snapshotId: string, position: number): Promise<RulesetSnapshotDecoderView> {
    await this.requireSnapshot(snapshotId);
    const decoder = await this.store.getDecoder(snapshotId, position);
    if (!decoder) {
      throw new RulesetSnapshotRecordNotFoundError(snapshotId, 'decoder', position);
    }
    return decoder;
  }

  async listIssues(
    snapshotId: string,
    request: RulesetSnapshotIssueQuery,
  ): Promise<PageResult<RulesetSnapshotIssueView>> {
    await this.requireSnapshot(snapshotId);
    return this.store.listIssues(snapshotId, request);
  }

  async getIssue(snapshotId: string, position: number): Promise<RulesetSnapshotIssueView> {
    await this.requireSnapshot(snapshotId);
    const issue = await this.store.getIssue(snapshotId, position);
    if (!issue) {
      throw new RulesetSnapshotRecordNotFoundError(snapshotId, 'issue', position);
    }
    return issue;
  }

  private async requireSnapshot(snapshotId: string): Promise<void> {
    const snapshot = await this.store.getSnapshot(snapshotId);
    if (!snapshot) {
      throw new RulesetSnapshotNotFoundError(snapshotId);
    }
  }
}
