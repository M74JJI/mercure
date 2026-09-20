import { createHash, randomUUID } from 'node:crypto';

import type { PrismaClient } from '@mercure/platform-backend-database/client';
import type {
  ImportArchivedRulesetResult,
  RulesetSnapshotIdentity,
  RulesetSnapshotStore,
} from '@mercure/rules-backend-application';

const WRITE_BATCH_SIZE = 1_000;

function parseDate(value: string, label: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${label} timestamp: ${value}`);
  }
  return parsed;
}

function contentFingerprint(files: ImportArchivedRulesetResult['analysis']['files']): string {
  const canonical = [...files]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((file) => [file.name, file.tenant, file.type, file.size, file.sha256]);

  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

function batches<T>(items: readonly T[]): readonly (readonly T[])[] {
  const result: T[][] = [];
  for (let offset = 0; offset < items.length; offset += WRITE_BATCH_SIZE) {
    result.push(items.slice(offset, offset + WRITE_BATCH_SIZE));
  }
  return result;
}

function snapshotIdentity(snapshot: {
  readonly id: string;
  readonly sourceFingerprint: string;
  readonly contentFingerprint: string;
  readonly complete: boolean;
  readonly sourceErrorCount: number;
  readonly loadedAt: Date;
  readonly createdAt: Date;
}): RulesetSnapshotIdentity {
  return {
    id: snapshot.id,
    sourceFingerprint: snapshot.sourceFingerprint,
    contentFingerprint: snapshot.contentFingerprint,
    complete: snapshot.complete,
    sourceErrorCount: snapshot.sourceErrorCount,
    loadedAt: snapshot.loadedAt.toISOString(),
    createdAt: snapshot.createdAt.toISOString(),
  };
}

export class PrismaRulesetSnapshotStore implements RulesetSnapshotStore {
  constructor(private readonly database: PrismaClient) {}

  async persist(imported: ImportArchivedRulesetResult): Promise<RulesetSnapshotIdentity> {
    const loadedAt = parseDate(imported.source.loadedAt, 'snapshot loaded-at');
    const sourceFingerprint = imported.source.fingerprint;
    const fingerprint = contentFingerprint(imported.analysis.files);

    const filePositions = new Map<string, number>();
    const files = imported.analysis.files.map((file, position) => {
      if (filePositions.has(file.name)) {
        throw new Error(`Duplicate source file cannot be persisted: ${file.name}`);
      }
      filePositions.set(file.name, position);

      return {
        position,
        name: file.name,
        tenant: file.tenant,
        size: BigInt(file.size),
        sourceType: file.type,
        content: file.content,
        sha256: file.sha256,
      };
    });

    const archives = imported.source.archives.map((archive, position) => ({
      position,
      name: archive.name,
      size: BigInt(archive.size),
      modifiedAt: parseDate(archive.modifiedAt, `archive ${archive.name}`),
      xmlFiles: archive.xmlFiles,
    }));

    const rules = imported.analysis.rules.map((rule, position) => {
      const sourceFilePosition = filePositions.get(rule.sourceFile);
      if (sourceFilePosition === undefined) {
        throw new Error(`Rule ${rule.id} references an unknown source file: ${rule.sourceFile}`);
      }

      return {
        position,
        sourceFilePosition,
        ruleId: rule.id,
        level: rule.level,
        description: rule.description,
        status: rule.status,
        role: rule.role,
        severity: rule.severity,
        jiraVisible: rule.jiraVisible,
        tenant: rule.tenant,
        sourceSection: rule.sourceSection ?? null,
        useCaseId: rule.useCaseId,
        useCaseConfidence: rule.useCaseConfidence,
        frequency: rule.frequency ?? null,
        timeframe: rule.timeframe ?? null,
        rawXml: rule.rawXml,
      };
    });

    const ruleGroups = imported.analysis.rules.flatMap((rule, rulePosition) =>
      rule.groups.map((value, position) => ({ rulePosition, position, value })),
    );
    const ruleMitre = imported.analysis.rules.flatMap((rule, rulePosition) =>
      rule.mitre.map((value, position) => ({ rulePosition, position, value })),
    );
    const ruleDependencies = imported.analysis.rules.flatMap((rule, rulePosition) =>
      rule.dependencies.map((dependency, position) => ({
        rulePosition,
        position,
        type: dependency.type,
        value: dependency.value,
      })),
    );
    const ruleFields = imported.analysis.rules.flatMap((rule, rulePosition) =>
      rule.fields.map((field, position) => ({
        rulePosition,
        position,
        name: field.name,
        fieldType: field.type ?? null,
        value: field.value,
      })),
    );
    const ruleDecodedAs = imported.analysis.rules.flatMap((rule, rulePosition) =>
      rule.decodedAs.map((value, position) => ({ rulePosition, position, value })),
    );
    const ruleOptions = imported.analysis.rules.flatMap((rule, rulePosition) =>
      rule.options.map((value, position) => ({ rulePosition, position, value })),
    );

    const decoders = imported.analysis.decoders.map((decoder, position) => {
      const sourceFilePosition = filePositions.get(decoder.sourceFile);
      if (sourceFilePosition === undefined) {
        throw new Error(
          `Decoder ${decoder.name} references an unknown source file: ${decoder.sourceFile}`,
        );
      }

      return {
        position,
        sourceFilePosition,
        name: decoder.name,
        parent: decoder.parent ?? null,
        tenant: decoder.tenant,
        rawXml: decoder.rawXml,
      };
    });

    const decoderPrematches = imported.analysis.decoders.flatMap((decoder, decoderPosition) =>
      decoder.prematch.map((value, position) => ({ decoderPosition, position, value })),
    );
    const decoderRegex = imported.analysis.decoders.flatMap((decoder, decoderPosition) =>
      decoder.regex.map((value, position) => ({ decoderPosition, position, value })),
    );
    const decoderOrderFields = imported.analysis.decoders.flatMap((decoder, decoderPosition) =>
      decoder.orderFields.map((value, position) => ({ decoderPosition, position, value })),
    );

    const issues = imported.analysis.issues.map((issue, position) => ({
      position,
      severity: issue.severity,
      type: issue.type,
      title: issue.title,
      detail: issue.detail,
      ruleId: issue.ruleId ?? null,
      decoderName: issue.decoderName ?? null,
      fileName: issue.fileName ?? null,
      tenant: issue.tenant ?? null,
    }));

    const useCases = imported.analysis.useCases.map((useCase, position) => ({
      position,
      useCaseId: useCase.id,
      name: useCase.name,
      shortName: useCase.shortName,
      description: useCase.description,
      component: useCase.component,
      vendor: useCase.vendor,
      product: useCase.product,
      domain: useCase.domain,
      category: useCase.category,
      source: useCase.source,
      createdBy: useCase.createdBy,
      originalCreatedAt: useCase.createdAt ?? null,
    }));

    const sourceErrors = imported.source.errors.map((detail, position) => ({
      position,
      detail,
    }));

    const stats = imported.analysis.stats;

    const existing = await this.database.rulesetSnapshot.findFirst({
      where: {
        sourceFingerprint,
        contentFingerprint: fingerprint,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sourceFingerprint: true,
        contentFingerprint: true,
        complete: true,
        sourceErrorCount: true,
        loadedAt: true,
        createdAt: true,
      },
    });
    if (existing) {
      return snapshotIdentity(existing);
    }

    const snapshotId = randomUUID();
    const deduplicationKey = createHash('sha256')
      .update(`${sourceFingerprint}:${fingerprint}`)
      .digest('hex');

    const operations = [
      this.database.rulesetSnapshot.create({
        data: {
          id: snapshotId,
          sourceRoot: imported.source.sourceRoot,
          sourceFingerprint,
          contentFingerprint: fingerprint,
          deduplicationKey,
          loadedAt,
          complete: sourceErrors.length === 0,
          sourceErrorCount: sourceErrors.length,
          archiveCount: imported.source.archives.length,
          fileCount: imported.analysis.files.length,
          ruleCount: stats.rules,
          decoderCount: stats.decoders,
          useCaseCount: stats.useCases,
          jiraVisibleCount: stats.jiraVisible,
          testingCount: stats.testing,
          productionCount: stats.production,
          criticalCount: stats.critical,
          mitreMappedCount: stats.mitreMapped,
          missingUseCaseCount: stats.missingUseCase,
          unresolvedDependencyCount: stats.unresolvedDependencies,
        },
      }),
      ...batches(sourceErrors).map((batch) =>
        this.database.rulesetSnapshotSourceError.createMany({
          data: batch.map((item) => ({ ...item, snapshotId })),
        }),
      ),
      ...batches(archives).map((batch) =>
        this.database.rulesetSnapshotArchive.createMany({
          data: batch.map((item) => ({ ...item, snapshotId })),
        }),
      ),
      ...batches(files).map((batch) =>
        this.database.rulesetSnapshotFile.createMany({
          data: batch.map((item) => ({ ...item, snapshotId })),
        }),
      ),
      ...batches(rules).map((batch) =>
        this.database.rulesetSnapshotRule.createMany({
          data: batch.map((item) => ({ ...item, snapshotId })),
        }),
      ),
      ...batches(ruleGroups).map((batch) =>
        this.database.rulesetSnapshotRuleGroup.createMany({
          data: batch.map((item) => ({ ...item, snapshotId })),
        }),
      ),
      ...batches(ruleMitre).map((batch) =>
        this.database.rulesetSnapshotRuleMitre.createMany({
          data: batch.map((item) => ({ ...item, snapshotId })),
        }),
      ),
      ...batches(ruleDependencies).map((batch) =>
        this.database.rulesetSnapshotRuleDependency.createMany({
          data: batch.map((item) => ({ ...item, snapshotId })),
        }),
      ),
      ...batches(ruleFields).map((batch) =>
        this.database.rulesetSnapshotRuleField.createMany({
          data: batch.map((item) => ({ ...item, snapshotId })),
        }),
      ),
      ...batches(ruleDecodedAs).map((batch) =>
        this.database.rulesetSnapshotRuleDecodedAs.createMany({
          data: batch.map((item) => ({ ...item, snapshotId })),
        }),
      ),
      ...batches(ruleOptions).map((batch) =>
        this.database.rulesetSnapshotRuleOption.createMany({
          data: batch.map((item) => ({ ...item, snapshotId })),
        }),
      ),
      ...batches(decoders).map((batch) =>
        this.database.rulesetSnapshotDecoder.createMany({
          data: batch.map((item) => ({ ...item, snapshotId })),
        }),
      ),
      ...batches(decoderPrematches).map((batch) =>
        this.database.rulesetSnapshotDecoderPrematch.createMany({
          data: batch.map((item) => ({ ...item, snapshotId })),
        }),
      ),
      ...batches(decoderRegex).map((batch) =>
        this.database.rulesetSnapshotDecoderRegex.createMany({
          data: batch.map((item) => ({ ...item, snapshotId })),
        }),
      ),
      ...batches(decoderOrderFields).map((batch) =>
        this.database.rulesetSnapshotDecoderOrderField.createMany({
          data: batch.map((item) => ({ ...item, snapshotId })),
        }),
      ),
      ...batches(issues).map((batch) =>
        this.database.rulesetSnapshotIssue.createMany({
          data: batch.map((item) => ({ ...item, snapshotId })),
        }),
      ),
      ...batches(useCases).map((batch) =>
        this.database.rulesetSnapshotUseCase.createMany({
          data: batch.map((item) => ({ ...item, snapshotId })),
        }),
      ),
    ];

    try {
      await this.database.$transaction(operations);
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : undefined;
      if (code !== 'P2002') {
        throw error;
      }

      const duplicate = await this.database.rulesetSnapshot.findUnique({
        where: { deduplicationKey },
        select: {
          id: true,
          sourceFingerprint: true,
          contentFingerprint: true,
          complete: true,
          sourceErrorCount: true,
          loadedAt: true,
          createdAt: true,
        },
      });
      if (!duplicate) {
        throw error;
      }
      return snapshotIdentity(duplicate);
    }

    const snapshot = await this.database.rulesetSnapshot.findUniqueOrThrow({
      where: { id: snapshotId },
      select: {
        id: true,
        sourceFingerprint: true,
        contentFingerprint: true,
        complete: true,
        sourceErrorCount: true,
        loadedAt: true,
        createdAt: true,
      },
    });

    return snapshotIdentity(snapshot);
  }
}
