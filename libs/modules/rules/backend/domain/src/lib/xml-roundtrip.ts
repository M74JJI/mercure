import type {
  ParsedRuleset,
  RuleRecord,
  RulesetSourceFile,
  UseCaseConfidence,
} from './rules-records';

export interface SourceSectionRecord {
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
}

export interface CommentedRuleRecord {
  readonly tenant: string;
  readonly fileName: string;
  readonly ruleId: string;
  readonly level?: string;
  readonly description?: string;
  readonly snippet: string;
}

export interface GroupFlowRecord {
  readonly tenant: string;
  readonly group: string;
  readonly producedByRules: readonly string[];
  readonly consumedByRules: readonly string[];
  readonly status: 'active' | 'orphan_producer' | 'missing_producer';
}

export interface RoundtripPatchSuggestion {
  readonly tenant: string;
  readonly ruleId: string;
  readonly sourceFile: string;
  readonly sourceSection?: string;
  readonly useCaseId: string;
  readonly confidence: UseCaseConfidence;
  readonly insertLine: string;
  readonly suggestedXml: string;
  readonly placement: string;
}

export interface SplitXmlRecord {
  readonly tenant: string;
  readonly sourceSection: string;
  readonly fileName: string;
  readonly ruleCount: number;
  readonly xml: string;
}

export interface XmlRoundtripAnalysis {
  readonly sourceSections: readonly SourceSectionRecord[];
  readonly commentedRules: readonly CommentedRuleRecord[];
  readonly groupFlows: readonly GroupFlowRecord[];
  readonly missingUseCaseSuggestions: readonly RoundtripPatchSuggestion[];
  readonly splitFiles: readonly SplitXmlRecord[];
  readonly summary: {
    readonly sourceSections: number;
    readonly combinedFiles: number;
    readonly commentedRules: number;
    readonly idRangeWarnings: number;
    readonly orphanGroups: number;
    readonly missingGroupProducers: number;
    readonly missingUseCaseSuggestions: number;
  };
}

interface SectionGroup {
  readonly tenant: string;
  readonly section: string;
  readonly rules: RuleRecord[];
}

function sectionMapKey(tenant: string, section: string): string {
  return JSON.stringify([tenant, section]);
}

function normalizeSection(rule: RuleRecord): string {
  return rule.sourceSection ?? rule.sourceFile ?? 'unknown-source';
}

function sanitizeCommentValue(value: string): string {
  return value.replaceAll('--', '—').trim();
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]+/g, '_').replace(/^_+|_+$/g, '');
}

function extractSectionPrefix(section: string): string | undefined {
  return section.match(/(\d{4})[-_]/)?.[1];
}

function compareRuleIds(left: string, right: string): number {
  const leftNumber = Number(left);
  const rightNumber = Number(right);

  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber;
  }

  return left.localeCompare(right);
}

function expectedPrefixStatus(
  section: string,
  rules: readonly RuleRecord[],
): Pick<SourceSectionRecord, 'expectedPrefix' | 'idRangeStatus' | 'statusSummary'> {
  const prefix = extractSectionPrefix(section);

  if (!prefix) {
    return {
      idRangeStatus: 'unknown',
      statusSummary: 'No numeric section prefix was detected.',
    };
  }

  const expectedPrefix = prefix.replace(/^0+/, '');
  if (!expectedPrefix) {
    return {
      expectedPrefix: prefix,
      idRangeStatus: 'unknown',
      statusSummary: 'The numeric section prefix cannot define a non-zero rule range.',
    };
  }

  const mismatches = rules.filter((rule) => !rule.id.startsWith(expectedPrefix));

  if (mismatches.length === 0) {
    return {
      expectedPrefix,
      idRangeStatus: 'pass',
      statusSummary: `All rules match expected ${expectedPrefix}xx range.`,
    };
  }

  return {
    expectedPrefix,
    idRangeStatus: 'warning',
    statusSummary: `${mismatches.length} rules do not match expected ${expectedPrefix}xx range.`,
  };
}

