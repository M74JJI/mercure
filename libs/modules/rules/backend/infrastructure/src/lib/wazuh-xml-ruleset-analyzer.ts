import { createHash } from 'node:crypto';

import type {
  AnalyzeRulesetRequest,
  RulesetAnalyzer,
  RulesetSourceInput,
} from '@mercure/rules-backend-application';
import {
  inferRuleRole,
  inferRuleStatus,
  inferRuleUseCase,
  ruleSeverityFromLevel,
  tenantFromSourceName,
  type DecoderRecord,
  type ParsedRuleset,
  type RuleDependency,
  type RuleField,
  type RuleRecord,
  type RulesetSourceFile,
  type RulesetSourceType,
  type RulesUseCase,
  type ValidationIssue,
} from '@mercure/rules-backend-domain';

function decodeEntities(value: string): string {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function attribute(xml: string, name: string): string | undefined {
  const match = xml.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match?.[1] ? decodeEntities(match[1]) : undefined;
}

function tagValues(xml: string, tag: string): string[] {
  const values: string[] = [];
  const expression = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  let match: RegExpExecArray | null;

  while ((match = expression.exec(xml))) {
    const value = match[1];
    if (value !== undefined) {
      values.push(decodeEntities(value.trim()));
    }
  }

  return values;
}

function splitCsv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitSidReferences(value: string | undefined): string[] {
  return (value ?? '')
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function maskXmlCommentsPreservingOffsets(content: string): string {
  return content.replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\r\n]/g, ' '));
}

function enclosingRuleGroups(content: string, ruleStartIndex: number): string[] {
  const stack: string[][] = [];
  const expression = /<\/?group\b[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = expression.exec(content)) && match.index < ruleStartIndex) {
    const tag = match[0];
    if (!tag) continue;

    if (/^<\/group\b/i.test(tag)) {
      stack.pop();
      continue;
    }

    if (/\/\s*>$/.test(tag)) continue;
    stack.push(splitCsv(attribute(tag, 'name')));
  }

  return [...new Set(stack.flat())];
}

const XML_NAME = /^[A-Za-z_][A-Za-z0-9_.:-]*/;
const XML_ENTITY = /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9A-Fa-f]+;)/;

function textStructureError(value: string): string | undefined {
  if (value.includes(']]>')) return 'XML text contains an invalid CDATA terminator.';
  if (XML_ENTITY.test(value)) return 'XML text contains an unescaped ampersand.';
  return undefined;
}

function fragmentTextStructureError(value: string, depth: number): string | undefined {
  const textError = textStructureError(value);
  if (textError) return textError;
  if (depth === 0 && /\S/.test(value)) {
    return 'XML fragment contains text outside top-level elements.';
  }
  return undefined;
}

function openingTagStructureError(body: string, elementName: string): string | undefined {
  let cursor = elementName.length;
  const attributes = new Set<string>();

  while (cursor < body.length) {
    while (/\s/.test(body[cursor] ?? '')) cursor += 1;
    if (cursor >= body.length) break;

    const attributeMatch = XML_NAME.exec(body.slice(cursor));
    const attributeName = attributeMatch?.[0];
    if (!attributeName) return 'XML attribute name is invalid.';
    if (attributes.has(attributeName)) {
      return `XML attribute ${attributeName} is duplicated on <${elementName}>.`;
    }
    attributes.add(attributeName);
    cursor += attributeName.length;

    while (/\s/.test(body[cursor] ?? '')) cursor += 1;
    if (body[cursor] !== '=') return `XML attribute ${attributeName} is missing '='.`;
    cursor += 1;

    while (/\s/.test(body[cursor] ?? '')) cursor += 1;
    const quote = body[cursor];
    if (quote !== '"' && quote !== "'") {
      return `XML attribute ${attributeName} must use quotes.`;
    }
    cursor += 1;

    const valueStart = cursor;
    while (cursor < body.length && body[cursor] !== quote) cursor += 1;
    if (cursor >= body.length) return `XML attribute ${attributeName} is not terminated.`;

    const attributeValue = body.slice(valueStart, cursor);
    if (attributeValue.includes('<')) {
      return `XML attribute ${attributeName} contains an invalid '<' character.`;
    }

    const valueError = textStructureError(attributeValue);
    if (valueError) return valueError;
    cursor += 1;
  }

  return undefined;
}

