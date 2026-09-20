import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { RulesetSourceInput } from '@mercure/rules-backend-application';
import type { RulesUseCase } from '@mercure/rules-backend-domain';

import { WazuhXmlRulesetAnalyzer } from './wazuh-xml-ruleset-analyzer';

async function fixture(relativePath: string): Promise<RulesetSourceInput> {
  const absolutePath = path.join(process.cwd(), 'tests/fixtures/rules', relativePath);
  const content = await readFile(absolutePath, 'utf8');
  const sourceName = relativePath.split('/').slice(1).join('/');

  return {
    name: sourceName,
    content,
  };
}

const adminConfigUseCase: RulesUseCase = {
  id: 'uc_admin_config',
  name: 'Administrator configuration change',
  shortName: 'Admin config',
  description: 'Administrative configuration changes.',
  component: 'Fortigate',
  vendor: 'Fortinet',
  product: 'FortiGate',
  domain: 'configuration',
  category: 'administration',
  source: 'system',
  createdBy: 'mercure',
};

describe('WazuhXmlRulesetAnalyzer', () => {
  it('preserves the legacy parser behavior for normalized rule and decoder records', async () => {
    const analyzer = new WazuhXmlRulesetAnalyzer();
    const result = await analyzer.analyze({
      files: [
        await fixture('baseline/manager-a/rules/1000-sample_rules.xml'),
        await fixture('baseline/manager-a/decoders/1000-sample_decoders.xml'),
      ],
      useCases: [adminConfigUseCase],
    });

    expect(result.stats).toEqual({
      rules: 3,
      decoders: 2,
      useCases: 1,
      jiraVisible: 2,
      testing: 1,
      production: 2,
      critical: 1,
      mitreMapped: 2,
      missingUseCase: 2,
      brokenDependencies: 2,
    });

    const helper = result.rules.find((rule) => rule.id === '100001');
    expect(helper).toMatchObject({
      level: 0,
      role: 'helper',
      status: 'testing',
      severity: 'informational',
      jiraVisible: false,
      tenant: 'manager-a',
      sourceSection: '1000-base.xml',
      useCaseId: 'unassigned',
      useCaseConfidence: 'unassigned',
      mitre: ['T1059.001'],
    });

    const correlated = result.rules.find((rule) => rule.id === '110001');
    expect(correlated).toMatchObject({
      level: 12,
      role: 'correlation',
      status: 'production',
      severity: 'critical',
      jiraVisible: true,
      sourceSection: '1100-detections.xml',
      useCaseId: 'uc_admin_config',
      useCaseConfidence: 'confirmed',
      frequency: '5',
      timeframe: '60',
      decodedAs: ['sample_decoder'],
      options: ['no_full_log'],
    });
    expect(correlated?.dependencies).toEqual([
      { type: 'if_sid', value: '100001' },
      { type: 'decoded_as', value: 'sample_decoder' },
    ]);
    expect(correlated?.fields).toEqual([
      { name: 'event.action', type: 'pcre2', value: 'config_change' },
      { name: 'match', value: 'changed' },
      { name: 'same_field', value: 'user.name' },
      { name: 'different_field', value: 'source.ip' },
    ]);

    expect(result.decoders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'sample_decoder',
          prematch: ['sample'],
          orderFields: ['event.action', 'user.name'],
          tenant: 'manager-a',
        }),
        expect.objectContaining({
          name: 'sample_decoder_child',
          parent: 'sample_decoder',
          orderFields: ['source.ip'],
        }),
      ]),
    );

    expect(result.issues.map((issue) => issue.type)).toEqual(
      expect.arrayContaining([
        'helper_with_mitre',
        'missing_use_case',
        'jira_without_mitre',
        'missing_group_dependency',
        'missing_decoder',
      ]),
    );
  });

  it('reports structural validation problems without treating stock dependencies as fatal', async () => {
    const analyzer = new WazuhXmlRulesetAnalyzer();
    const result = await analyzer.analyze({
      files: [
        await fixture('validation/manager-b/rules/1200-validation_rules.xml'),
        await fixture('validation/manager-b/decoders/1200-validation_decoders.xml'),
        await fixture('validation/manager-b/misc/notes.xml'),
      ],
    });

    const issueTypes = result.issues.map((issue) => issue.type);

    expect(issueTypes).toEqual(
      expect.arrayContaining([
        'duplicate_rule_id',
        'duplicate_decoder_name',
        'external_or_missing_sid',
        'external_decoder_parent',
        'unknown_file_type',
        'level_above_standard',
      ]),
    );
    expect(result.issues.find((issue) => issue.type === 'duplicate_rule_id')?.severity).toBe(
      'error',
    );
    expect(result.issues.find((issue) => issue.type === 'external_or_missing_sid')?.severity).toBe(
      'warning',
    );
    expect(result.issues.find((issue) => issue.type === 'external_decoder_parent')?.severity).toBe(
      'info',
    );
  });

  it('preserves correlation dependencies, explicit use cases, XML entities, and decoder patterns', async () => {
    const analyzer = new WazuhXmlRulesetAnalyzer();
    const result = await analyzer.analyze({
      files: [
        {
          name: 'manager-c/rules/1300-regression_rules.xml',
          content: [
            '<group name="regression">',
            '  <rule id="130001" level="5">',
            '    <description>Base rule</description>',
            '    <group>production,base_group,</group>',
            '  </rule>',
            '  <rule id="130002" level="11">',
            '    <if_matched_sid>130001</if_matched_sid>',
            '    <if_matched_group>base_group</if_matched_group>',
            '    <decoded_as>entity_decoder</decoded_as>',
            '    <description>Admin &amp; configuration &lt;changed&gt;</description>',
            '    <group>production,</group>',
            '    <field name="event.message">changed &amp; approved</field>',
            '    <info type="text">use_case:uc_admin_config</info>',
            '    <mitre><id>T1562.001</id></mitre>',
            '  </rule>',
            '</group>',
          ].join('\n'),
        },
        {
          name: 'manager-c/decoders/1300-regression_decoders.xml',
          content: [
            '<decoder name="entity_decoder">',
            '  <prematch>admin &amp; change</prematch>',
            '  <regex>user=([A-Za-z]+)&amp;action=([A-Za-z_]+)</regex>',
            '  <order>user.name, event.action</order>',
            '</decoder>',
          ].join('\n'),
        },
      ],
      useCases: [adminConfigUseCase],
    });

    const correlated = result.rules.find((rule) => rule.id === '130002');
    expect(correlated).toMatchObject({
      description: 'Admin & configuration <changed>',
      role: 'correlation',
      status: 'production',
      severity: 'high',
      jiraVisible: true,
      tenant: 'manager-c',
      useCaseId: 'uc_admin_config',
      useCaseConfidence: 'confirmed',
      mitre: ['T1562.001'],
      decodedAs: ['entity_decoder'],
    });
    expect(correlated?.dependencies).toEqual([
      { type: 'if_matched_sid', value: '130001' },
      { type: 'if_matched_group', value: 'base_group' },
      { type: 'decoded_as', value: 'entity_decoder' },
    ]);
    expect(correlated?.fields).toContainEqual({
      name: 'event.message',
      value: 'changed & approved',
    });

    expect(result.decoders).toContainEqual(
      expect.objectContaining({
        name: 'entity_decoder',
        prematch: ['admin & change'],
        regex: ['user=([A-Za-z]+)&action=([A-Za-z_]+)'],
        orderFields: ['user.name', 'event.action'],
        tenant: 'manager-c',
      }),
    );

    const correlatedIssueTypes = result.issues
      .filter((issue) => issue.ruleId === '130002')
      .map((issue) => issue.type);
    expect(correlatedIssueTypes).not.toEqual(
      expect.arrayContaining([
        'external_or_missing_sid',
        'missing_group_dependency',
        'missing_decoder',
        'unknown_use_case_registry',
      ]),
    );
  });

  it('reports malformed XML fragments as approval-blocking validation errors', async () => {
    const analyzer = new WazuhXmlRulesetAnalyzer();
    const result = await analyzer.analyze({
      files: [
        {
          name: 'manager-d/rules/1400-broken_rules.xml',
          content: [
            '<?xml version="1.0"?>',
            '<group name="broken,">',
            '  <rule id="140001" level="5">',
            '    <description>Broken nesting</description>',
            '</group>',
          ].join('\n'),
        },
      ],
    });

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        type: 'malformed_xml_structure',
        fileName: 'manager-d/rules/1400-broken_rules.xml',
      }),
    );
    expect(
      result.issues.find((issue) => issue.type === 'malformed_xml_structure')?.detail,
    ).toContain('does not match');
  });

  it('allows valid multi-root decoder XML fragments', async () => {
    const analyzer = new WazuhXmlRulesetAnalyzer();
    const result = await analyzer.analyze({
      files: [
        {
          name: 'manager-d/decoders/1400-fragment_decoders.xml',
          content: [
            '<!-- Wazuh decoder fragments do not require one document root. -->',
            '<decoder name="first_decoder">',
            '  <prematch>first</prematch>',
            '</decoder>',
            '<decoder name="second_decoder">',
            '  <prematch><![CDATA[second]]></prematch>',
            '</decoder>',
          ].join('\n'),
        },
      ],
    });

    expect(result.decoders).toHaveLength(2);
    expect(result.issues.map((issue) => issue.type)).not.toContain('malformed_xml_structure');
  });

  it('rejects DOCTYPE declarations in Rules XML fragments', async () => {
    const analyzer = new WazuhXmlRulesetAnalyzer();
    const result = await analyzer.analyze({
      files: [
        {
          name: 'manager-d/rules/1401-doctype_rules.xml',
          content: [
            '<!DOCTYPE group SYSTEM "file:///etc/passwd">',
            '<group name="custom,"></group>',
          ].join('\n'),
        },
      ],
    });

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        type: 'malformed_xml_structure',
        detail: 'XML declaration markup such as DOCTYPE is not allowed.',
      }),
    );
  });

  it('uses SHA-256 source fingerprints and deterministic source classification', async () => {
    const analyzer = new WazuhXmlRulesetAnalyzer();
    const source = await fixture('baseline/manager-a/rules/1000-sample_rules.xml');
    const first = await analyzer.analyze({ files: [source] });
    const second = await analyzer.analyze({ files: [source] });

    expect(first.files[0]?.type).toBe('rules');
    expect(first.files[0]?.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(first.files[0]?.sha256).toBe(second.files[0]?.sha256);
  });
});
