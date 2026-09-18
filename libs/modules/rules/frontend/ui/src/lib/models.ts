export interface RulesSnapshotSummaryView {
  readonly id: string;
  readonly createdAt: string;
  readonly loadedAt: string;
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

export interface RulesRulePreviewView {
  readonly id: string;
  readonly level: number;
  readonly description: string;
  readonly status: string;
  readonly severity: string;
  readonly jiraVisible: boolean;
  readonly tenant: string;
  readonly useCaseId: string;
  readonly mitre: readonly string[];
}

export interface RulesDecoderPreviewView {
  readonly name: string;
  readonly parent?: string;
  readonly tenant: string;
  readonly sourceFile: string;
}

export interface RulesIssuePreviewView {
  readonly severity: string;
  readonly type: string;
  readonly title: string;
  readonly detail: string;
  readonly ruleId?: string;
  readonly decoderName?: string;
  readonly tenant?: string;
}
