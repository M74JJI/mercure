import { describe, expect, it } from 'vitest';

import type {
  DecoderRecord,
  ParsedRuleset,
  RuleRecord,
  RulesetSourceFile,
  ValidationIssue,
} from './rules-records';
import { diffRulesets } from './rules-diff';
import { analyzeXmlRoundtrip } from './xml-roundtrip';

const emptyStats = {
  rules: 0,
  decoders: 0,
  useCases: 0,
  jiraVisible: 0,
  testing: 0,
  production: 0,
  critical: 0,
  mitreMapped: 0,
  missingUseCase: 0,
  brokenDependencies: 0,
} as const;

function file(
  name: string,
  tenant: string,
  sha256: string,
  content = '',
): RulesetSourceFile {
  return {
    name,
    tenant,
    size: content.length,
    type: 'rules',
    content,
    sha256,
  };
}

function rule(
  id: string,
  tenant: string,
  sourceFile: string,
  overrides: Partial<RuleRecord> = {},
): RuleRecord {
  return {
    id,
    level: 5,
    description: `Rule ${id}`,
    groups: ['production'],
    status: 'production',
    role: 'detection',
    severity: 'low',
    jiraVisible: false,
    tenant,
    sourceFile,
    useCaseId: 'unassigned',
    useCaseConfidence: 'unassigned',
    mitre: [],
    dependencies: [],
    fields: [],
    decodedAs: [],
    options: [],
    rawXml: `<rule id="${id}" level="5"><description>Rule ${id}</description></rule>`,
    ...overrides,
  };
}

function decoder(
  name: string,
  tenant: string,
  sourceFile: string,
  regex: readonly string[],
): DecoderRecord {
  return {
    name,
    prematch: ['sample'],
    regex,
    orderFields: ['event.action'],
    tenant,
    sourceFile,
    rawXml: `<decoder name="${name}"><regex>${regex.join('')}</regex></decoder>`,
  };
}

function issue(tenant: string): ValidationIssue {
  return {
    severity: 'warning',
    type: 'missing_decoder',
    title: 'Missing decoder',
    detail: 'Decoder dependency is not present.',
    ruleId: '100',
    fileName: `${tenant}/rules.xml`,
    tenant,
  };
}

function ruleset(input: {
  readonly files: readonly RulesetSourceFile[];
  readonly rules: readonly RuleRecord[];
  readonly decoders?: readonly DecoderRecord[];
  readonly issues?: readonly ValidationIssue[];
}): ParsedRuleset {
  return {
    files: input.files,
    rules: input.rules,
    decoders: input.decoders ?? [],
    useCases: [],
    issues: input.issues ?? [],
    stats: {
      ...emptyStats,
      rules: input.rules.length,
      decoders: input.decoders?.length ?? 0,
    },
  };
}

describe('diffRulesets', () => {
  it('isolates tenants and preserves duplicate rule occurrences', () => {
    const before = ruleset({
      files: [
        file('manager-a/rules.xml', 'manager-a', 'a'.repeat(64), 'before-a'),
        file('manager-b/rules.xml', 'manager-b', 'b'.repeat(64), 'before-b'),
      ],
      rules: [
        rule('100', 'manager-a', 'manager-a/rules.xml', {
          useCaseId: 'uc_old',
          useCaseConfidence: 'confirmed',
          mitre: ['T1059.001'],
        }),
        rule('100', 'manager-b', 'manager-b/rules.xml'),
        rule('200', 'manager-a', 'manager-a/rules.xml', {
          description: 'Duplicate first',
        }),
        rule('200', 'manager-a', 'manager-a/rules.xml', {
          description: 'Duplicate second',
          level: 4,
        }),
      ],
      decoders: [
        decoder('shared_decoder', 'manager-a', 'manager-a/rules.xml', ['old']),
        decoder('shared_decoder', 'manager-b', 'manager-b/rules.xml', ['stable']),
      ],
      issues: [issue('manager-a')],
    });

    const after = ruleset({
      files: [
        file('manager-a/rules.xml', 'manager-a', 'c'.repeat(64), 'after-a-content'),
        file('manager-b/rules.xml', 'manager-b', 'b'.repeat(64), 'before-b'),
      ],
      rules: [
        rule('100', 'manager-a', 'manager-a/rules.xml', {
          level: 12,
          severity: 'critical',
          jiraVisible: true,
          useCaseId: 'uc_new',
          useCaseConfidence: 'confirmed',
          mitre: ['T1059.001', 'T1562.001'],
        }),
        rule('100', 'manager-b', 'manager-b/rules.xml'),
        rule('200', 'manager-a', 'manager-a/rules.xml', {
          description: 'Duplicate first',
        }),
        rule('200', 'manager-a', 'manager-a/rules.xml', {
          description: 'Duplicate second',
          level: 7,
        }),
      ],
      decoders: [
        decoder('shared_decoder', 'manager-a', 'manager-a/rules.xml', ['new']),
        decoder('shared_decoder', 'manager-b', 'manager-b/rules.xml', ['stable']),
      ],
      issues: [issue('manager-b')],
    });

    const diff = diffRulesets(before, after);

    expect(diff.summary).toMatchObject({
      rulesAdded: 0,
      rulesRemoved: 0,
      rulesChanged: 2,
      decodersChanged: 1,
      filesChanged: 1,
      useCasesAdded: 1,
      useCasesRemoved: 1,
      newIssues: 1,
      resolvedIssues: 1,
      jiraVisibilityChanged: 1,
      severityChanged: 1,
      mitreChanged: 1,
      useCaseChanged: 1,
    });
    expect(diff.rules.changed.map((item) => item.key)).toEqual([
      'manager-a:100',
      'manager-a:200#2',
    ]);
    expect(diff.rules.changed.some((item) => item.key.startsWith('manager-b:100'))).toBe(false);
    expect(diff.decoders.changed[0]?.key).toBe('manager-a:shared_decoder');
    expect(diff.files.changed[0]?.changes).toContain('sha256/content changed');
    expect(diff.issues.resolved[0]?.before?.tenant).toBe('manager-a');
    expect(diff.issues.added[0]?.after?.tenant).toBe('manager-b');
  });
});