function extractCommentedRules(files: readonly RulesetSourceFile[]): CommentedRuleRecord[] {
  const results: CommentedRuleRecord[] = [];
  const commentPattern = /<!--[\s\S]*?-->/g;
  const rulePattern = /<rule\b[\s\S]*?<\/rule>/gi;

  for (const file of files) {
    for (const commentMatch of file.content.matchAll(commentPattern)) {
      const comment = commentMatch[0];
      if (!/<rule\b/i.test(comment)) continue;

      for (const ruleMatch of comment.matchAll(rulePattern)) {
        const block = ruleMatch[0];
        const ruleId = block.match(/id=["']([^"']+)["']/i)?.[1] ?? 'unknown';
        const level = block.match(/level=["']([^"']+)["']/i)?.[1];
        const description = block.match(/<description>([\s\S]*?)<\/description>/i)?.[1]?.trim();

        results.push({
          tenant: file.tenant,
          fileName: file.name,
          ruleId,
          ...(level === undefined ? {} : { level }),
          ...(description === undefined ? {} : { description }),
          snippet: block.slice(0, 2_000),
        });
      }
    }
  }

  return results.sort(
    (left, right) =>
      left.tenant.localeCompare(right.tenant) ||
      left.fileName.localeCompare(right.fileName) ||
      compareRuleIds(left.ruleId, right.ruleId),
  );
}

function buildSplitXml(tenant: string, section: string, rules: readonly RuleRecord[]): string {
  const safeTenant = sanitizeCommentValue(tenant) || 'unknown';
  const safeSection = sanitizeCommentValue(section) || 'reconstructed_rules.xml';
  const header = [
    '<!--',
    '  Reconstructed from an immutable Mercure Rules snapshot.',
    `  Tenant: ${safeTenant}`,
    `  Source section: ${safeSection}`,
    '  Generated by Mercure XML round-trip analysis.',
    '-->',
    '<group name="reconstructed,roundtrip,">',
  ].join('\n');
  const body = rules.map((rule) => rule.rawXml.trim()).join('\n\n');

  return `${header}\n\n${body}\n\n</group>\n`;
}

function buildPatchSuggestion(rule: RuleRecord): RoundtripPatchSuggestion {
  const useCaseId = rule.useCaseId === 'unassigned' ? 'uc_todo_assign' : rule.useCaseId;
  const insertLine = `<info type="text">use_case:${useCaseId}</info>`;
  let suggestedXml = rule.rawXml;

  if (/<info\b[^>]*>\s*use_case:/i.test(rule.rawXml)) {
    suggestedXml = rule.rawXml;
  } else if (/<description>[\s\S]*?<\/description>/i.test(rule.rawXml)) {
    suggestedXml = rule.rawXml.replace(
      /(<description>[\s\S]*?<\/description>)/i,
      `$1\n  ${insertLine}`,
    );
  } else {
    suggestedXml = rule.rawXml.replace(/(<rule\b[^>]*>)/i, `$1\n  ${insertLine}`);
  }

  return {
    tenant: rule.tenant,
    ruleId: rule.id,
    sourceFile: rule.sourceFile,
    ...(rule.sourceSection === undefined ? {} : { sourceSection: rule.sourceSection }),
    useCaseId,
    confidence: rule.useCaseConfidence,
    insertLine,
    suggestedXml,
    placement:
      'Insert immediately after <description> when available; otherwise after the opening <rule> tag.',
  };
}

function sectionGroups(rules: readonly RuleRecord[]): readonly SectionGroup[] {
  const grouped = new Map<string, SectionGroup>();

  for (const rule of rules) {
    const section = normalizeSection(rule);
    const key = sectionMapKey(rule.tenant, section);
    const existing = grouped.get(key);

    if (existing) {
      existing.rules.push(rule);
    } else {
      grouped.set(key, {
        tenant: rule.tenant,
        section,
        rules: [rule],
      });
    }
  }

  return [...grouped.values()].sort(
    (left, right) =>
      left.tenant.localeCompare(right.tenant) || left.section.localeCompare(right.section),
  );
}

