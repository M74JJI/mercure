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
  readonly position: number;
  readonly id: string;
  readonly level: number;
  readonly description: string;
  readonly status: string;
  readonly severity: string;
  readonly jiraVisible: boolean;
  readonly tenant: string;
  readonly sourceFilePosition: number;
  readonly useCaseId: string;
  readonly mitre: readonly string[];
}

export interface RulesDecoderPreviewView {
  readonly position: number;
  readonly name: string;
  readonly parent?: string;
  readonly tenant: string;
  readonly sourceFile: string;
  readonly sourceFilePosition: number;
}

export interface RulesIssuePreviewView {
  readonly position: number;
  readonly severity: string;
  readonly type: string;
  readonly title: string;
  readonly detail: string;
  readonly ruleId?: string;
  readonly decoderName?: string;
  readonly tenant?: string;
}

export interface RulesRuleDetailView extends RulesRulePreviewView {
  readonly groups: readonly string[];
  readonly role: string;
  readonly sourceFile: string;
  readonly sourceSection?: string;
  readonly useCaseConfidence: string;
  readonly dependencies: readonly { readonly type: string; readonly value: string }[];
  readonly fields: readonly { readonly name: string; readonly type?: string; readonly value: string }[];
  readonly frequency?: string;
  readonly timeframe?: string;
  readonly decodedAs: readonly string[];
  readonly options: readonly string[];
}

export interface RulesDecoderDetailView extends RulesDecoderPreviewView {
  readonly prematch: readonly string[];
  readonly regex: readonly string[];
  readonly orderFields: readonly string[];
}

