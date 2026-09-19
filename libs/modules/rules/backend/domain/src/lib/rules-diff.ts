import type {
  DecoderRecord,
  ParsedRuleset,
  RuleRecord,
  RulesetSourceFile,
  ValidationIssue,
} from './rules-records';

export interface RulesetDiffItem<T> {
  readonly key: string;
  readonly before?: T;
  readonly after?: T;
  readonly changes?: readonly string[];
}

export interface RulesetDiffSummary {
  readonly rulesAdded: number;
  readonly rulesRemoved: number;
  readonly rulesChanged: number;
  readonly decodersAdded: number;
  readonly decodersRemoved: number;
  readonly decodersChanged: number;
  readonly filesAdded: number;
  readonly filesRemoved: number;
  readonly filesChanged: number;
  readonly useCasesAdded: number;
  readonly useCasesRemoved: number;
  readonly newIssues: number;
  readonly resolvedIssues: number;
  readonly jiraVisibilityChanged: number;
  readonly severityChanged: number;
  readonly mitreChanged: number;
  readonly useCaseChanged: number;
}

export interface RulesetDiff {
  readonly summary: RulesetDiffSummary;
  readonly rules: {
    readonly added: readonly RulesetDiffItem<RuleRecord>[];
    readonly removed: readonly RulesetDiffItem<RuleRecord>[];
    readonly changed: readonly RulesetDiffItem<RuleRecord>[];
  };
  readonly decoders: {
    readonly added: readonly RulesetDiffItem<DecoderRecord>[];
    readonly removed: readonly RulesetDiffItem<DecoderRecord>[];
    readonly changed: readonly RulesetDiffItem<DecoderRecord>[];
  };
  readonly files: {
    readonly added: readonly RulesetDiffItem<RulesetSourceFile>[];
    readonly removed: readonly RulesetDiffItem<RulesetSourceFile>[];
    readonly changed: readonly RulesetDiffItem<RulesetSourceFile>[];
  };
  readonly useCases: {
    readonly added: readonly RulesetDiffItem<string>[];
    readonly removed: readonly RulesetDiffItem<string>[];
  };
  readonly issues: {
    readonly added: readonly RulesetDiffItem<ValidationIssue>[];
    readonly resolved: readonly RulesetDiffItem<ValidationIssue>[];
  };
}

interface PairedItem<T> {
  readonly key: string;
  readonly before?: T;
  readonly after?: T;
}

function sortedStrings(values: readonly unknown[]): readonly string[] {
  return values.map(String).sort((left, right) => left.localeCompare(right));
}

function unorderedEqual(left: readonly unknown[], right: readonly unknown[]): boolean {
  return JSON.stringify(sortedStrings(left)) === JSON.stringify(sortedStrings(right));
}

function groupByKey<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const itemKey = key(item);
    const group = grouped.get(itemKey);
    if (group) {
      group.push(item);
    } else {
      grouped.set(itemKey, [item]);
    }
  }

  return grouped;
}

function pairByKey<T>(
  before: readonly T[],
  after: readonly T[],
  key: (item: T) => string,
): readonly PairedItem<T>[] {
  const beforeGroups = groupByKey(before, key);
  const afterGroups = groupByKey(after, key);
  const keys = [...new Set([...beforeGroups.keys(), ...afterGroups.keys()])].sort((left, right) =>
    left.localeCompare(right),
  );
  const pairs: PairedItem<T>[] = [];

  for (const baseKey of keys) {
    const beforeItems = beforeGroups.get(baseKey) ?? [];
    const afterItems = afterGroups.get(baseKey) ?? [];
    const count = Math.max(beforeItems.length, afterItems.length);

    for (let index = 0; index < count; index += 1) {
      const occurrenceKey = index === 0 ? baseKey : `${baseKey}#${index + 1}`;
      const beforeItem = beforeItems[index];
      const afterItem = afterItems[index];

      pairs.push({
        key: occurrenceKey,
        ...(beforeItem === undefined ? {} : { before: beforeItem }),
        ...(afterItem === undefined ? {} : { after: afterItem }),
      });
    }
  }

  return pairs;
}

function ruleKey(rule: RuleRecord): string {
  return `${rule.tenant}:${rule.id}`;
}

function decoderKey(decoder: DecoderRecord): string {
  return `${decoder.tenant}:${decoder.name}`;
}

