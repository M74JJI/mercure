import { describe, expect, it } from 'vitest';

import {
  buildFieldIntelligence,
  buildQualitySummary,
  buildRulesGraph,
  type DecoderRecord,
  type ParsedRuleset,
  type RuleRecord,
  type RulesetSourceFile,
} from '@mercure/rules-backend-domain';

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

function sourceFile(name: string, tenant: string): RulesetSourceFile {
  return {
    name,
    tenant,
    size: 0,
    type: 'rules',
    content: '',
    sha256: 'a'.repeat(64),
  };
}

function rule(id: string, tenant: string, overrides: Partial<RuleRecord> = {}): RuleRecord {
  return {
    id,
    level: 10,
    description: 'A sufficiently descriptive detection rule',
    groups: ['production', 'security', 'detection'],
    status: 'production',
    role: 'detection',
    severity: 'high',
    jiraVisible: false,
    tenant,
    sourceFile: tenant + '/rules.xml',
    useCaseId: 'uc_shared',
    useCaseConfidence: 'confirmed',
    mitre: ['T1059.001'],
    dependencies: [],
    fields: [],
    decodedAs: [],
    options: [],
    rawXml: '<rule id="' + id + '" level="10"></rule>',
    ...overrides,
  };
}

function decoder(
  name: string,
  tenant: string,
  orderFields: readonly string[],
  parent?: string,
): DecoderRecord {
  return {
    name,
    ...(parent ? { parent } : {}),
    prematch: [],
    regex: [],
    orderFields,
    tenant,
    sourceFile: tenant + '/decoders.xml',
    rawXml: '<decoder name="' + name + '"></decoder>',
  };
}

function collection(): ParsedRuleset {
  const rules = [
    rule('100', 'manager-a', {
      level: 12,
      severity: 'critical',
      jiraVisible: true,
      decodedAs: ['shared_decoder'],
      dependencies: [
        { type: 'decoded_as', value: 'shared_decoder' },
        { type: 'if_sid', value: '999' },
        { type: 'if_group', value: 'missing_group' },
      ],
      fields: [
        { name: 'srcip', value: '.+' },
        { name: 'source.ip', value: '.+' },
        { name: 'same_field', value: 'user.target' },
        { name: 'match', value: 'ignored pseudo-field' },
      ],
    }),
    rule('100', 'manager-b', {
      fields: [{ name: 'srcip', value: '.+' }],
      decodedAs: ['shared_decoder'],
      dependencies: [{ type: 'decoded_as', value: 'shared_decoder' }],
    }),
    rule('999', 'manager-b'),
  ];

  const decoders = [
    decoder('shared_decoder', 'manager-a', ['srcip', 'source.ip', 'user.target']),
    decoder('shared_decoder', 'manager-b', []),
  ];

  return {
    files: [
      sourceFile('manager-a/rules.xml', 'manager-a'),
      sourceFile('manager-b/rules.xml', 'manager-b'),
    ],
    rules,
    decoders,
    useCases: [
      {
        id: 'uc_shared',
        name: 'Shared use case',
        shortName: 'Shared',
        description: 'Shared test use case',
        component: 'Rules',
        vendor: 'Mercure',
        product: 'Rules',
        domain: 'Detection',
        category: 'Test',
        source: 'system',
        createdBy: 'test',
      },
    ],
    issues: [],
    stats: {
      ...emptyStats,
      rules: rules.length,
      decoders: decoders.length,
      useCases: 1,
    },
  };
}