export interface RulesIssueDetailView extends RulesIssuePreviewView {
  readonly fileName?: string;
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

export interface RulesQualityDetailView {
  readonly kind: 'rules' | 'use_cases';
  readonly stats: {
    readonly averageOverall: number;
    readonly excellent: number;
    readonly good: number;
    readonly needsReview: number;
    readonly risky: number;
    readonly broken: number;
    readonly jiraReady: number;
    readonly noisyCandidates: number;
    readonly weakDecoderConfidence: number;
    readonly weakMitreQuality: number;
  };
  readonly rules?: {
    readonly offset: number;
    readonly limit: number;
    readonly total: number;
    readonly items: readonly {
      readonly key: string;
      readonly tenant: string;
      readonly ruleId: string;
      readonly description: string;
      readonly useCaseId: string;
      readonly level: number;
      readonly role: string;
      readonly status: string;
      readonly jiraVisible: boolean;
      readonly overall: number;
      readonly grade: string;
      readonly dimensions: {
        readonly quality: number;
        readonly noiseControl: number;
        readonly decoderConfidence: number;
        readonly dependencyHealth: number;
        readonly mitreQuality: number;
        readonly jiraReadiness: number;
        readonly qaReadiness: number;
        readonly clientReadiness: number;
      };
      readonly strengths: readonly string[];
      readonly warnings: readonly string[];
      readonly recommendations: readonly string[];
    }[];
  };
  readonly useCases?: {
    readonly offset: number;
    readonly limit: number;
    readonly total: number;
    readonly items: readonly {
      readonly key: string;
      readonly tenant: string;
      readonly useCaseId: string;
      readonly rules: number;
      readonly jiraVisible: number;
      readonly average: number;
      readonly grade: string;
      readonly weakSignals: readonly string[];
    }[];
  };
}

export interface RulesGraphDetailView {
  readonly graph: {
    readonly nodes: readonly {
      readonly id: string;
      readonly type: 'rule' | 'decoder' | 'use_case' | 'mitre' | 'field' | 'group' | 'external';
      readonly label: string;
      readonly weight: number;
      readonly tenant?: string;
      readonly entityId?: string;
      readonly meta?: Readonly<Record<string, string | number | boolean>>;
    }[];
    readonly edges: readonly {
      readonly id: string;
      readonly source: string;
      readonly target: string;
      readonly type:
        | 'if_sid'
        | 'if_group'
        | 'if_matched_sid'
        | 'if_matched_group'
        | 'decoded_as'
        | 'decoder_parent'
        | 'group_produces'
        | 'field_produces'
        | 'field_uses'
        | 'use_case'
        | 'mitre';
      readonly label: string;
      readonly weight: number;
    }[];
    readonly stats: {
      readonly nodes: number;
      readonly edges: number;
      readonly rules: number;
      readonly decoders: number;
      readonly fields: number;
      readonly groups: number;
      readonly useCases: number;
      readonly mitre: number;
      readonly external: number;
    };
  };
}

export interface RulesDiagnosticsDetailView {
  readonly summary: {
    readonly sourceSections: number;
    readonly combinedFiles: number;
    readonly commentedRules: number;
    readonly idRangeWarnings: number;
    readonly orphanGroups: number;
    readonly missingGroupProducers: number;
    readonly missingUseCaseSuggestions: number;
  };
  readonly sourceSections: {
    readonly offset: number;
    readonly limit: number;
    readonly total: number;
    readonly items: readonly {
      readonly key: string;
      readonly tenant: string;
      readonly sourceFile: string;
      readonly hostFile: string;
      readonly ruleCount: number;
      readonly minRuleId?: number;
      readonly maxRuleId?: number;
      readonly expectedPrefix?: string;
      readonly idRangeStatus: 'pass' | 'warning' | 'unknown';
      readonly statusSummary: string;
    }[];
  };
  readonly commentedRules: {
    readonly total: number;
    readonly items: readonly {
      readonly tenant: string;
      readonly fileName: string;
      readonly ruleId: string;
      readonly level?: string;
      readonly description?: string;
    }[];
  };
  readonly groupFlows: {
    readonly total: number;
    readonly items: readonly {
      readonly tenant: string;
      readonly group: string;
      readonly producedByRules: readonly string[];
      readonly consumedByRules: readonly string[];
      readonly status: 'active' | 'orphan_producer' | 'missing_producer';
    }[];
  };
  readonly missingUseCaseSuggestions: {
    readonly total: number;
    readonly items: readonly {
      readonly tenant: string;
      readonly ruleId: string;
      readonly sourceFile: string;
      readonly sourceSection?: string;
      readonly useCaseId: string;
      readonly confidence: 'confirmed' | 'inferred' | 'unassigned';
      readonly placement: string;
    }[];
  };
}

export interface RulesUseCaseDetailView extends RulesUseCasePreviewView {
  readonly createdBy: string;
  readonly createdAt?: string;
}


export interface RulesAuthoringValidationIssueView {
  readonly severity: 'error' | 'warning' | 'info';
  readonly type: string;
  readonly title: string;
  readonly detail: string;
  readonly ruleId?: string;
  readonly decoderName?: string;
  readonly fileName?: string;
  readonly tenant?: string;
}

export interface RulesAuthoringValidationView {
  readonly revision: number;
  readonly sha256: string;
  readonly ruleCount: number;
  readonly decoderCount: number;
  readonly issueCount: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
  readonly validatedAt: string;
}

export interface RulesAuthoringDraftSummaryView {
  readonly id: string;
  readonly sourceSnapshotId: string;
  readonly sourceFilePosition: number;
  readonly fileName: string;
  readonly tenant: string;
  readonly sourceType: 'rules' | 'decoders';
  readonly sha256: string;
  readonly revision: number;
  readonly state: 'draft' | 'validated' | 'approved';
  readonly createdBy: string;
  readonly updatedBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly validation?: RulesAuthoringValidationView;
  readonly approvedRevision?: number;
  readonly approvedSha256?: string;
  readonly approvedBy?: string;
  readonly approvedAt?: string;
}

export interface RulesAuthoringDraftView extends RulesAuthoringDraftSummaryView {
  readonly content: string;
  readonly validation?: RulesAuthoringValidationView & {
    readonly issues: readonly RulesAuthoringValidationIssueView[];
  };
}
