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

export interface RulesFieldIntelligenceView {
  readonly stats: {
    readonly totalFields: number;
  };
  readonly page: {
    readonly total: number;
    readonly items: readonly {
      readonly key: string;
      readonly tenant: string;
      readonly field: string;
      readonly family: string;
      readonly health: string;
      readonly riskScore: number;
    }[];
  };
}

export interface RulesQualityView {
  readonly stats: {
    readonly averageOverall: number;
  };
  readonly rules?: {
    readonly total: number;
    readonly items: readonly {
      readonly key: string;
      readonly tenant: string;
      readonly ruleId: string;
      readonly useCaseId: string;
      readonly overall: number;
      readonly grade: string;
      readonly strengths: readonly string[];
      readonly warnings: readonly string[];
    }[];
  };
}

export interface RulesGraphSummaryView {
  readonly graph: {
    readonly stats: {
      readonly nodes: number;
      readonly edges: number;
      readonly rules: number;
      readonly decoders: number;
      readonly fields: number;
      readonly useCases: number;
      readonly mitre: number;
      readonly external: number;
    };
  };
}

export interface RulesRoundtripSummaryView {
  readonly summary: {
    readonly sourceSections: number;
    readonly commentedRules: number;
    readonly idRangeWarnings: number;
    readonly orphanGroups: number;
    readonly missingGroupProducers: number;
    readonly missingUseCaseSuggestions: number;
  };
}

export interface RulesUseCasePreviewView {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
  readonly component: string;
  readonly vendor: string;
  readonly product: string;
  readonly domain: string;
  readonly category: string;
  readonly source: 'system' | 'custom';
}

export interface RulesComparisonSnapshotOptionView {
  readonly id: string;
  readonly createdAt: string;
}

export interface RulesSnapshotComparisonView {
  readonly kind: 'rules' | 'decoders' | 'files' | 'use_cases' | 'issues';
  readonly summary: {
    readonly rulesAdded: number;
    readonly rulesRemoved: number;
    readonly rulesChanged: number;
    readonly newIssues: number;
  };
  readonly page: {
    readonly total: number;
    readonly items: readonly {
      readonly key: string;
      readonly state: 'added' | 'removed' | 'changed' | 'resolved';
      readonly changes: readonly string[];
    }[];
  };
}

export interface RulesFieldIntelligenceDetailView {
  readonly stats: {
    readonly totalFields: number;
    readonly producedFields: number;
    readonly usedFields: number;
    readonly unknownSourceFields: number;
    readonly orphanedProducedFields: number;
    readonly aliasCandidates: number;
    readonly criticalFields: number;
    readonly averageRisk: number;
  };
  readonly page: {
    readonly offset: number;
    readonly limit: number;
    readonly total: number;
    readonly items: readonly {
      readonly key: string;
      readonly tenant: string;
      readonly field: string;
      readonly canonical: string;
      readonly family: string;
      readonly description: string;
      readonly aliases: readonly string[];
      readonly producedByTotal: number;
      readonly usedByRulesTotal: number;
      readonly usedByUseCasesTotal: number;
      readonly jiraVisibleRules: number;
      readonly criticalRules: number;
      readonly decodedAsRulesTotal: number;
      readonly health: string;
      readonly criticality: string;
      readonly riskScore: number;
      readonly aliasHintsTotal: number;
    }[];
  };
}