function findMarkupEnd(content: string, start: number): number {
  let quote: '"' | "'" | undefined;

  for (let index = start; index < content.length; index += 1) {
    const character = content[index];

    if (quote) {
      if (character === quote) quote = undefined;
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (character === '<') return -1;
    if (character === '>') return index;
  }

  return -1;
}

function xmlFragmentStructureError(content: string): string | undefined {
  const stack: string[] = [];
  let cursor = 0;

  while (cursor < content.length) {
    const start = content.indexOf('<', cursor);
    if (start === -1) {
      const tailError = fragmentTextStructureError(content.slice(cursor), stack.length);
      if (tailError) return tailError;
      break;
    }

    const textError = fragmentTextStructureError(content.slice(cursor, start), stack.length);
    if (textError) return textError;

    if (content.startsWith('<!--', start)) {
      const end = content.indexOf('-->', start + 4);
      if (end === -1) return 'XML comment is not terminated.';
      if (content.slice(start + 4, end).includes('--')) {
        return 'XML comment contains an invalid double-hyphen sequence.';
      }
      cursor = end + 3;
      continue;
    }

    if (content.startsWith('<![CDATA[', start)) {
      if (stack.length === 0) {
        return 'XML CDATA section is not allowed outside a top-level element.';
      }
      const end = content.indexOf(']]>', start + 9);
      if (end === -1) return 'XML CDATA section is not terminated.';
      cursor = end + 3;
      continue;
    }

    if (content.startsWith('<?', start)) {
      const end = content.indexOf('?>', start + 2);
      if (end === -1) return 'XML processing instruction is not terminated.';
      cursor = end + 2;
      continue;
    }

    if (content.startsWith('<!', start)) {
      return 'XML declaration markup such as DOCTYPE is not allowed.';
    }

    const end = findMarkupEnd(content, start + 1);
    if (end === -1) return 'XML tag is not terminated correctly.';

    const markup = content.slice(start + 1, end).trim();
    if (!markup) return 'XML tag name is missing.';

    if (markup.startsWith('/')) {
      const closingName = markup.slice(1).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_.:-]*$/.test(closingName)) {
        return 'XML closing tag is invalid.';
      }

      const openingName = stack.pop();
      if (openingName !== closingName) {
        return openingName
          ? `XML closing tag </${closingName}> does not match <${openingName}>.`
          : `XML closing tag </${closingName}> has no matching opening tag.`;
      }

      cursor = end + 1;
      continue;
    }

    const selfClosing = /\/\s*$/.test(markup);
    const body = selfClosing ? markup.replace(/\/\s*$/, '').trim() : markup;
    const openingName = XML_NAME.exec(body)?.[0];

    if (!openingName) return 'XML opening tag is invalid.';
    const remainder = body.slice(openingName.length);
    if (remainder && !/^\s/.test(remainder)) return 'XML opening tag is invalid.';

    const attributeError = openingTagStructureError(body, openingName);
    if (attributeError) return attributeError;
    if (!selfClosing) stack.push(openingName);
    cursor = end + 1;
  }

  const unclosed = stack.at(-1);
  return unclosed ? `XML tag <${unclosed}> is not closed.` : undefined;
}

function inferFileType(name: string, content: string): RulesetSourceType {
  const sample = `${name}\n${content.slice(0, 2_000)}`.toLowerCase();
  if (sample.includes('<decoder') || sample.includes('decoders')) return 'decoders';
  if (sample.includes('<rule') || sample.includes('rules')) return 'rules';
  return 'unknown';
}

function normalizeSource(input: RulesetSourceInput): RulesetSourceFile {
  const tenant = input.tenant?.trim() || tenantFromSourceName(input.name);
  const content = input.content;

  return {
    name: input.name,
    tenant,
    size: input.size ?? Buffer.byteLength(content, 'utf8'),
    type: input.type ?? inferFileType(input.name, content),
    content,
    sha256: createHash('sha256').update(`${input.name}:${content}`).digest('hex'),
  };
}

