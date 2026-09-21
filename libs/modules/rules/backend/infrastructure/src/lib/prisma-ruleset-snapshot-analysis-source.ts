import type { PrismaClient } from '@mercure/platform-backend-database/client';
import type {
  RulesetSnapshotAnalysisProfile,
  RulesetSnapshotAnalysisSource,
} from '@mercure/rules-backend-application';
import type {
  ParsedRuleset,
  RuleDependencyType,
  RuleSeverity,
  RulesetSourceType,
  RulesUseCase,
  UseCaseConfidence,
  ValidationSeverity,
} from '@mercure/rules-backend-domain';

function sourceType(value: string): RulesetSourceType {
  if (value === 'rules' || value === 'decoders' || value === 'unknown') return value;
  throw new Error(`Persisted Rules source type is invalid: ${value}`);
}

function ruleSeverity(value: string): RuleSeverity {
  if (
    value === 'informational' ||
    value === 'low' ||
    value === 'medium' ||
    value === 'high' ||
    value === 'critical'
  ) {
    return value;
  }

  throw new Error(`Persisted Rules severity is invalid: ${value}`);
}

function useCaseConfidence(value: string): UseCaseConfidence {
  if (value === 'confirmed' || value === 'inferred' || value === 'unassigned') {
    return value;
  }

  throw new Error(`Persisted Rules use-case confidence is invalid: ${value}`);
}

function validationSeverity(value: string): ValidationSeverity {
  if (value === 'error' || value === 'warning' || value === 'info') return value;
  throw new Error(`Persisted Rules validation severity is invalid: ${value}`);
}

function dependencyType(value: string): RuleDependencyType {
  if (
    value === 'if_sid' ||
    value === 'if_group' ||
    value === 'if_matched_sid' ||
    value === 'if_matched_group' ||
    value === 'decoded_as'
  ) {
    return value;
  }

  throw new Error(`Persisted Rules dependency type is invalid: ${value}`);
}

function useCaseSource(value: string): RulesUseCase['source'] {
  if (value === 'system' || value === 'custom') return value;
  throw new Error(`Persisted Rules use-case source is invalid: ${value}`);
}

function safeNumber(value: bigint, label: string): number {
  const converted = Number(value);
  if (!Number.isSafeInteger(converted)) {
    throw new Error(`Persisted ${label} is outside the safe integer range.`);
  }
  return converted;
}

export class PrismaRulesetSnapshotAnalysisSource implements RulesetSnapshotAnalysisSource {
  constructor(private readonly database: PrismaClient) {}

