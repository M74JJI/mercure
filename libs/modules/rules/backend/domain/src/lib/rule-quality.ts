import type { ParsedRuleset, RuleRecord } from './rules-records';

export type QualityDimension =
  | 'quality'
  | 'noiseControl'
  | 'decoderConfidence'
  | 'dependencyHealth'
  | 'mitreQuality'
  | 'jiraReadiness'
  | 'qaReadiness'
  | 'clientReadiness';

export type QualityGrade = 'excellent' | 'good' | 'needs_review' | 'risky' | 'broken';

export interface RuleQualityScore {
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
  readonly grade: QualityGrade;
  readonly dimensions: Readonly<Record<QualityDimension, number>>;
  readonly strengths: readonly string[];
  readonly warnings: readonly string[];
  readonly recommendations: readonly string[];
}

export interface UseCaseQualityScore {
  readonly key: string;
  readonly tenant: string;
  readonly useCaseId: string;
  readonly rules: number;
  readonly jiraVisible: number;
  readonly average: number;
  readonly grade: QualityGrade;
  readonly weakSignals: readonly string[];
}

export interface QualitySummary {
  readonly rules: readonly RuleQualityScore[];
  readonly useCases: readonly UseCaseQualityScore[];
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
}

interface TenantQualityContext {
  readonly decoderNames: ReadonlySet<string>;
  readonly ruleIds: ReadonlySet<string>;
  readonly groupProducers: ReadonlySet<string>;
  readonly producedFields: ReadonlySet<string>;
  readonly decoderCount: number;
}

