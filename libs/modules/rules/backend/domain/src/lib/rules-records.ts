export type RulesetSourceType = 'rules' | 'decoders' | 'unknown';
export type RuleSeverity = 'informational' | 'low' | 'medium' | 'high' | 'critical';
export type UseCaseConfidence = 'confirmed' | 'inferred' | 'unassigned';
export type ValidationSeverity = 'error' | 'warning' | 'info';

export type RuleDependencyType =
  | 'if_sid'
  | 'if_group'
  | 'if_matched_sid'
  | 'if_matched_group'
  | 'decoded_as';

export interface RulesetSourceFile {
  readonly name: string;
  readonly tenant: string;
  readonly size: number;
  readonly type: RulesetSourceType;
  readonly content: string;
  readonly sha256: string;
}

export interface RuleDependency {
  readonly type: RuleDependencyType;
  readonly value: string;
}

export interface RuleField {
  readonly name: string;
  readonly type?: string;
  readonly value: string;
}

export interface RuleRecord {
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
  readonly rawXml: string;
}

export interface DecoderRecord {
  readonly name: string;
  readonly parent?: string;
  readonly prematch: readonly string[];
  readonly regex: readonly string[];
  readonly orderFields: readonly string[];
  readonly tenant: string;
  readonly sourceFile: string;
  readonly rawXml: string;
}

export interface RulesUseCase {
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
  readonly createdBy: string;
  readonly createdAt?: string;
}

export interface ValidationIssue {
  readonly severity: ValidationSeverity;
  readonly type: string;
  readonly title: string;
  readonly detail: string;
  readonly ruleId?: string;
  readonly decoderName?: string;
  readonly fileName?: string;
  readonly tenant?: string;
}

export interface RulesetStats {
  readonly rules: number;
  readonly decoders: number;
  readonly useCases: number;
  readonly jiraVisible: number;
  readonly testing: number;
  readonly production: number;
  readonly critical: number;
  readonly mitreMapped: number;
  readonly missingUseCase: number;
  readonly brokenDependencies: number;
}

export interface ParsedRuleset {
  readonly files: readonly RulesetSourceFile[];
  readonly rules: readonly RuleRecord[];
  readonly decoders: readonly DecoderRecord[];
  readonly useCases: readonly RulesUseCase[];
  readonly issues: readonly ValidationIssue[];
  readonly stats: RulesetStats;
}
