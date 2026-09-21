import { buildFieldIntelligence } from './field-intelligence';
import type { DecoderRecord, ParsedRuleset, RuleRecord } from './rules-records';

export type RulesGraphMode =
  'rules' | 'decoders' | 'decoder_rules' | 'use_cases' | 'mitre' | 'fields' | 'all';

export type RulesGraphNodeType =
  'rule' | 'decoder' | 'use_case' | 'mitre' | 'field' | 'group' | 'external';

export type RulesGraphEdgeType =
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

export interface RulesGraphFilters {
  readonly mode: RulesGraphMode;
  readonly query?: string;
  readonly tenant?: string;
  readonly useCaseId?: string;
  readonly status?: string;
  readonly role?: string;
  readonly jiraOnly?: boolean;
  readonly includeExternal?: boolean;
  readonly limit?: number;
}

export interface RulesGraphNode {
  readonly id: string;
  readonly type: RulesGraphNodeType;
  readonly label: string;
  readonly weight: number;
  readonly tenant?: string;
  readonly entityId?: string;
  readonly meta?: Readonly<Record<string, string | number | boolean>>;
}

export interface RulesGraphEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly type: RulesGraphEdgeType;
  readonly label: string;
  readonly weight: number;
}

export interface RulesGraphData {
  readonly nodes: readonly RulesGraphNode[];
  readonly edges: readonly RulesGraphEdge[];
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
}

function scopedKey(tenant: string, value: string): string {
  return JSON.stringify([tenant, value]);
}

function ruleNodeId(tenant: string, ruleId: string): string {
  return 'rule:' + scopedKey(tenant, ruleId);
}

function decoderNodeId(tenant: string, name: string): string {
  return 'decoder:' + scopedKey(tenant, name);
}

function fieldNodeId(tenant: string, field: string): string {
  return 'field:' + scopedKey(tenant, field);
}

function groupNodeId(tenant: string, group: string): string {
  return 'group:' + scopedKey(tenant, group);
}

function externalNodeId(tenant: string, kind: string, value: string): string {
  return 'external:' + JSON.stringify([tenant, kind, value]);
}

function useCaseNodeId(useCaseId: string): string {
  return 'usecase:' + useCaseId;
}

function mitreNodeId(technique: string): string {
  return 'mitre:' + technique;
}

function ruleImportance(rule: RuleRecord): number {
  return (
    (rule.jiraVisible ? 1_000 : 0) +
    (rule.severity === 'critical' ? 500 : 0) +
    (rule.role === 'correlation' ? 200 : 0) +
    rule.level * 8 +
    rule.dependencies.length +
    rule.mitre.length
  );
}

function ruleHaystack(rule: RuleRecord): string {
  return [
    rule.id,
    rule.description,
    rule.groups.join(' '),
    rule.mitre.join(' '),
    rule.useCaseId,
    rule.status,
    rule.role,
    rule.fields.map((field) => field.name + ' ' + field.value).join(' '),
  ]
    .join(' ')
    .toLowerCase();
}

function decoderHaystack(decoder: DecoderRecord): string {
  return [
    decoder.name,
    decoder.parent ?? '',
    decoder.orderFields.join(' '),
    decoder.regex.join(' '),
    decoder.prematch.join(' '),
  ]
    .join(' ')
    .toLowerCase();
}

function filteredRules(data: ParsedRuleset, filters: RulesGraphFilters): readonly RuleRecord[] {
  const query = filters.query?.trim().toLowerCase() ?? '';
  const limit = Math.max(1, Math.min(filters.limit ?? 500, 2_000));

  return data.rules
    .filter((rule) => {
      if (filters.tenant && rule.tenant !== filters.tenant) return false;
      if (filters.useCaseId && rule.useCaseId !== filters.useCaseId) return false;
      if (filters.status && rule.status !== filters.status) return false;
      if (filters.role && rule.role !== filters.role) return false;
      if (filters.jiraOnly && !rule.jiraVisible) return false;
      if (query && !ruleHaystack(rule).includes(query)) return false;
      return true;
    })
    .sort(
      (left, right) =>
        ruleImportance(right) - ruleImportance(left) ||
        left.tenant.localeCompare(right.tenant) ||
        left.id.localeCompare(right.id),
    )
    .slice(0, limit);
}

