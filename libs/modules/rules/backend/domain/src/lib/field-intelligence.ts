import type { DecoderRecord, ParsedRuleset, RuleRecord, RuleSeverity } from './rules-records';

export type FieldCriticality = 'critical' | 'high' | 'medium' | 'low';
export type FieldHealth =
  'healthy' | 'underused' | 'unknown_source' | 'alias_candidate' | 'orphaned';

export interface FieldAliasHint {
  readonly tenant: string;
  readonly field: string;
  readonly alias: string;
  readonly reason: string;
}

export interface FieldDictionaryEntry {
  readonly field: string;
  readonly canonical: string;
  readonly family: string;
  readonly description: string;
  readonly aliases: readonly string[];
  readonly risk: FieldCriticality;
}

export interface FieldRuleReference {
  readonly key: string;
  readonly tenant: string;
  readonly ruleId: string;
  readonly useCaseId: string;
  readonly level: number;
  readonly severity: RuleSeverity;
  readonly jiraVisible: boolean;
}

export interface FieldDecoderReference {
  readonly key: string;
  readonly tenant: string;
  readonly name: string;
}

export interface FieldLineageRow {
  readonly key: string;
  readonly tenant: string;
  readonly field: string;
  readonly canonical: string;
  readonly family: string;
  readonly description: string;
  readonly aliases: readonly string[];
  readonly producedBy: readonly FieldDecoderReference[];
  readonly usedByRules: readonly FieldRuleReference[];
  readonly usedByUseCases: readonly string[];
  readonly jiraVisibleRules: number;
  readonly criticalRules: number;
  readonly decodedAsRules: readonly string[];
  readonly health: FieldHealth;
  readonly criticality: FieldCriticality;
  readonly riskScore: number;
  readonly aliasHints: readonly FieldAliasHint[];
}

export interface FieldIntelligenceSummary {
  readonly rows: readonly FieldLineageRow[];
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
  readonly aliasHints: readonly FieldAliasHint[];
  readonly dictionary: readonly FieldDictionaryEntry[];
}