function ruleDependencyKey(rule: RuleRecord): readonly string[] {
  return rule.dependencies.map((dependency) => `${dependency.type}:${dependency.value}`);
}

function ruleFieldKey(rule: RuleRecord): readonly string[] {
  return rule.fields.map((field) => `${field.name}:${field.type ?? ''}:${field.value}`);
}

function issueKey(issue: ValidationIssue): string {
  return [
    issue.tenant ?? '',
    issue.severity,
    issue.type,
    issue.ruleId ?? '',
    issue.decoderName ?? '',
    issue.fileName ?? '',
    issue.title,
    issue.detail,
  ].join('|');
}

function compareRules(before: RuleRecord, after: RuleRecord): readonly string[] {
  const changes: string[] = [];

  if (before.level !== after.level) changes.push(`level ${before.level} -> ${after.level}`);
  if (before.description !== after.description) changes.push('description changed');
  if (before.status !== after.status) changes.push(`status ${before.status} -> ${after.status}`);
  if (before.role !== after.role) changes.push(`role ${before.role} -> ${after.role}`);
  if (before.severity !== after.severity) {
    changes.push(`severity ${before.severity} -> ${after.severity}`);
  }
  if (before.jiraVisible !== after.jiraVisible) {
    changes.push(
      `jira ${before.jiraVisible ? 'visible' : 'hidden'} -> ${after.jiraVisible ? 'visible' : 'hidden'}`,
    );
  }
  if (before.useCaseId !== after.useCaseId) {
    changes.push(`use case ${before.useCaseId} -> ${after.useCaseId}`);
  }
  if (before.useCaseConfidence !== after.useCaseConfidence) {
    changes.push(`use case confidence ${before.useCaseConfidence} -> ${after.useCaseConfidence}`);
  }
  if (before.sourceFile !== after.sourceFile) {
    changes.push(`source file ${before.sourceFile} -> ${after.sourceFile}`);
  }
  if (before.sourceSection !== after.sourceSection) changes.push('source section changed');
  if (!unorderedEqual(before.groups, after.groups)) changes.push('groups changed');
  if (!unorderedEqual(before.mitre, after.mitre)) changes.push('MITRE mapping changed');
  if (!unorderedEqual(ruleDependencyKey(before), ruleDependencyKey(after))) {
    changes.push('dependencies changed');
  }
  if (!unorderedEqual(ruleFieldKey(before), ruleFieldKey(after))) {
    changes.push('fields/conditions changed');
  }
  if (before.frequency !== after.frequency || before.timeframe !== after.timeframe) {
    changes.push(
      `correlation ${before.frequency ?? '-'}/${before.timeframe ?? '-'} -> ${after.frequency ?? '-'}/${after.timeframe ?? '-'}`,
    );
  }
  if (!unorderedEqual(before.decodedAs, after.decodedAs)) changes.push('decoded_as changed');
  if (!unorderedEqual(before.options, after.options)) changes.push('options changed');

  return changes;
}

function compareDecoders(before: DecoderRecord, after: DecoderRecord): readonly string[] {
  const changes: string[] = [];

  if (before.parent !== after.parent) {
    changes.push(`parent ${before.parent ?? 'none'} -> ${after.parent ?? 'none'}`);
  }
  if (!unorderedEqual(before.prematch, after.prematch)) changes.push('prematch changed');
  if (!unorderedEqual(before.regex, after.regex)) changes.push('regex changed');
  if (!unorderedEqual(before.orderFields, after.orderFields)) {
    changes.push('order fields changed');
  }
  if (before.sourceFile !== after.sourceFile) {
    changes.push(`source file ${before.sourceFile} -> ${after.sourceFile}`);
  }

  return changes;
}

function compareFiles(before: RulesetSourceFile, after: RulesetSourceFile): readonly string[] {
  const changes: string[] = [];

  if (before.sha256 !== after.sha256) changes.push('sha256/content changed');
  if (before.type !== after.type) changes.push(`type ${before.type} -> ${after.type}`);
  if (before.size !== after.size) changes.push(`size ${before.size} -> ${after.size}`);
  if (before.tenant !== after.tenant) {
    changes.push(`tenant ${before.tenant} -> ${after.tenant}`);
  }

  return changes;
}