  async load(
    snapshotId: string,
    profile: RulesetSnapshotAnalysisProfile = 'full',
  ): Promise<ParsedRuleset | null> {
    const snapshot = await this.database.rulesetSnapshot.findUnique({
      where: { id: snapshotId },
      select: {
        ruleCount: true,
        decoderCount: true,
        useCaseCount: true,
        jiraVisibleCount: true,
        testingCount: true,
        productionCount: true,
        criticalCount: true,
        mitreMappedCount: true,
        missingUseCaseCount: true,
        unresolvedDependencyCount: true,
      },
    });

    if (!snapshot) return null;

    const includeFiles = profile === 'full' || profile === 'comparison' || profile === 'roundtrip';
    const includeFileContent = profile === 'full' || profile === 'roundtrip';
    const includeRuleXml = profile === 'full' || profile === 'quality' || profile === 'roundtrip';
    const includeDecoders = profile !== 'roundtrip';
    const includeDecoderXml = profile === 'full';
    const includeUseCases = profile === 'full' || profile === 'graph';
    const includeIssues = profile === 'full' || profile === 'comparison';

    const [files, fileContents, rules, ruleXml, decoders, decoderXml, useCases, issues] =
      await Promise.all([
        includeFiles
          ? this.database.rulesetSnapshotFile.findMany({
              where: { snapshotId },
              orderBy: { position: 'asc' },
              select: {
                position: true,
                name: true,
                tenant: true,
                size: true,
                sourceType: true,
                sha256: true,
              },
            })
          : Promise.resolve([]),
        includeFileContent
          ? this.database.rulesetSnapshotFile.findMany({
              where: { snapshotId },
              orderBy: { position: 'asc' },
              select: { position: true, content: true },
            })
          : Promise.resolve([]),
        this.database.rulesetSnapshotRule.findMany({
          where: { snapshotId },
          orderBy: { position: 'asc' },
          select: {
            position: true,
            ruleId: true,
            level: true,
            description: true,
            status: true,
            role: true,
            severity: true,
            jiraVisible: true,
            tenant: true,
            sourceSection: true,
            useCaseId: true,
            useCaseConfidence: true,
            frequency: true,
            timeframe: true,
            sourceFile: { select: { name: true } },
            groups: { orderBy: { position: 'asc' }, select: { value: true } },
            mitreIds: { orderBy: { position: 'asc' }, select: { value: true } },
            dependencies: {
              orderBy: { position: 'asc' },
              select: { type: true, value: true },
            },
            fields: {
              orderBy: { position: 'asc' },
              select: { name: true, fieldType: true, value: true },
            },
            decodedAs: { orderBy: { position: 'asc' }, select: { value: true } },
            options: { orderBy: { position: 'asc' }, select: { value: true } },
          },
        }),
        includeRuleXml
          ? this.database.rulesetSnapshotRule.findMany({
              where: { snapshotId },
              orderBy: { position: 'asc' },
              select: { position: true, rawXml: true },
            })
          : Promise.resolve([]),
        includeDecoders
          ? this.database.rulesetSnapshotDecoder.findMany({
              where: { snapshotId },
              orderBy: { position: 'asc' },
              select: {
                position: true,
                name: true,
                parent: true,
                tenant: true,
                sourceFile: { select: { name: true } },
                prematches: { orderBy: { position: 'asc' }, select: { value: true } },
                regexValues: { orderBy: { position: 'asc' }, select: { value: true } },
                orderFields: { orderBy: { position: 'asc' }, select: { value: true } },
              },
            })
          : Promise.resolve([]),
        includeDecoderXml
          ? this.database.rulesetSnapshotDecoder.findMany({
              where: { snapshotId },
              orderBy: { position: 'asc' },
              select: { position: true, rawXml: true },
            })
          : Promise.resolve([]),
        includeUseCases
          ? this.database.rulesetSnapshotUseCase.findMany({
              where: { snapshotId },
              orderBy: { position: 'asc' },
              select: {
                useCaseId: true,
                name: true,
                shortName: true,
                description: true,
                component: true,
                vendor: true,
                product: true,
                domain: true,
                category: true,
                source: true,
                createdBy: true,
                originalCreatedAt: true,
              },
            })
          : Promise.resolve([]),
        includeIssues
          ? this.database.rulesetSnapshotIssue.findMany({
              where: { snapshotId },
              orderBy: { position: 'asc' },
              select: {
                severity: true,
                type: true,
                title: true,
                detail: true,
                ruleId: true,
                decoderName: true,
                fileName: true,
                tenant: true,
              },
            })
          : Promise.resolve([]),
      ]);

    const fileContentByPosition = new Map(
      fileContents.map((file) => [file.position, file.content] as const),
    );
    const ruleXmlByPosition = new Map(ruleXml.map((rule) => [rule.position, rule.rawXml] as const));
    const decoderXmlByPosition = new Map(
      decoderXml.map((decoder) => [decoder.position, decoder.rawXml] as const),
    );

    return {
      files: files.map((file) => ({
        name: file.name,
        tenant: file.tenant,
        size: safeNumber(file.size, 'Rules source-file size'),
        type: sourceType(file.sourceType),
        content: fileContentByPosition.get(file.position) ?? '',
        sha256: file.sha256,
      })),
      rules: rules.map((rule) => ({
        id: rule.ruleId,
        level: rule.level,
        description: rule.description,
        groups: rule.groups.map((group) => group.value),
        status: rule.status,
        role: rule.role,
        severity: ruleSeverity(rule.severity),
        jiraVisible: rule.jiraVisible,
        tenant: rule.tenant,
        sourceFile: rule.sourceFile.name,
        ...(rule.sourceSection === null ? {} : { sourceSection: rule.sourceSection }),
        useCaseId: rule.useCaseId,
        useCaseConfidence: useCaseConfidence(rule.useCaseConfidence),
        mitre: rule.mitreIds.map((mitre) => mitre.value),
        dependencies: rule.dependencies.map((dependency) => ({
          type: dependencyType(dependency.type),
          value: dependency.value,
        })),
        fields: rule.fields.map((field) => ({
          name: field.name,
          ...(field.fieldType === null ? {} : { type: field.fieldType }),
          value: field.value,
        })),
        ...(rule.frequency === null ? {} : { frequency: rule.frequency }),
        ...(rule.timeframe === null ? {} : { timeframe: rule.timeframe }),
        decodedAs: rule.decodedAs.map((decoded) => decoded.value),
        options: rule.options.map((option) => option.value),
        rawXml: ruleXmlByPosition.get(rule.position) ?? '',
      })),
      decoders: decoders.map((decoder) => ({
        name: decoder.name,
        ...(decoder.parent === null ? {} : { parent: decoder.parent }),
        prematch: decoder.prematches.map((prematch) => prematch.value),
        regex: decoder.regexValues.map((regex) => regex.value),
        orderFields: decoder.orderFields.map((field) => field.value),
        tenant: decoder.tenant,
        sourceFile: decoder.sourceFile.name,
        rawXml: decoderXmlByPosition.get(decoder.position) ?? '',
      })),
      useCases: useCases.map((useCase) => ({
        id: useCase.useCaseId,
        name: useCase.name,
        shortName: useCase.shortName,
        description: useCase.description,
        component: useCase.component,
        vendor: useCase.vendor,
        product: useCase.product,
        domain: useCase.domain,
        category: useCase.category,
        source: useCaseSource(useCase.source),
        createdBy: useCase.createdBy,
        ...(useCase.originalCreatedAt === null ? {} : { createdAt: useCase.originalCreatedAt }),
      })),
      issues: issues.map((issue) => ({
        severity: validationSeverity(issue.severity),
        type: issue.type,
        title: issue.title,
        detail: issue.detail,
        ...(issue.ruleId === null ? {} : { ruleId: issue.ruleId }),
        ...(issue.decoderName === null ? {} : { decoderName: issue.decoderName }),
        ...(issue.fileName === null ? {} : { fileName: issue.fileName }),
        ...(issue.tenant === null ? {} : { tenant: issue.tenant }),
      })),
      stats: {
        rules: snapshot.ruleCount,
        decoders: snapshot.decoderCount,
        useCases: snapshot.useCaseCount,
        jiraVisible: snapshot.jiraVisibleCount,
        testing: snapshot.testingCount,
        production: snapshot.productionCount,
        critical: snapshot.criticalCount,
        mitreMapped: snapshot.mitreMappedCount,
        missingUseCase: snapshot.missingUseCaseCount,
        unresolvedDependencies: snapshot.unresolvedDependencyCount,
      },
    };
  }
}
