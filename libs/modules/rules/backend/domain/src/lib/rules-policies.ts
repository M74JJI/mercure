import type { RuleSeverity, UseCaseConfidence } from './rules-records';

export interface RuleUseCaseInference {
  readonly id: string;
  readonly confidence: UseCaseConfidence;
}

const MANUAL_TENANT = 'manual';

export function tenantFromSourceName(sourceName: string): string {
  const root = sourceName.split(/[\\/]/)[0]?.trim();
  if (!root) {
    return MANUAL_TENANT;
  }

  return (
    root
      .replace(/\.tar\.gz$/i, '')
      .replace(/\.tgz$/i, '')
      .trim() || MANUAL_TENANT
  );
}

export function ruleSeverityFromLevel(level: number): RuleSeverity {
  if (level <= 0) return 'informational';
  if (level <= 5) return 'low';
  if (level <= 8) return 'medium';
  if (level <= 11) return 'high';
  return 'critical';
}

export function inferRuleStatus(groups: readonly string[]): string {
  const allowed = new Set(['production', 'testing', 'deprecated', 'disabled', 'experimental']);
  return groups.find((group) => allowed.has(group)) ?? 'unknown';
}

export function inferRuleRole(
  level: number,
  groups: readonly string[],
  hasCorrelationMarkers: boolean,
): string {
  const groupText = groups.join(' ');

  if (/parser|invalid|null|placeholder/.test(groupText)) return 'parser_health';
  if (level === 0) return 'helper';
  if (hasCorrelationMarkers) return 'correlation';
  if (level >= 12) return 'critical';
  return 'detection';
}

export function inferRuleUseCase(
  groups: readonly string[],
  description: string,
  sourceFile: string,
): RuleUseCaseInference {
  for (const group of groups) {
    if (group.startsWith('uc_')) {
      return { id: group, confidence: 'confirmed' };
    }
  }

  const haystack = `${sourceFile} ${groups.join(' ')} ${description}`.toLowerCase();
  const heuristics: readonly [RegExp, string][] = [
    [/parser|invalid.+field|null|placeholder/, 'uc_fgt_parser_health'],
    [/admin.+auth|administrator.+login|admin.+login/, 'uc_fgt_admin_auth'],
    [/admin.+config|configuration|cfgpath|policy.+changed/, 'uc_fgt_admin_config'],
    [/vpn|ssl-login|remote access|ipsec/, 'uc_fgt_vpn_auth'],
    [/traffic|denied|allowed|policy|network flow/, 'uc_fgt_traffic_policy'],
    [/utm|webfilter|dnsfilter|appcontrol/, 'uc_fgt_utm_security'],
    [/threat intel|reputation|c2|malware_c2/, 'uc_fgt_threat_reputation'],
    [/ips|exploit/, 'uc_fgt_ips_exploit'],
    [/malware|virus|file security/, 'uc_fgt_malware_file'],
    [/dns/, 'uc_fgt_dnsfilter_threat'],
    [/web|url|phish/, 'uc_fgt_webfilter_threat'],
    [/dos|anomaly|scan|flood/, 'uc_fgt_dos_anomaly'],
    [/exposure|weakened|disabled|any-any|allowaccess/, 'uc_fgt_exposure_config'],
    [/ha|cluster|failover/, 'uc_fgt_ha_cluster'],
    [/sdwan|sd-wan|route|routing|bgp/, 'uc_fgt_sdwan_routing'],
  ];

  for (const [pattern, id] of heuristics) {
    if (pattern.test(haystack)) {
      return { id, confidence: 'inferred' };
    }
  }

  return { id: 'unassigned', confidence: 'unassigned' };
}