function diffPairedItems<T>(
  pairs: readonly PairedItem<T>[],
  compare: (before: T, after: T) => readonly string[],
): {
  readonly added: readonly RulesetDiffItem<T>[];
  readonly removed: readonly RulesetDiffItem<T>[];
  readonly changed: readonly RulesetDiffItem<T>[];
} {
  const added: RulesetDiffItem<T>[] = [];
  const removed: RulesetDiffItem<T>[] = [];
  const changed: RulesetDiffItem<T>[] = [];

  for (const pair of pairs) {
    if (pair.before === undefined && pair.after !== undefined) {
      added.push({ key: pair.key, after: pair.after });
      continue;
    }

    if (pair.before !== undefined && pair.after === undefined) {
      removed.push({ key: pair.key, before: pair.before });
      continue;
    }

    if (pair.before !== undefined && pair.after !== undefined) {
      const changes = compare(pair.before, pair.after);
      if (changes.length > 0) {
        changed.push({
          key: pair.key,
          before: pair.before,
          after: pair.after,
          changes,
        });
      }
    }
  }

  return { added, removed, changed };
}

function diffIssues(
  before: readonly ValidationIssue[],
  after: readonly ValidationIssue[],
): {
  readonly added: readonly RulesetDiffItem<ValidationIssue>[];
  readonly resolved: readonly RulesetDiffItem<ValidationIssue>[];
} {
  const pairs = pairByKey(before, after, issueKey);
  const added: RulesetDiffItem<ValidationIssue>[] = [];
  const resolved: RulesetDiffItem<ValidationIssue>[] = [];

  for (const pair of pairs) {
    if (pair.before === undefined && pair.after !== undefined) {
      added.push({ key: pair.key, after: pair.after });
    } else if (pair.before !== undefined && pair.after === undefined) {
      resolved.push({ key: pair.key, before: pair.before });
    }
  }

  return { added, resolved };
}

function assignedUseCases(ruleset: ParsedRuleset): Set<string> {
  return new Set(
    ruleset.rules
      .map((rule) => rule.useCaseId)
      .filter((useCaseId) => useCaseId && useCaseId !== 'unassigned'),
  );
}

export function diffRulesets(before: ParsedRuleset, after: ParsedRuleset): RulesetDiff {
  const rules = diffPairedItems(pairByKey(before.rules, after.rules, ruleKey), compareRules);
  const decoders = diffPairedItems(
    pairByKey(before.decoders, after.decoders, decoderKey),
    compareDecoders,
  );
  const files = diffPairedItems(
    pairByKey(before.files, after.files, (file) => file.name),
    compareFiles,
  );

  const beforeUseCases = assignedUseCases(before);
  const afterUseCases = assignedUseCases(after);
  const useCasesAdded = [...afterUseCases]
    .filter((id) => !beforeUseCases.has(id))
    .sort((left, right) => left.localeCompare(right))
    .map((id) => ({ key: id, after: id }));
  const useCasesRemoved = [...beforeUseCases]
    .filter((id) => !afterUseCases.has(id))
    .sort((left, right) => left.localeCompare(right))
    .map((id) => ({ key: id, before: id }));

  const issues = diffIssues(before.issues, after.issues);

  return {
    summary: {
      rulesAdded: rules.added.length,
      rulesRemoved: rules.removed.length,
      rulesChanged: rules.changed.length,
      decodersAdded: decoders.added.length,
      decodersRemoved: decoders.removed.length,
      decodersChanged: decoders.changed.length,
      filesAdded: files.added.length,
      filesRemoved: files.removed.length,
      filesChanged: files.changed.length,
      useCasesAdded: useCasesAdded.length,
      useCasesRemoved: useCasesRemoved.length,
      newIssues: issues.added.length,
      resolvedIssues: issues.resolved.length,
      jiraVisibilityChanged: rules.changed.filter((item) =>
        item.changes?.some((change) => change.startsWith('jira ')),
      ).length,
      severityChanged: rules.changed.filter((item) =>
        item.changes?.some((change) => change.startsWith('severity ')),
      ).length,
      mitreChanged: rules.changed.filter((item) => item.changes?.includes('MITRE mapping changed'))
        .length,
      useCaseChanged: rules.changed.filter((item) =>
        item.changes?.some(
          (change) => change.startsWith('use case ') && !change.startsWith('use case confidence '),
        ),
      ).length,
    },
    rules,
    decoders,
    files,
    useCases: {
      added: useCasesAdded,
      removed: useCasesRemoved,
    },
    issues,
  };
}