function buildSourceSections(groups: readonly SectionGroup[]): readonly SourceSectionRecord[] {
  return groups.map(({ tenant, section, rules }) => {
    const numericIds = rules.map((rule) => Number(rule.id)).filter(Number.isFinite);
    const status = expectedPrefixStatus(section, rules);

    return {
      key: `${tenant}:${section}`,
      tenant,
      sourceFile: section,
      hostFile: rules[0]?.sourceFile ?? 'unknown',
      ruleCount: rules.length,
      ...(numericIds.length === 0
        ? {}
        : {
            minRuleId: Math.min(...numericIds),
            maxRuleId: Math.max(...numericIds),
          }),
      ...status,
    };
  });
}

function buildGroupFlows(rules: readonly RuleRecord[]): readonly GroupFlowRecord[] {
  const produced = new Map<string, Set<string>>();
  const consumed = new Map<string, Set<string>>();
  const metadata = new Map<string, { readonly tenant: string; readonly group: string }>();

  for (const rule of rules) {
    for (const group of rule.groups) {
      const key = sectionMapKey(rule.tenant, group);
      metadata.set(key, { tenant: rule.tenant, group });

      const producerSet = produced.get(key) ?? new Set<string>();
      producerSet.add(rule.id);
      produced.set(key, producerSet);
    }

    for (const dependency of rule.dependencies) {
      if (dependency.type !== 'if_group' && dependency.type !== 'if_matched_group') continue;

      const key = sectionMapKey(rule.tenant, dependency.value);
      metadata.set(key, { tenant: rule.tenant, group: dependency.value });

      const consumerSet = consumed.get(key) ?? new Set<string>();
      consumerSet.add(rule.id);
      consumed.set(key, consumerSet);
    }
  }

  return [...metadata.entries()]
    .map(([key, { tenant, group }]) => {
      const producedByRules = [...(produced.get(key) ?? new Set<string>())].sort(compareRuleIds);
      const consumedByRules = [...(consumed.get(key) ?? new Set<string>())].sort(compareRuleIds);
      const status: GroupFlowRecord['status'] =
        producedByRules.length === 0
          ? 'missing_producer'
          : consumedByRules.length === 0
            ? 'orphan_producer'
            : 'active';

      return {
        tenant,
        group,
        producedByRules,
        consumedByRules,
        status,
      };
    })
    .sort(
      (left, right) =>
        left.tenant.localeCompare(right.tenant) || left.group.localeCompare(right.group),
    );
}

function buildSplitFiles(groups: readonly SectionGroup[]): readonly SplitXmlRecord[] {
  return groups.map(({ tenant, section, rules }) => {
    const baseName = sanitizeFileName(section) || 'reconstructed_rules.xml';
    const tenantPrefix = sanitizeFileName(tenant) || 'unknown';

    return {
      tenant,
      sourceSection: section,
      fileName: `${tenantPrefix}__${baseName}`,
      ruleCount: rules.length,
      xml: buildSplitXml(tenant, section, rules),
    };
  });
}

export function analyzeXmlRoundtrip(data: ParsedRuleset): XmlRoundtripAnalysis {
  const groups = sectionGroups(data.rules);
  const sourceSections = buildSourceSections(groups);
  const groupFlows = buildGroupFlows(data.rules);
  const commentedRules = extractCommentedRules(data.files);
  const missingUseCaseSuggestions = data.rules
    .filter((rule) => rule.useCaseConfidence !== 'confirmed')
    .map(buildPatchSuggestion)
    .sort(
      (left, right) =>
        left.tenant.localeCompare(right.tenant) || compareRuleIds(left.ruleId, right.ruleId),
    );
  const splitFiles = buildSplitFiles(groups);

  return {
    sourceSections,
    commentedRules,
    groupFlows,
    missingUseCaseSuggestions,
    splitFiles,
    summary: {
      sourceSections: sourceSections.length,
      combinedFiles: data.files.filter(
        (file) => (file.content.match(/Source file:/gi) ?? []).length > 1,
      ).length,
      commentedRules: commentedRules.length,
      idRangeWarnings: sourceSections.filter((section) => section.idRangeStatus === 'warning').length,
      orphanGroups: groupFlows.filter((flow) => flow.status === 'orphan_producer').length,
      missingGroupProducers: groupFlows.filter((flow) => flow.status === 'missing_producer').length,
      missingUseCaseSuggestions: missingUseCaseSuggestions.length,
    },
  };
}