export function buildRulesGraph(data: ParsedRuleset, filters: RulesGraphFilters): RulesGraphData {
  const nodes = new Map<string, RulesGraphNode>();
  const edges = new Map<string, RulesGraphEdge>();
  const selectedRules = filteredRules(data, filters);
  const selectedRuleKeys = new Set(selectedRules.map((rule) => scopedKey(rule.tenant, rule.id)));
  const query = filters.query?.trim().toLowerCase() ?? '';
  const includeExternal = filters.includeExternal ?? false;
  const limit = Math.max(1, Math.min(filters.limit ?? 500, 2_000));

  const rulesByKey = new Map(
    data.rules.map((rule) => [scopedKey(rule.tenant, rule.id), rule] as const),
  );
  const decodersByKey = new Map(
    data.decoders.map((decoder) => [scopedKey(decoder.tenant, decoder.name), decoder] as const),
  );

  const addNode = (node: RulesGraphNode) => {
    const existing = nodes.get(node.id);
    if (!existing || node.weight > existing.weight) nodes.set(node.id, node);
  };
  const addEdge = (edge: RulesGraphEdge) => {
    if (edge.source !== edge.target) edges.set(edge.id, edge);
  };
  const addRule = (rule: RuleRecord) =>
    addNode({
      id: ruleNodeId(rule.tenant, rule.id),
      type: 'rule',
      label: rule.id,
      weight: ruleImportance(rule),
      tenant: rule.tenant,
      entityId: rule.id,
      meta: {
        level: rule.level,
        role: rule.role,
        status: rule.status,
        severity: rule.severity,
        jiraVisible: rule.jiraVisible,
        description: rule.description.slice(0, 160),
      },
    });
  const addDecoder = (decoder: DecoderRecord) =>
    addNode({
      id: decoderNodeId(decoder.tenant, decoder.name),
      type: 'decoder',
      label: decoder.name,
      weight: 100 + decoder.orderFields.length,
      tenant: decoder.tenant,
      entityId: decoder.name,
      meta: {
        parent: decoder.parent ?? '',
        fields: decoder.orderFields.length,
      },
    });
  const addExternal = (tenant: string, kind: string, value: string) => {
    const id = externalNodeId(tenant, kind, value);
    addNode({
      id,
      type: 'external',
      label: value,
      weight: 1,
      tenant,
      entityId: value,
      meta: { kind },
    });
    return id;
  };

  if (filters.mode === 'rules' || filters.mode === 'all') {
    for (const rule of selectedRules) addRule(rule);

    for (const rule of selectedRules) {
      for (const dependency of rule.dependencies) {
        if (dependency.type === 'if_sid' || dependency.type === 'if_matched_sid') {
          const parentKey = scopedKey(rule.tenant, dependency.value);
          const parent = rulesByKey.get(parentKey);
          let sourceId: string | undefined;

          if (parent && (selectedRuleKeys.has(parentKey) || filters.mode === 'all')) {
            addRule(parent);
            sourceId = ruleNodeId(parent.tenant, parent.id);
          } else if (includeExternal) {
            sourceId = addExternal(rule.tenant, dependency.type, dependency.value);
          }

          if (sourceId) {
            const target = ruleNodeId(rule.tenant, rule.id);
            addEdge({
              id: sourceId + '->' + target + ':' + dependency.type,
              source: sourceId,
              target,
              type: dependency.type,
              label: dependency.type,
              weight: dependency.type.includes('matched') ? 2 : 1,
            });
          }
        }

        if (dependency.type === 'if_group' || dependency.type === 'if_matched_group') {
          const groupId = groupNodeId(rule.tenant, dependency.value);
          const producerExists = data.rules.some(
            (candidate) =>
              candidate.tenant === rule.tenant && candidate.groups.includes(dependency.value),
          );
          if (producerExists || includeExternal) {
            addNode({
              id: groupId,
              type: 'group',
              label: dependency.value,
              weight: 30,
              tenant: rule.tenant,
              entityId: dependency.value,
              meta: { producerFound: producerExists },
            });
            const target = ruleNodeId(rule.tenant, rule.id);
            addEdge({
              id: groupId + '->' + target + ':' + dependency.type,
              source: groupId,
              target,
              type: dependency.type,
              label: dependency.type,
              weight: 1,
            });
          }
        }
      }
    }

    for (const producer of selectedRules) {
      for (const group of producer.groups) {
        const groupId = groupNodeId(producer.tenant, group);
        if (!nodes.has(groupId)) continue;

        addRule(producer);
        const source = ruleNodeId(producer.tenant, producer.id);
        addEdge({
          id: source + '->' + groupId + ':group_produces',
          source,
          target: groupId,
          type: 'group_produces',
          label: 'produces',
          weight: 1,
        });
      }
    }
  }

  if (filters.mode === 'decoders' || filters.mode === 'all') {
    const decoders = data.decoders
      .filter((decoder) => {
        if (filters.tenant && decoder.tenant !== filters.tenant) return false;
        return !query || decoderHaystack(decoder).includes(query);
      })
      .slice(0, limit);

    for (const decoder of decoders) addDecoder(decoder);

    for (const decoder of decoders) {
      if (!decoder.parent) continue;
      const parent = decodersByKey.get(scopedKey(decoder.tenant, decoder.parent));
      let sourceId: string | undefined;

      if (parent) {
        addDecoder(parent);
        sourceId = decoderNodeId(parent.tenant, parent.name);
      } else if (includeExternal) {
        sourceId = addExternal(decoder.tenant, 'decoder_parent', decoder.parent);
      }

      if (sourceId) {
        const target = decoderNodeId(decoder.tenant, decoder.name);
        addEdge({
          id: sourceId + '->' + target + ':decoder_parent',
          source: sourceId,
          target,
          type: 'decoder_parent',
          label: 'parent',
          weight: 1,
        });
      }
    }
  }

  if (filters.mode === 'decoder_rules' || filters.mode === 'fields' || filters.mode === 'all') {
    const intelligence = buildFieldIntelligence(data);

    for (const rule of selectedRules) {
      for (const decoderName of rule.decodedAs) {
        const decoder = decodersByKey.get(scopedKey(rule.tenant, decoderName));
        if (!decoder) {
          if (!includeExternal) continue;
          const source = addExternal(rule.tenant, 'decoded_as', decoderName);
          addRule(rule);
          const target = ruleNodeId(rule.tenant, rule.id);
          addEdge({
            id: source + '->' + target + ':decoded_as',
            source,
            target,
            type: 'decoded_as',
            label: 'decoded_as',
            weight: 2,
          });
          continue;
        }

        addDecoder(decoder);
        addRule(rule);
        const source = decoderNodeId(decoder.tenant, decoder.name);
        const target = ruleNodeId(rule.tenant, rule.id);
        addEdge({
          id: source + '->' + target + ':decoded_as',
          source,
          target,
          type: 'decoded_as',
          label: 'decoded_as',
          weight: 2,
        });
      }
    }

    if (filters.mode === 'fields' || filters.mode === 'all') {
      const fieldRows = intelligence.rows
        .filter((row) => {
          if (filters.tenant && row.tenant !== filters.tenant) return false;
          if (query && !row.field.includes(query)) return false;
          return true;
        })
        .slice(0, limit);

      for (const row of fieldRows) {
        const fieldId = fieldNodeId(row.tenant, row.field);
        addNode({
          id: fieldId,
          type: 'field',
          label: row.field,
          weight: 20 + row.usedByRules.length,
          tenant: row.tenant,
          entityId: row.field,
          meta: {
            health: row.health,
            riskScore: row.riskScore,
            criticality: row.criticality,
          },
        });

        for (const decoder of row.producedBy) {
          const source = decoderNodeId(decoder.tenant, decoder.name);
          const record = decodersByKey.get(scopedKey(decoder.tenant, decoder.name));
          if (record) addDecoder(record);
          addEdge({
            id: source + '->' + fieldId + ':field_produces',
            source,
            target: fieldId,
            type: 'field_produces',
            label: 'produces',
            weight: 1,
          });
        }

        for (const rule of row.usedByRules) {
          const ruleRecord = rulesByKey.get(scopedKey(rule.tenant, rule.ruleId));
          if (!ruleRecord) continue;
          if (!selectedRuleKeys.has(scopedKey(rule.tenant, rule.ruleId))) continue;
          addRule(ruleRecord);
          const target = ruleNodeId(rule.tenant, rule.ruleId);
          addEdge({
            id: fieldId + '->' + target + ':field_uses',
            source: fieldId,
            target,
            type: 'field_uses',
            label: 'used by',
            weight: 1,
          });
        }
      }
    }
  }

  if (filters.mode === 'use_cases' || filters.mode === 'all') {
    for (const rule of selectedRules) {
      const useCaseId = useCaseNodeId(rule.useCaseId);
      const useCase = data.useCases.find((candidate) => candidate.id === rule.useCaseId);
      addNode({
        id: useCaseId,
        type: 'use_case',
        label: useCase?.shortName ?? rule.useCaseId,
        weight: 200,
        entityId: rule.useCaseId,
      });
      addRule(rule);
      const target = ruleNodeId(rule.tenant, rule.id);
      addEdge({
        id: useCaseId + '->' + target + ':use_case',
        source: useCaseId,
        target,
        type: 'use_case',
        label: 'contains',
        weight: 1,
      });
    }
  }

  if (filters.mode === 'mitre' || filters.mode === 'all') {
    for (const rule of selectedRules) {
      if (rule.mitre.length === 0) continue;
      addRule(rule);

      for (const technique of rule.mitre) {
        const techniqueId = mitreNodeId(technique);
        addNode({
          id: techniqueId,
          type: 'mitre',
          label: technique,
          weight: 120,
          entityId: technique,
        });
        const target = ruleNodeId(rule.tenant, rule.id);
        addEdge({
          id: techniqueId + '->' + target + ':mitre',
          source: techniqueId,
          target,
          type: 'mitre',
          label: 'maps',
          weight: 1,
        });
      }
    }
  }

  const nodeList = [...nodes.values()].sort(
    (left, right) => right.weight - left.weight || left.id.localeCompare(right.id),
  );
  const allowed = new Set(nodeList.map((node) => node.id));
  const edgeList = [...edges.values()]
    .filter((edge) => allowed.has(edge.source) && allowed.has(edge.target))
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    nodes: nodeList,
    edges: edgeList,
    stats: {
      nodes: nodeList.length,
      edges: edgeList.length,
      rules: nodeList.filter((node) => node.type === 'rule').length,
      decoders: nodeList.filter((node) => node.type === 'decoder').length,
      fields: nodeList.filter((node) => node.type === 'field').length,
      groups: nodeList.filter((node) => node.type === 'group').length,
      useCases: nodeList.filter((node) => node.type === 'use_case').length,
      mitre: nodeList.filter((node) => node.type === 'mitre').length,
      external: nodeList.filter((node) => node.type === 'external').length,
    },
  };
}