describe('analyzeXmlRoundtrip', () => {
  it('keeps source and group analysis tenant-scoped', () => {
    const managerAContent = [
      '<!-- Source file: 1100-one.xml -->',
      '<!-- Source file: 1100-two.xml -->',
      '<!--',
      '  <rule id="110099" level="3">',
      '    <description>Disabled sample rule</description>',
      '  </rule>',
      '-->',
    ].join('\n');

    const data = ruleset({
      files: [
        file('manager-a/rules.xml', 'manager-a', 'a'.repeat(64), managerAContent),
        file('manager-b/rules.xml', 'manager-b', 'b'.repeat(64), '<group />'),
      ],
      rules: [
        rule('110001', 'manager-a', 'manager-a/rules.xml', {
          sourceSection: '1100-detections.xml',
          groups: ['active_group'],
          dependencies: [
            { type: 'if_group', value: 'active_group' },
            { type: 'if_group', value: 'shared_group' },
          ],
          rawXml:
            '<rule id="110001" level="5"><description>Needs metadata</description></rule>',
        }),
        rule('990001', 'manager-a', 'manager-a/rules.xml', {
          sourceSection: '1100-detections.xml',
          groups: ['orphan_group'],
          useCaseId: 'uc_inferred',
          useCaseConfidence: 'inferred',
        }),
        rule('110001', 'manager-b', 'manager-b/rules.xml', {
          groups: ['shared_group'],
          useCaseId: 'uc_confirmed',
          useCaseConfidence: 'confirmed',
        }),
      ],
    });

    const analysis = analyzeXmlRoundtrip(data);

    expect(analysis.summary).toMatchObject({
      sourceSections: 2,
      combinedFiles: 1,
      commentedRules: 1,
      idRangeWarnings: 1,
      missingUseCaseSuggestions: 2,
    });

    const managerASection = analysis.sourceSections.find(
      (section) =>
        section.tenant === 'manager-a' && section.sourceFile === '1100-detections.xml',
    );
    expect(managerASection).toMatchObject({
      ruleCount: 2,
      minRuleId: 110001,
      maxRuleId: 990001,
      expectedPrefix: '1100',
      idRangeStatus: 'warning',
    });

    expect(analysis.commentedRules[0]).toMatchObject({
      tenant: 'manager-a',
      fileName: 'manager-a/rules.xml',
      ruleId: '110099',
      level: '3',
      description: 'Disabled sample rule',
    });

    expect(
      analysis.groupFlows.find(
        (flow) => flow.tenant === 'manager-a' && flow.group === 'active_group',
      ),
    ).toMatchObject({ status: 'active' });

    expect(
      analysis.groupFlows.find(
        (flow) => flow.tenant === 'manager-a' && flow.group === 'shared_group',
      ),
    ).toMatchObject({
      status: 'missing_producer',
      consumedByRules: ['110001'],
    });

    expect(
      analysis.groupFlows.find(
        (flow) => flow.tenant === 'manager-b' && flow.group === 'shared_group',
      ),
    ).toMatchObject({
      status: 'orphan_producer',
      producedByRules: ['110001'],
    });

    const suggestion = analysis.missingUseCaseSuggestions.find(
      (item) => item.tenant === 'manager-a' && item.ruleId === '110001',
    );
    expect(suggestion).toMatchObject({
      useCaseId: 'uc_todo_assign',
      insertLine: '<info type="text">use_case:uc_todo_assign</info>',
    });
    expect(suggestion?.suggestedXml).toContain(
      '<description>Needs metadata</description>\n  <info type="text">use_case:uc_todo_assign</info>',
    );

    const splitFile = analysis.splitFiles.find(
      (item) =>
        item.tenant === 'manager-a' && item.sourceSection === '1100-detections.xml',
    );
    expect(splitFile?.fileName).toBe('manager-a__1100-detections.xml');
    expect(splitFile?.xml).toContain('Tenant: manager-a');
    expect(splitFile?.xml).toContain('<rule id="110001"');
    expect(splitFile?.xml).toContain('<rule id="990001"');
  });
});