const FIELD_DICTIONARY: readonly FieldDictionaryEntry[] = [
  {
    field: 'event.action',
    canonical: 'event.action',
    family: 'event',
    description: 'Normalized action/outcome label used by many Wazuh rules.',
    aliases: ['action', 'fortigate.action'],
    risk: 'critical',
  },
  {
    field: 'event.category',
    canonical: 'event.category',
    family: 'event',
    description: 'Normalized event category such as traffic, vpn, system, dns, ips, webfilter.',
    aliases: ['type', 'subtype', 'fortigate.type'],
    risk: 'high',
  },
  {
    field: 'event.type',
    canonical: 'event.type',
    family: 'event',
    description: 'Event type/subtype selector used for base helpers and domain helpers.',
    aliases: ['type', 'event.category', 'fortigate.type'],
    risk: 'high',
  },
  {
    field: 'event.name',
    canonical: 'event.name',
    family: 'event',
    description: 'Normalized event/log description, often derived from logdesc or message text.',
    aliases: ['logdesc', 'msg', 'message'],
    risk: 'high',
  },
  {
    field: 'event.reason',
    canonical: 'event.reason',
    family: 'event',
    description: 'Reason/outcome explanation for authentication and policy decisions.',
    aliases: ['reason', 'fortigate.reason'],
    risk: 'medium',
  },
  {
    field: 'fortigate.status',
    canonical: 'fortigate.status',
    family: 'fortigate',
    description: 'FortiGate status/result field for success/failure/error semantics.',
    aliases: ['status', 'event.outcome'],
    risk: 'critical',
  },
  {
    field: 'fortigate.config.path',
    canonical: 'fortigate.config.path',
    family: 'config',
    description: 'FortiGate configuration path/object family changed by an administrator.',
    aliases: ['cfgpath', 'config.path'],
    risk: 'critical',
  },
  {
    field: 'fortigate.config.attr',
    canonical: 'fortigate.config.attr',
    family: 'config',
    description: 'Configuration attribute delta carrying configuration-change context.',
    aliases: ['cfgattr', 'fortigate.config.attribute'],
    risk: 'critical',
  },
  {
    field: 'fortigate.ui',
    canonical: 'fortigate.ui',
    family: 'admin',
    description: 'Administrative access channel such as HTTPS, SSH, console, Telnet, or HTTP.',
    aliases: ['ui', 'admin_ui'],
    risk: 'high',
  },
  {
    field: 'user.target',
    canonical: 'user.target',
    family: 'identity',
    description: 'Target/subject user account involved in authentication or admin actions.',
    aliases: ['user', 'xauthuser', 'admin', 'username'],
    risk: 'critical',
  },
  {
    field: 'source.ip',
    canonical: 'source.ip',
    family: 'network',
    description: 'Normalized source IP address.',
    aliases: ['srcip', 'src', 'source.address', 'fortigate.vpn.remote_ip'],
    risk: 'critical',
  },
  {
    field: 'destination.ip',
    canonical: 'destination.ip',
    family: 'network',
    description: 'Normalized destination IP address.',
    aliases: ['dstip', 'dst', 'destination.address'],
    risk: 'critical',
  },
  {
    field: 'source.port',
    canonical: 'source.port',
    family: 'network',
    description: 'Normalized source port.',
    aliases: ['srcport', 'src_port'],
    risk: 'medium',
  },
  {
    field: 'destination.port',
    canonical: 'destination.port',
    family: 'network',
    description: 'Normalized destination port.',
    aliases: ['dstport', 'dst_port'],
    risk: 'high',
  },
  {
    field: 'rule.id',
    canonical: 'rule.id',
    family: 'policy',
    description: 'Firewall policy/rule ID used for policy tracking and risky policy detection.',
    aliases: ['policyid', 'policy.id'],
    risk: 'high',
  },
  {
    field: 'hostname',
    canonical: 'hostname',
    family: 'web',
    description: 'Destination hostname involved in webfilter or DNS activity.',
    aliases: ['host', 'destination.domain', 'url.domain'],
    risk: 'high',
  },
  {
    field: 'url',
    canonical: 'url',
    family: 'web',
    description: 'URL path/full URL used by webfilter, malware, or C2 detections.',
    aliases: ['request.url', 'web.url'],
    risk: 'high',
  },
  {
    field: 'file.name',
    canonical: 'file.name',
    family: 'file',
    description: 'File name observed by antivirus/file-security rules.',
    aliases: ['filename', 'fname'],
    risk: 'high',
  },
  {
    field: 'fortigate.attack.name',
    canonical: 'fortigate.attack.name',
    family: 'threat',
    description: 'IPS/anomaly attack signature name.',
    aliases: ['attack', 'attack.name'],
    risk: 'critical',
  },
  {
    field: 'fortigate.threat.name',
    canonical: 'fortigate.threat.name',
    family: 'threat',
    description: 'Antivirus/threat name or family.',
    aliases: ['virus', 'threat', 'malware.name'],
    risk: 'critical',
  },
  {
    field: 'fortigate.vpn.remote_ip',
    canonical: 'fortigate.vpn.remote_ip',
    family: 'vpn',
    description: 'Remote VPN peer/source IP used by VPN correlation.',
    aliases: ['remip', 'source.ip'],
    risk: 'critical',
  },
  {
    field: 'fortigate.vpn.tunnel_ip',
    canonical: 'fortigate.vpn.tunnel_ip',
    family: 'vpn',
    description: 'Assigned VPN tunnel IP.',
    aliases: ['tunnelip', 'assignip'],
    risk: 'medium',
  },
  {
    field: 'destination.bytes',
    canonical: 'destination.bytes',
    family: 'traffic',
    description: 'Bytes received/inbound to the destination side.',
    aliases: ['rcvdbyte', 'rcvd', 'destination.bytes'],
    risk: 'medium',
  },
  {
    field: 'source.bytes',
    canonical: 'source.bytes',
    family: 'traffic',
    description: 'Bytes sent/outbound from the source side.',
    aliases: ['sentbyte', 'sent', 'source.bytes'],
    risk: 'high',
  },
];