function scopedKey(tenant: string, value: string): string {
  return JSON.stringify([tenant, value]);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(items: readonly number[]): number {
  return items.length ? Math.round(items.reduce((sum, value) => sum + value, 0) / items.length) : 0;
}

function gradeOf(score: number): QualityGrade {
  if (score >= 88) return 'excellent';
  if (score >= 74) return 'good';
  if (score >= 58) return 'needs_review';
  if (score >= 40) return 'risky';
  return 'broken';
}

function normalizeField(value: string): string {
  return value.trim().toLowerCase();
}

function ruleFields(rule: RuleRecord): readonly string[] {
  const fields: string[] = [];

  for (const field of rule.fields) {
    const name = normalizeField(field.name);
    if (!name || name === 'match') continue;

    if (name === 'same_field' || name === 'different_field') {
      const referenced = normalizeField(field.value);
      if (referenced) fields.push(referenced);
      continue;
    }

    fields.push(name);
  }

  return [...new Set(fields)];
}

function buildTenantContexts(data: ParsedRuleset): ReadonlyMap<string, TenantQualityContext> {
  const tenants = new Set([
    ...data.rules.map((rule) => rule.tenant),
    ...data.decoders.map((decoder) => decoder.tenant),
  ]);
  const contexts = new Map<string, TenantQualityContext>();

  for (const tenant of tenants) {
    const rules = data.rules.filter((rule) => rule.tenant === tenant);
    const decoders = data.decoders.filter((decoder) => decoder.tenant === tenant);
    contexts.set(tenant, {
      decoderNames: new Set(decoders.map((decoder) => decoder.name)),
      ruleIds: new Set(rules.map((rule) => rule.id)),
      groupProducers: new Set(rules.flatMap((rule) => rule.groups)),
      producedFields: new Set(
        decoders.flatMap((decoder) => decoder.orderFields.map(normalizeField)).filter(Boolean),
      ),
      decoderCount: decoders.length,
    });
  }

  return contexts;
}

function scoreRule(rule: RuleRecord, context: TenantQualityContext): RuleQualityScore {
  const strengths: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const groups = new Set(rule.groups);

  let quality = 65;
  if (rule.description.length >= 18) {
    quality += 12;
    strengths.push('Clear rule description.');
  } else {
    quality -= 12;
    warnings.push('Description is missing or too short.');
  }

  if (rule.groups.length >= 3) {
    quality += 8;
    strengths.push('Uses multiple group tokens for classification.');
  } else {
    quality -= 8;
    warnings.push('Weak group classification.');
  }

  if (rule.useCaseConfidence === 'confirmed') {
    quality += 10;
    strengths.push('Confirmed use_case metadata exists.');
  } else if (rule.useCaseConfidence === 'inferred') {
    quality -= 3;
    warnings.push('Use case is inferred, not confirmed by <info>.');
    recommendations.push('Add explicit use_case metadata for the inferred use-case ID.');
  } else {
    quality -= 18;
    warnings.push('Rule has no use-case mapping.');
    recommendations.push('Assign a canonical Rules use case.');
  }

  if (
    rule.rawXml.includes('<options>no_full_log</options>') ||
    rule.options.includes('no_full_log')
  ) {
    quality += 2;
  }

  let noiseControl = 100;
  if (rule.role === 'correlation') {
    noiseControl += 8;
    strengths.push('Correlation logic lowers single-event noise.');
  }
  if (rule.frequency || rule.timeframe) noiseControl += 8;
  if (rule.level <= 5 && rule.jiraVisible) noiseControl -= 30;
  if (
    rule.level >= 11 &&
    rule.mitre.length === 0 &&
    !['helper', 'parser_health'].includes(rule.role)
  ) {
    noiseControl -= 12;
  }
  if (rule.role === 'detection' && rule.level >= 11 && !(rule.frequency || rule.timeframe)) {
    noiseControl -= 18;
    warnings.push('High/Jira-visible single-event detection may be noisy.');
    recommendations.push('Consider correlation thresholds, allowlists, or lower ticketing level.');
  }
  if (groups.has('authentication_success') && rule.jiraVisible) {
    noiseControl -= 18;
    warnings.push('Successful authentication alert is Jira-visible; confirm this is intentional.');
  }

  let decoderConfidence = 60;
  if (rule.decodedAs.length > 0) {
    const missing = rule.decodedAs.filter((decoder) => !context.decoderNames.has(decoder));
    if (missing.length > 0) {
      decoderConfidence -= 30;
      warnings.push(`decoded_as references missing tenant decoder(s): ${missing.join(', ')}.`);
    } else {
      decoderConfidence += 25;
      strengths.push('decoded_as references tenant decoder(s).');
    }
  } else if (rule.dependencies.length > 0) {
    decoderConfidence += 10;
  } else {
    decoderConfidence -= 8;
    warnings.push('No direct decoder or dependency context detected.');
  }

  const usedFields = ruleFields(rule);
  if (usedFields.length > 0) decoderConfidence += 8;
  const unknownFields = usedFields.filter((field) => !context.producedFields.has(field));
  if (unknownFields.length > 0 && context.decoderCount > 0) {
    decoderConfidence -= Math.min(25, unknownFields.length * 5);
    warnings.push(
      `Some rule fields are not produced by tenant decoders: ${unknownFields.slice(0, 6).join(', ')}.`,
    );
  }

  let dependencyHealth = 85;
  for (const dependency of rule.dependencies) {
    if (
      (dependency.type === 'if_sid' || dependency.type === 'if_matched_sid') &&
      !context.ruleIds.has(dependency.value)
    ) {
      warnings.push(
        `Dependency SID ${dependency.value} is unresolved in this snapshot; it may be provided by stock or external rules.`,
      );
      recommendations.push(
        `Resolve SID ${dependency.value} against the target Wazuh ruleset before treating it as broken.`,
      );
    }

    if (
      (dependency.type === 'if_group' || dependency.type === 'if_matched_group') &&
      !context.groupProducers.has(dependency.value)
    ) {
      warnings.push(
        `Dependency group ${dependency.value} is unresolved in this snapshot; it may be produced by stock or external rules.`,
      );
      recommendations.push(
        `Resolve group ${dependency.value} against the target Wazuh ruleset before treating it as broken.`,
      );
    }
  }
  if (rule.dependencies.length === 0 && rule.role !== 'helper') dependencyHealth -= 5;
  if (rule.role === 'correlation' && !(rule.frequency || rule.timeframe)) {
    dependencyHealth -= 20;
    warnings.push('Correlation-like rule lacks frequency/timeframe.');
  }

  let mitreQuality = 70;
  if (rule.role === 'helper' && rule.mitre.length > 0) {
    mitreQuality -= 25;
    warnings.push('Helper rule has MITRE mapping; verify this is intentional.');
  }
  if (rule.role !== 'helper' && rule.level >= 8 && rule.mitre.length > 0) {
    mitreQuality += 20;
    strengths.push('Detection has MITRE mapping.');
  }
  if (rule.role !== 'helper' && rule.level >= 11 && rule.mitre.length === 0) {
    mitreQuality -= 25;
    recommendations.push('Add MITRE technique mapping or document why it is not applicable.');
  }
  if (rule.mitre.length > 3) {
    mitreQuality -= 6;
    warnings.push('Many MITRE IDs on one rule; verify mapping precision.');
  }

  let jiraReadiness = rule.jiraVisible ? 70 : 55;
  if (!rule.jiraVisible) jiraReadiness += rule.role === 'helper' ? 30 : 8;
  if (rule.jiraVisible && rule.useCaseId !== 'unassigned') jiraReadiness += 10;
  if (rule.jiraVisible && rule.mitre.length > 0) jiraReadiness += 8;
  if (
    rule.jiraVisible &&
    warnings.some((warning) => /missing|not produced|No tenant producer/.test(warning))
  ) {
    jiraReadiness -= 25;
  }
  if (rule.jiraVisible && rule.status === 'testing') {
    jiraReadiness -= 8;
    recommendations.push('Review whether testing Jira-visible rules should be promoted or hidden.');
  }

  let qaReadiness = 50;
  if (rule.jiraVisible) qaReadiness += 10;
  if (rule.role === 'correlation') qaReadiness += 10;
  if (rule.useCaseConfidence === 'confirmed') qaReadiness += 10;
  if (rule.mitre.length > 0) qaReadiness += 6;
  recommendations.push(
    'Attach at least one positive and one negative QA test case for high-impact rules.',
  );

  let clientReadiness = 65;
  if (rule.useCaseId !== 'unassigned') clientReadiness += 10;
  if (rule.status === 'production') clientReadiness += 8;
  if (rule.status === 'testing' && rule.jiraVisible) clientReadiness -= 10;
  if (warnings.length > 3) clientReadiness -= 12;

  const dimensions: Readonly<Record<QualityDimension, number>> = {
    quality: clamp(quality),
    noiseControl: clamp(noiseControl),
    decoderConfidence: clamp(decoderConfidence),
    dependencyHealth: clamp(dependencyHealth),
    mitreQuality: clamp(mitreQuality),
    jiraReadiness: clamp(jiraReadiness),
    qaReadiness: clamp(qaReadiness),
    clientReadiness: clamp(clientReadiness),
  };
  const overall = average(Object.values(dimensions));

  return {
    key: scopedKey(rule.tenant, rule.id),
    tenant: rule.tenant,
    ruleId: rule.id,
    description: rule.description,
    useCaseId: rule.useCaseId,
    level: rule.level,
    role: rule.role,
    status: rule.status,
    jiraVisible: rule.jiraVisible,
    overall,
    grade: gradeOf(overall),
    dimensions,
    strengths: strengths.slice(0, 5),
    warnings: [...new Set(warnings)].slice(0, 8),
    recommendations: [...new Set(recommendations)].slice(0, 8),
  };
}

export function buildQualitySummary(data: ParsedRuleset): QualitySummary {
  const contexts = buildTenantContexts(data);
  const rules = data.rules
    .map((rule) => {
      const context = contexts.get(rule.tenant) ?? {
        decoderNames: new Set<string>(),
        ruleIds: new Set<string>(),
        groupProducers: new Set<string>(),
        producedFields: new Set<string>(),
        decoderCount: 0,
      };
      return scoreRule(rule, context);
    })
    .sort(
      (left, right) =>
        left.overall - right.overall ||
        right.level - left.level ||
        left.tenant.localeCompare(right.tenant) ||
        left.ruleId.localeCompare(right.ruleId),
    );

  const byUseCase = new Map<string, RuleQualityScore[]>();
  for (const rule of rules) {
    const key = scopedKey(rule.tenant, rule.useCaseId);
    byUseCase.set(key, [...(byUseCase.get(key) ?? []), rule]);
  }

  const useCases = [...byUseCase.entries()]
    .map(([key, groupedRules]): UseCaseQualityScore => {
      const [tenant, useCaseId] = JSON.parse(key) as [string, string];
      const averageScore = average(groupedRules.map((rule) => rule.overall));
      const weakSignals = [
        groupedRules.some((rule) => rule.useCaseId === 'unassigned') ? 'unassigned rules' : '',
        groupedRules.some((rule) => rule.dimensions.mitreQuality < 60) ? 'weak MITRE quality' : '',
        groupedRules.some((rule) => rule.dimensions.decoderConfidence < 60)
          ? 'decoder confidence gaps'
          : '',
        groupedRules.some((rule) => rule.jiraVisible && rule.dimensions.jiraReadiness < 70)
          ? 'Jira readiness gaps'
          : '',
      ].filter(Boolean);

      return {
        key,
        tenant,
        useCaseId,
        rules: groupedRules.length,
        jiraVisible: groupedRules.filter((rule) => rule.jiraVisible).length,
        average: averageScore,
        grade: gradeOf(averageScore),
        weakSignals,
      };
    })
    .sort(
      (left, right) =>
        left.average - right.average ||
        left.tenant.localeCompare(right.tenant) ||
        left.useCaseId.localeCompare(right.useCaseId),
    );

  return {
    rules,
    useCases,
    stats: {
      averageOverall: average(rules.map((rule) => rule.overall)),
      excellent: rules.filter((rule) => rule.grade === 'excellent').length,
      good: rules.filter((rule) => rule.grade === 'good').length,
      needsReview: rules.filter((rule) => rule.grade === 'needs_review').length,
      risky: rules.filter((rule) => rule.grade === 'risky').length,
      broken: rules.filter((rule) => rule.grade === 'broken').length,
      jiraReady: rules.filter((rule) => rule.jiraVisible && rule.dimensions.jiraReadiness >= 75)
        .length,
      noisyCandidates: rules.filter((rule) => rule.dimensions.noiseControl < 65).length,
      weakDecoderConfidence: rules.filter((rule) => rule.dimensions.decoderConfidence < 60).length,
      weakMitreQuality: rules.filter((rule) => rule.dimensions.mitreQuality < 60).length,
    },
  };
}