function extractUseCaseFromInfo(xml: string): string | undefined {
  for (const info of tagValues(xml, 'info')) {
    const match = info.match(/use_case\s*:\s*([a-z0-9_\-.]+)/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

function sourceSectionFor(content: string, index: number): string | undefined {
  const before = content.slice(Math.max(0, index - 5_000), index);
  const matches = [...before.matchAll(/Source file:\s*([^<\n]+)/gi)];
  const section = matches.at(-1)?.[1]?.trim();
  return section?.replace(/-->/g, '').trim();
}

function parseRuleBlock(
  xml: string,
  source: RulesetSourceFile,
  startIndex: number,
  wrapperGroups: readonly string[] = [],
  rawXml: string = xml,
): RuleRecord | null {
  const id = attribute(xml, 'id');
  if (!id) return null;

  const level = Number(attribute(xml, 'level') ?? 0);
  const description = tagValues(xml, 'description')[0] ?? `Rule ${id}`;
  const groups = [...new Set([...wrapperGroups, ...splitCsv(tagValues(xml, 'group').join(','))])];
  const infoUseCase = extractUseCaseFromInfo(xml);
  const useCase = infoUseCase
    ? { id: infoUseCase, confidence: 'confirmed' as const }
    : inferRuleUseCase(groups, description, source.name);
  const dependencies: RuleDependency[] = [];

  for (const value of splitSidReferences(tagValues(xml, 'if_sid').join(','))) {
    dependencies.push({ type: 'if_sid', value });
  }
  for (const value of splitCsv(tagValues(xml, 'if_group').join(','))) {
    dependencies.push({ type: 'if_group', value });
  }
  for (const value of splitSidReferences(tagValues(xml, 'if_matched_sid').join(','))) {
    dependencies.push({ type: 'if_matched_sid', value });
  }
  for (const value of splitCsv(tagValues(xml, 'if_matched_group').join(','))) {
    dependencies.push({ type: 'if_matched_group', value });
  }

  const decodedAs = tagValues(xml, 'decoded_as');
  for (const value of decodedAs) {
    dependencies.push({ type: 'decoded_as', value });
  }

  const fields: RuleField[] = [];
  const fieldExpression = /<field\s+([^>]*)>([\s\S]*?)<\/field>/gi;
  let fieldMatch: RegExpExecArray | null;

  while ((fieldMatch = fieldExpression.exec(xml))) {
    const attributes = fieldMatch[1];
    const value = fieldMatch[2];
    if (attributes === undefined || value === undefined) continue;

    const fieldType = attribute(attributes, 'type');
    fields.push({
      name: attribute(attributes, 'name') ?? 'field',
      ...(fieldType ? { type: fieldType } : {}),
      value: decodeEntities(value.trim()),
    });
  }

  for (const value of tagValues(xml, 'match')) {
    fields.push({ name: 'match', value });
  }
  for (const value of tagValues(xml, 'same_field')) {
    fields.push({ name: 'same_field', value });
  }
  for (const value of tagValues(xml, 'different_field')) {
    fields.push({ name: 'different_field', value });
  }

  const frequency = attribute(xml, 'frequency');
  const timeframe = attribute(xml, 'timeframe');
  const sourceSection = sourceSectionFor(source.content, startIndex);
  const hasCorrelationMarkers =
    Boolean(frequency) ||
    Boolean(timeframe) ||
    tagValues(xml, 'if_matched_sid').length > 0 ||
    tagValues(xml, 'if_matched_group').length > 0 ||
    tagValues(xml, 'same_field').length > 0 ||
    tagValues(xml, 'different_field').length > 0;

  return {
    id,
    level,
    description,
    groups,
    status: inferRuleStatus(groups),
    role: inferRuleRole(level, groups, hasCorrelationMarkers),
    severity: ruleSeverityFromLevel(level),
    jiraVisible: level >= 11,
    tenant: source.tenant,
    sourceFile: source.name,
    ...(sourceSection ? { sourceSection } : {}),
    useCaseId: useCase.id,
    useCaseConfidence: useCase.confidence,
    mitre: tagValues(xml, 'id').filter((value) => /^T\d{4}(\.\d{3})?$/i.test(value)),
    dependencies,
    fields,
    ...(frequency ? { frequency } : {}),
    ...(timeframe ? { timeframe } : {}),
    decodedAs,
    options: tagValues(xml, 'options'),
    rawXml,
  };
}

function parseRules(source: RulesetSourceFile): RuleRecord[] {
  const rules: RuleRecord[] = [];
  const semanticContent = maskXmlCommentsPreservingOffsets(source.content);
  const expression = /<rule\b[\s\S]*?<\/rule>/gi;
  let match: RegExpExecArray | null;

  while ((match = expression.exec(semanticContent))) {
    const block = match[0];
    if (!block) continue;

    const rawXml = source.content.slice(match.index, match.index + block.length);
    const rule = parseRuleBlock(
      block,
      source,
      match.index,
      enclosingRuleGroups(semanticContent, match.index),
      rawXml,
    );
    if (rule) rules.push(rule);
  }

  return rules;
}

function parseDecoders(source: RulesetSourceFile): DecoderRecord[] {
  const decoders: DecoderRecord[] = [];
  const semanticContent = maskXmlCommentsPreservingOffsets(source.content);
  const expression = /<decoder\b[\s\S]*?<\/decoder>/gi;
  let match: RegExpExecArray | null;

  while ((match = expression.exec(semanticContent))) {
    const xml = match[0];
    if (!xml) continue;
    const rawXml = source.content.slice(match.index, match.index + xml.length);

    const name = attribute(xml, 'name') ?? tagValues(xml, 'name')[0] ?? 'unnamed_decoder';
    const regex = tagValues(xml, 'regex');
    const parent = tagValues(xml, 'parent')[0];
    const prematch = tagValues(xml, 'prematch');
    const orderFields = tagValues(xml, 'order').flatMap(splitCsv);

    if (name === 'unnamed_decoder' && regex.length === 0 && !parent) continue;

    decoders.push({
      name,
      ...(parent ? { parent } : {}),
      prematch,
      regex,
      orderFields,
      tenant: source.tenant,
      sourceFile: source.name,
      rawXml,
    });
  }

  return decoders;
}

function validateRuleset(
  files: readonly RulesetSourceFile[],
  rules: readonly RuleRecord[],
  decoders: readonly DecoderRecord[],
  useCases: readonly RulesUseCase[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const file of files) {
    const structureError = xmlFragmentStructureError(file.content);
    if (!structureError) continue;

    issues.push({
      severity: 'error',
      type: 'malformed_xml_structure',
      title: `Malformed XML structure in ${file.name}`,
      detail: structureError,
      fileName: file.name,
      tenant: file.tenant,
    });
  }

  const knownUseCases = new Set(useCases.map((useCase) => useCase.id));
  const ruleGroups = new Map<string, RuleRecord[]>();

  for (const rule of rules) {
    ruleGroups.set(rule.id, [...(ruleGroups.get(rule.id) ?? []), rule]);
  }

  for (const [id, duplicates] of ruleGroups) {
    if (duplicates.length <= 1) continue;
    issues.push({
      severity: 'error',
      type: 'duplicate_rule_id',
      title: `Duplicate rule ID ${id}`,
      detail: `${duplicates.length} rules share the same Wazuh rule ID.`,
      ruleId: id,
      ...(duplicates[0]?.tenant ? { tenant: duplicates[0].tenant } : {}),
    });
  }

  const decoderGroups = new Map<string, DecoderRecord[]>();
  for (const decoder of decoders) {
    decoderGroups.set(decoder.name, [...(decoderGroups.get(decoder.name) ?? []), decoder]);
  }

  for (const [name, duplicates] of decoderGroups) {
    if (duplicates.length <= 1) continue;
    issues.push({
      severity: 'warning',
      type: 'duplicate_decoder_name',
      title: `Duplicate decoder ${name}`,
      detail: `${duplicates.length} decoder blocks share the same decoder name.`,
      decoderName: name,
      ...(duplicates[0]?.tenant ? { tenant: duplicates[0].tenant } : {}),
    });
  }

  const producedGroups = new Set<string>();
  for (const rule of rules) {
    for (const group of rule.groups) producedGroups.add(group);
  }

  const ruleIds = new Set(rules.map((rule) => rule.id));
  const decoderNames = new Set(decoders.map((decoder) => decoder.name));

  for (const rule of rules) {
    if (rule.useCaseId === 'unassigned') {
      issues.push({
        severity: 'warning',
        type: 'missing_use_case',
        title: `Rule ${rule.id} has no use case`,
        detail: 'Add <info type="text">use_case:...</info> or extend fallback mappings.',
        ruleId: rule.id,
        fileName: rule.sourceFile,
        tenant: rule.tenant,
      });
    }

    if (rule.useCaseId !== 'unassigned' && !knownUseCases.has(rule.useCaseId)) {
      issues.push({
        severity: 'warning',
        type: 'unknown_use_case_registry',
        title: `Rule ${rule.id} uses unknown use case ${rule.useCaseId}`,
        detail:
          'The use_case info tag resolves to an ID that is not registered in the use-case catalog.',
        ruleId: rule.id,
        fileName: rule.sourceFile,
        tenant: rule.tenant,
      });
    }

    if (rule.jiraVisible && rule.mitre.length === 0) {
      issues.push({
        severity: 'warning',
        type: 'jira_without_mitre',
        title: `Jira-visible rule ${rule.id} has no MITRE`,
        detail: 'Level >= 11 but no MITRE technique was found.',
        ruleId: rule.id,
        tenant: rule.tenant,
      });
    }

    if (rule.level === 0 && rule.mitre.length > 0) {
      issues.push({
        severity: 'info',
        type: 'helper_with_mitre',
        title: `Helper rule ${rule.id} has MITRE`,
        detail: 'Level 0 helper rules usually should not carry ATT&CK mapping unless intentional.',
        ruleId: rule.id,
        tenant: rule.tenant,
      });
    }

    if (rule.level > 16) {
      issues.push({
        severity: 'warning',
        type: 'level_above_standard',
        title: `Rule ${rule.id} level is above 16`,
        detail: `Detected level ${rule.level}. Wazuh rule levels are expected to be between 0 and 16.`,
        ruleId: rule.id,
        tenant: rule.tenant,
      });
    }

    for (const dependency of rule.dependencies) {
      if (
        (dependency.type === 'if_sid' || dependency.type === 'if_matched_sid') &&
        !ruleIds.has(dependency.value)
      ) {
        issues.push({
          severity: 'warning',
          type: 'external_or_missing_sid',
          title: `Rule ${rule.id} references SID ${dependency.value}`,
          detail:
            'The SID was not found in uploaded rule files. It may be a stock Wazuh rule or a missing file.',
          ruleId: rule.id,
          tenant: rule.tenant,
        });
      }

      if (
        (dependency.type === 'if_group' || dependency.type === 'if_matched_group') &&
        !producedGroups.has(dependency.value)
      ) {
        issues.push({
          severity: 'warning',
          type: 'missing_group_dependency',
          title: `Rule ${rule.id} references group ${dependency.value}`,
          detail: 'No uploaded rule produces this group. It may be external, missing, or typo.',
          ruleId: rule.id,
          tenant: rule.tenant,
        });
      }

      if (dependency.type === 'decoded_as' && !decoderNames.has(dependency.value)) {
        issues.push({
          severity: 'warning',
          type: 'missing_decoder',
          title: `Rule ${rule.id} uses decoder ${dependency.value}`,
          detail: 'No uploaded decoder block has this exact decoder name.',
          ruleId: rule.id,
          tenant: rule.tenant,
        });
      }
    }
  }

  for (const decoder of decoders) {
    if (decoder.parent && !decoderNames.has(decoder.parent)) {
      issues.push({
        severity: 'info',
        type: 'external_decoder_parent',
        title: `Decoder ${decoder.name} parent not uploaded`,
        detail: `Parent decoder ${decoder.parent} was not found in uploaded decoder files. It may be stock/built-in or in another file.`,
        decoderName: decoder.name,
        tenant: decoder.tenant,
      });
    }
  }

  for (const file of files) {
    if (file.type !== 'unknown') continue;
    issues.push({
      severity: 'info',
      type: 'unknown_file_type',
      title: `Unknown file type: ${file.name}`,
      detail: 'The file did not clearly look like rules or decoders XML.',
      fileName: file.name,
      tenant: file.tenant,
    });
  }

  return issues;
}

export class WazuhXmlRulesetAnalyzer implements RulesetAnalyzer {
  async analyze(request: AnalyzeRulesetRequest): Promise<ParsedRuleset> {
    const files = request.files.map(normalizeSource);
    const rules = files.flatMap(parseRules);
    const decoders = files.flatMap(parseDecoders);
    const useCases = request.useCases ?? [];
    const issues = validateRuleset(files, rules, decoders, useCases);
    const usedUseCases = new Set(
      rules.map((rule) => rule.useCaseId).filter((id) => id !== 'unassigned'),
    );
    const activeUseCases = useCases.filter((useCase) => usedUseCases.has(useCase.id));
    const brokenDependencyTypes = new Set([
      'external_or_missing_sid',
      'missing_group_dependency',
      'missing_decoder',
    ]);

    return {
      files,
      rules,
      decoders,
      useCases: activeUseCases,
      issues,
      stats: {
        rules: rules.length,
        decoders: decoders.length,
        useCases: usedUseCases.size,
        jiraVisible: rules.filter((rule) => rule.jiraVisible).length,
        testing: rules.filter((rule) => rule.status === 'testing').length,
        production: rules.filter((rule) => rule.status === 'production').length,
        critical: rules.filter((rule) => rule.severity === 'critical').length,
        mitreMapped: rules.filter((rule) => rule.mitre.length > 0).length,
        missingUseCase: rules.filter((rule) => rule.useCaseId === 'unassigned').length,
        brokenDependencies: issues.filter((issue) => brokenDependencyTypes.has(issue.type)).length,
      },
    };
  }
}