describe('Rules intelligence', () => {
  it('keeps field lineage tenant-scoped and makes alias health reachable', () => {
    const intelligence = buildFieldIntelligence(collection());

    const tenantASrcip = intelligence.rows.find(
      (row) => row.tenant === 'manager-a' && row.field === 'srcip',
    );
    expect(tenantASrcip).toMatchObject({
      tenant: 'manager-a',
      field: 'srcip',
      health: 'alias_candidate',
    });
    expect(tenantASrcip?.producedBy.map((decoderRef) => decoderRef.name)).toEqual([
      'shared_decoder',
    ]);
    expect(tenantASrcip?.aliasHints).toContainEqual(
      expect.objectContaining({ alias: 'source.ip' }),
    );

    const tenantBSrcip = intelligence.rows.find(
      (row) => row.tenant === 'manager-b' && row.field === 'srcip',
    );
    expect(tenantBSrcip).toMatchObject({
      tenant: 'manager-b',
      field: 'srcip',
      health: 'unknown_source',
    });
    expect(tenantBSrcip?.producedBy).toHaveLength(0);

    const sameField = intelligence.rows.find(
      (row) => row.tenant === 'manager-a' && row.field === 'user.target',
    );
    expect(sameField?.usedByRules.map((ruleRef) => ruleRef.ruleId)).toContain('100');
    expect(
      intelligence.rows.some((row) => row.field === 'same_field' || row.field === 'match'),
    ).toBe(false);
  });

  it('scores dependencies and decoder confidence within the same tenant', () => {
    const quality = buildQualitySummary(collection());
    const managerA = quality.rules.find(
      (score) => score.tenant === 'manager-a' && score.ruleId === '100',
    );
    const managerB = quality.rules.find(
      (score) => score.tenant === 'manager-b' && score.ruleId === '100',
    );

    expect(managerA).toBeDefined();
    expect(managerB).toBeDefined();
    expect(managerA?.key).not.toBe(managerB?.key);
    expect(managerA?.warnings).toContain('Missing tenant dependency SID 999.');
    expect(managerA?.warnings).toContain(
      'No tenant producer found for dependency group missing_group.',
    );
    expect(managerA?.dimensions.noiseControl).toBeGreaterThanOrEqual(0);
    expect(managerA?.dimensions.noiseControl).toBeLessThanOrEqual(100);

    expect(quality.useCases).toHaveLength(2);
    expect(quality.useCases.map((item) => item.tenant).sort()).toEqual(['manager-a', 'manager-b']);
  });

  it('builds a layout-free semantic graph without cross-tenant dependency links', () => {
    const graph = buildRulesGraph(collection(), {
      mode: 'all',
      includeExternal: true,
      limit: 100,
    });

    const ruleNodes = graph.nodes.filter((node) => node.type === 'rule' && node.entityId === '100');
    expect(ruleNodes).toHaveLength(2);
    expect(ruleNodes.map((node) => node.tenant).sort()).toEqual(['manager-a', 'manager-b']);

    const decoderNodes = graph.nodes.filter(
      (node) => node.type === 'decoder' && node.entityId === 'shared_decoder',
    );
    expect(decoderNodes).toHaveLength(2);

    const managerARule = ruleNodes.find((node) => node.tenant === 'manager-a');
    const managerBParent = graph.nodes.find(
      (node) => node.type === 'rule' && node.tenant === 'manager-b' && node.entityId === '999',
    );
    const missingSidExternal = graph.nodes.find(
      (node) => node.type === 'external' && node.tenant === 'manager-a' && node.entityId === '999',
    );

    expect(managerARule).toBeDefined();
    expect(managerBParent).toBeDefined();
    expect(missingSidExternal).toBeDefined();
    expect(
      graph.edges.some(
        (edge) =>
          edge.source === managerBParent?.id &&
          edge.target === managerARule?.id &&
          edge.type === 'if_sid',
      ),
    ).toBe(false);
    expect(
      graph.edges.some(
        (edge) =>
          edge.source === missingSidExternal?.id &&
          edge.target === managerARule?.id &&
          edge.type === 'if_sid',
      ),
    ).toBe(true);

    for (const node of graph.nodes) {
      expect('x' in node).toBe(false);
      expect('y' in node).toBe(false);
      expect('tone' in node).toBe(false);
    }
  });
});