function average(items: readonly number[]): number {
  return items.length ? Math.round(items.reduce((sum, value) => sum + value, 0) / items.length) : 0;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scopedKey(tenant: string, value: string): string {
  return JSON.stringify([tenant, value]);
}

function normalizeObservedField(value: string): string {
  return value.trim().toLowerCase();
}

function fieldFromRule(rule: RuleRecord): readonly string[] {
  const fields: string[] = [];

  for (const field of rule.fields) {
    const name = normalizeObservedField(field.name);
    if (!name || name === 'match') continue;

    if (name === 'same_field' || name === 'different_field') {
      const referenced = normalizeObservedField(field.value);
      if (referenced) fields.push(referenced);
      continue;
    }

    fields.push(name);
  }

  return [...new Set(fields)];
}

function dictionaryFor(field: string): FieldDictionaryEntry {
  const normalized = field.replace(/^data./, '').toLowerCase();
  const direct = FIELD_DICTIONARY.find(
    (entry) =>
      entry.field.toLowerCase() === normalized ||
      entry.aliases.some((alias) => alias.toLowerCase() === normalized),
  );
  if (direct) return direct;

  const family =
    normalized.includes('ip') || normalized.includes('port')
      ? 'network'
      : normalized.includes('vpn')
        ? 'vpn'
        : normalized.includes('config') || normalized.includes('cfg')
          ? 'config'
          : normalized.includes('user')
            ? 'identity'
            : normalized.includes('url') || normalized.includes('host')
              ? 'web'
              : normalized.includes('attack') ||
                  normalized.includes('threat') ||
                  normalized.includes('virus')
                ? 'threat'
                : 'custom';

  return {
    field,
    canonical: field,
    family,
    description: 'Custom or product-specific field not present in the built-in dictionary.',
    aliases: [],
    risk: family === 'threat' || family === 'config' ? 'high' : 'medium',
  };
}

function criticalityScore(level: FieldCriticality): number {
  if (level === 'critical') return 35;
  if (level === 'high') return 26;
  if (level === 'medium') return 16;
  return 8;
}

function ruleReference(rule: RuleRecord): FieldRuleReference {
  return {
    key: scopedKey(rule.tenant, rule.id),
    tenant: rule.tenant,
    ruleId: rule.id,
    useCaseId: rule.useCaseId,
    level: rule.level,
    severity: rule.severity,
    jiraVisible: rule.jiraVisible,
  };
}

function decoderReference(decoder: DecoderRecord): FieldDecoderReference {
  return {
    key: scopedKey(decoder.tenant, decoder.name),
    tenant: decoder.tenant,
    name: decoder.name,
  };
}

function buildAliasHints(
  observedByTenant: ReadonlyMap<string, ReadonlySet<string>>,
): readonly FieldAliasHint[] {
  const hints: FieldAliasHint[] = [];

  for (const [tenant, fields] of observedByTenant) {
    const lower = new Set([...fields].map((field) => field.toLowerCase()));

    for (const entry of FIELD_DICTIONARY) {
      const forms = [entry.field, ...entry.aliases].filter((field) =>
        lower.has(field.toLowerCase()),
      );
      if (forms.length < 2) continue;

      for (const field of forms) {
        if (field.toLowerCase() === entry.canonical.toLowerCase()) continue;
        hints.push({
          tenant,
          field: field.toLowerCase(),
          alias: entry.canonical,
          reason: 'Likely alias of ' + entry.canonical + '; both forms appear for this tenant.',
        });
      }
    }

    for (const field of fields) {
      const cleaned = field.replace(/^data./, '');
      if (cleaned !== field && lower.has(cleaned.toLowerCase())) {
        hints.push({
          tenant,
          field,
          alias: cleaned,
          reason: 'Both data-prefixed and canonical/non-prefixed forms appear for this tenant.',
        });
      }
    }
  }

  const unique = new Map<string, FieldAliasHint>();
  for (const hint of hints) {
    unique.set(JSON.stringify([hint.tenant, hint.field, hint.alias, hint.reason]), hint);
  }

  return [...unique.values()].sort(
    (left, right) =>
      left.tenant.localeCompare(right.tenant) ||
      left.field.localeCompare(right.field) ||
      left.alias.localeCompare(right.alias),
  );
}

export function buildFieldIntelligence(data: ParsedRuleset): FieldIntelligenceSummary {
  const producedBy = new Map<string, DecoderRecord[]>();
  const usedBy = new Map<string, RuleRecord[]>();
  const observedByTenant = new Map<string, Set<string>>();
  const decodedAsByDecoder = new Map<string, RuleRecord[]>();

  const observe = (tenant: string, field: string) => {
    const set = observedByTenant.get(tenant) ?? new Set<string>();
    set.add(field);
    observedByTenant.set(tenant, set);
  };

  for (const decoder of data.decoders) {
    for (const rawField of decoder.orderFields) {
      const field = normalizeObservedField(rawField);
      if (!field) continue;
      const key = scopedKey(decoder.tenant, field);
      producedBy.set(key, [...(producedBy.get(key) ?? []), decoder]);
      observe(decoder.tenant, field);
    }
  }

  for (const rule of data.rules) {
    for (const field of fieldFromRule(rule)) {
      const key = scopedKey(rule.tenant, field);
      usedBy.set(key, [...(usedBy.get(key) ?? []), rule]);
      observe(rule.tenant, field);
    }

    for (const decoderName of rule.decodedAs) {
      const normalized = decoderName.trim();
      if (!normalized) continue;
      const key = scopedKey(rule.tenant, normalized);
      decodedAsByDecoder.set(key, [...(decodedAsByDecoder.get(key) ?? []), rule]);
    }
  }

  const aliasHints = buildAliasHints(observedByTenant);
  const aliasByField = new Map<string, FieldAliasHint[]>();
  for (const hint of aliasHints) {
    const key = scopedKey(hint.tenant, hint.field);
    aliasByField.set(key, [...(aliasByField.get(key) ?? []), hint]);
  }

  const allKeys = [...new Set([...producedBy.keys(), ...usedBy.keys()])].sort();
  const rows = allKeys
    .map((key): FieldLineageRow => {
      const [tenant, field] = JSON.parse(key) as [string, string];
      const decoders = producedBy.get(key) ?? [];
      const rules = usedBy.get(key) ?? [];
      const dictionary = dictionaryFor(field);
      const hints = aliasByField.get(key) ?? [];
      const jiraVisibleRules = rules.filter((rule) => rule.jiraVisible).length;
      const criticalRules = rules.filter((rule) => rule.severity === 'critical').length;
      const decodedAsRules = [
        ...new Set(
          decoders.flatMap((decoder) =>
            (decodedAsByDecoder.get(scopedKey(tenant, decoder.name)) ?? []).map((rule) =>
              scopedKey(rule.tenant, rule.id),
            ),
          ),
        ),
      ].sort();

      const health: FieldHealth =
        decoders.length > 0 && rules.length > 0
          ? hints.length > 0
            ? 'alias_candidate'
            : 'healthy'
          : decoders.length > 0
            ? 'orphaned'
            : rules.length > 0
              ? 'unknown_source'
              : 'underused';

      const riskScore = clamp(
        criticalityScore(dictionary.risk) +
          Math.min(24, rules.length * 3) +
          Math.min(18, jiraVisibleRules * 6) +
          Math.min(14, criticalRules * 7) +
          (health === 'unknown_source' ? 16 : 0) +
          (health === 'orphaned' ? 8 : 0) +
          (hints.length > 0 ? 8 : 0),
      );

      return {
        key,
        tenant,
        field,
        canonical: dictionary.canonical,
        family: dictionary.family,
        description: dictionary.description,
        aliases: dictionary.aliases,
        producedBy: decoders.map(decoderReference),
        usedByRules: rules.map(ruleReference),
        usedByUseCases: [...new Set(rules.map((rule) => rule.useCaseId))].sort(),
        jiraVisibleRules,
        criticalRules,
        decodedAsRules,
        health,
        criticality: dictionary.risk,
        riskScore,
        aliasHints: hints,
      };
    })
    .sort(
      (left, right) =>
        right.riskScore - left.riskScore ||
        right.usedByRules.length - left.usedByRules.length ||
        left.tenant.localeCompare(right.tenant) ||
        left.field.localeCompare(right.field),
    );

  return {
    rows,
    stats: {
      totalFields: rows.length,
      producedFields: producedBy.size,
      usedFields: usedBy.size,
      unknownSourceFields: rows.filter((row) => row.health === 'unknown_source').length,
      orphanedProducedFields: rows.filter((row) => row.health === 'orphaned').length,
      aliasCandidates: aliasHints.length,
      criticalFields: rows.filter((row) => row.criticality === 'critical').length,
      averageRisk: average(rows.map((row) => row.riskScore)),
    },
    aliasHints,
    dictionary: FIELD_DICTIONARY,
  };
}
