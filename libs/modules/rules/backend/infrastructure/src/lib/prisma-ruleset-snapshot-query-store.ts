import type { PrismaClient } from '@mercure/platform-backend-database/client';
import type {
  PageRequest,
  PageResult,
  RulesetSnapshotDecoderQuery,
  RulesetSnapshotDecoderView,
  RulesetSnapshotIssueQuery,
  RulesetSnapshotIssueView,
  RulesetSnapshotQueryStore,
  RulesetSnapshotRuleQuery,
  RulesetSnapshotRuleView,
  RulesetSnapshotSummary,
} from '@mercure/rules-backend-application';

const snapshotSelection = {
  id: true,
  sourceFingerprint: true,
  contentFingerprint: true,
  loadedAt: true,
  createdAt: true,
  complete: true,
  sourceErrorCount: true,
  archiveCount: true,
  fileCount: true,
  ruleCount: true,
  decoderCount: true,
  useCaseCount: true,
  jiraVisibleCount: true,
  testingCount: true,
  productionCount: true,
  criticalCount: true,
  mitreMappedCount: true,
  missingUseCaseCount: true,
  brokenDependencyCount: true,
} as const;

function mapSnapshot(row: {
  readonly id: string;
  readonly sourceFingerprint: string;
  readonly contentFingerprint: string;
  readonly loadedAt: Date;
  readonly createdAt: Date;
  readonly complete: boolean;
  readonly sourceErrorCount: number;
  readonly archiveCount: number;
  readonly fileCount: number;
  readonly ruleCount: number;
  readonly decoderCount: number;
  readonly useCaseCount: number;
  readonly jiraVisibleCount: number;
  readonly testingCount: number;
  readonly productionCount: number;
  readonly criticalCount: number;
  readonly mitreMappedCount: number;
  readonly missingUseCaseCount: number;
  readonly brokenDependencyCount: number;
}): RulesetSnapshotSummary {
  return {
    ...row,
    loadedAt: row.loadedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export class PrismaRulesetSnapshotQueryStore implements RulesetSnapshotQueryStore {
  constructor(private readonly database: PrismaClient) {}

  async listSnapshots(request: PageRequest): Promise<PageResult<RulesetSnapshotSummary>> {
    const [total, rows] = await Promise.all([
      this.database.rulesetSnapshot.count(),
      this.database.rulesetSnapshot.findMany({
        skip: request.offset,
        take: request.limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: snapshotSelection,
      }),
    ]);

    return {
      ...request,
      total,
      items: rows.map(mapSnapshot),
    };
  }

  async getSnapshot(snapshotId: string): Promise<RulesetSnapshotSummary | null> {
    const row = await this.database.rulesetSnapshot.findUnique({
      where: { id: snapshotId },
      select: snapshotSelection,
    });

    return row ? mapSnapshot(row) : null;
  }

  async getRule(
    snapshotId: string,
    position: number,
  ): Promise<RulesetSnapshotRuleView | null> {
    const row = await this.database.rulesetSnapshotRule.findUnique({
      where: { snapshotId_position: { snapshotId, position } },
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
    });

    if (!row) return null;

    return {
      position: row.position,
      id: row.ruleId,
      level: row.level,
      description: row.description,
      groups: row.groups.map((group) => group.value),
      status: row.status,
      role: row.role,
      severity: row.severity as RulesetSnapshotRuleView['severity'],
      jiraVisible: row.jiraVisible,
      tenant: row.tenant,
      sourceFile: row.sourceFile.name,
      ...(row.sourceSection === null ? {} : { sourceSection: row.sourceSection }),
      useCaseId: row.useCaseId,
      useCaseConfidence: row.useCaseConfidence as RulesetSnapshotRuleView['useCaseConfidence'],
      mitre: row.mitreIds.map((mitre) => mitre.value),
      dependencies: row.dependencies.map((dependency) => ({
        type: dependency.type as RulesetSnapshotRuleView['dependencies'][number]['type'],
        value: dependency.value,
      })),
      fields: row.fields.map((field) => ({
        name: field.name,
        ...(field.fieldType === null ? {} : { type: field.fieldType }),
        value: field.value,
      })),
      ...(row.frequency === null ? {} : { frequency: row.frequency }),
      ...(row.timeframe === null ? {} : { timeframe: row.timeframe }),
      decodedAs: row.decodedAs.map((decoded) => decoded.value),
      options: row.options.map((option) => option.value),
    };
  }

  async getDecoder(
    snapshotId: string,
    position: number,
  ): Promise<RulesetSnapshotDecoderView | null> {
    const row = await this.database.rulesetSnapshotDecoder.findUnique({
      where: { snapshotId_position: { snapshotId, position } },
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
    });

    if (!row) return null;

    return {
      position: row.position,
      name: row.name,
      ...(row.parent === null ? {} : { parent: row.parent }),
      prematch: row.prematches.map((prematch) => prematch.value),
      regex: row.regexValues.map((regex) => regex.value),
      orderFields: row.orderFields.map((field) => field.value),
      tenant: row.tenant,
      sourceFile: row.sourceFile.name,
    };
  }

  async getIssue(
    snapshotId: string,
    position: number,
  ): Promise<RulesetSnapshotIssueView | null> {
    const row = await this.database.rulesetSnapshotIssue.findUnique({
      where: { snapshotId_position: { snapshotId, position } },
      select: {
        position: true,
        severity: true,
        type: true,
        title: true,
        detail: true,
        ruleId: true,
        decoderName: true,
        fileName: true,
        tenant: true,
      },
    });

    if (!row) return null;

    return {
      position: row.position,
      severity: row.severity as RulesetSnapshotIssueView['severity'],
      type: row.type,
      title: row.title,
      detail: row.detail,
      ...(row.ruleId === null ? {} : { ruleId: row.ruleId }),
      ...(row.decoderName === null ? {} : { decoderName: row.decoderName }),
      ...(row.fileName === null ? {} : { fileName: row.fileName }),
      ...(row.tenant === null ? {} : { tenant: row.tenant }),
    };
  }

  async listRules(
    snapshotId: string,
    request: RulesetSnapshotRuleQuery,
  ): Promise<PageResult<RulesetSnapshotRuleView>> {
    const where = {
      snapshotId,
      ...(request.tenant ? { tenant: request.tenant } : {}),
      ...(request.severity ? { severity: request.severity } : {}),
      ...(request.status ? { status: request.status } : {}),
      ...(request.useCaseId ? { useCaseId: request.useCaseId } : {}),
      ...(request.ruleId ? { ruleId: request.ruleId } : {}),
      ...(request.jiraVisible === undefined ? {} : { jiraVisible: request.jiraVisible }),
    };

    const [total, rows] = await Promise.all([
      this.database.rulesetSnapshotRule.count({ where }),
      this.database.rulesetSnapshotRule.findMany({
        where,
        skip: request.offset,
        take: request.limit,
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
    ]);

    return {
      ...request,
      total,
      items: rows.map((row) => ({
        position: row.position,
        id: row.ruleId,
        level: row.level,
        description: row.description,
        groups: row.groups.map((group) => group.value),
        status: row.status,
        role: row.role,
        severity: row.severity as RulesetSnapshotRuleView['severity'],
        jiraVisible: row.jiraVisible,
        tenant: row.tenant,
        sourceFile: row.sourceFile.name,
        ...(row.sourceSection === null ? {} : { sourceSection: row.sourceSection }),
        useCaseId: row.useCaseId,
        useCaseConfidence: row.useCaseConfidence as RulesetSnapshotRuleView['useCaseConfidence'],
        mitre: row.mitreIds.map((mitre) => mitre.value),
        dependencies: row.dependencies.map((dependency) => ({
          type: dependency.type as RulesetSnapshotRuleView['dependencies'][number]['type'],
          value: dependency.value,
        })),
        fields: row.fields.map((field) => ({
          name: field.name,
          ...(field.fieldType === null ? {} : { type: field.fieldType }),
          value: field.value,
        })),
        ...(row.frequency === null ? {} : { frequency: row.frequency }),
        ...(row.timeframe === null ? {} : { timeframe: row.timeframe }),
        decodedAs: row.decodedAs.map((decoded) => decoded.value),
        options: row.options.map((option) => option.value),
      })),
    };
  }

  async listDecoders(
    snapshotId: string,
    request: RulesetSnapshotDecoderQuery,
  ): Promise<PageResult<RulesetSnapshotDecoderView>> {
    const where = {
      snapshotId,
      ...(request.tenant ? { tenant: request.tenant } : {}),
      ...(request.name ? { name: request.name } : {}),
    };

    const [total, rows] = await Promise.all([
      this.database.rulesetSnapshotDecoder.count({ where }),
      this.database.rulesetSnapshotDecoder.findMany({
        where,
        skip: request.offset,
        take: request.limit,
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
      }),
    ]);

    return {
      ...request,
      total,
      items: rows.map((row) => ({
        position: row.position,
        name: row.name,
        ...(row.parent === null ? {} : { parent: row.parent }),
        prematch: row.prematches.map((prematch) => prematch.value),
        regex: row.regexValues.map((regex) => regex.value),
        orderFields: row.orderFields.map((field) => field.value),
        tenant: row.tenant,
        sourceFile: row.sourceFile.name,
      })),
    };
  }

  async listIssues(
    snapshotId: string,
    request: RulesetSnapshotIssueQuery,
  ): Promise<PageResult<RulesetSnapshotIssueView>> {
    const where = {
      snapshotId,
      ...(request.severity ? { severity: request.severity } : {}),
      ...(request.type ? { type: request.type } : {}),
    };

    const [total, rows] = await Promise.all([
      this.database.rulesetSnapshotIssue.count({ where }),
      this.database.rulesetSnapshotIssue.findMany({
        where,
        skip: request.offset,
        take: request.limit,
        orderBy: { position: 'asc' },
        select: {
          position: true,
          severity: true,
          type: true,
          title: true,
          detail: true,
          ruleId: true,
          decoderName: true,
          fileName: true,
          tenant: true,
        },
      }),
    ]);

    return {
      ...request,
      total,
      items: rows.map((row) => ({
        position: row.position,
        severity: row.severity as RulesetSnapshotIssueView['severity'],
        type: row.type,
        title: row.title,
        detail: row.detail,
        ...(row.ruleId === null ? {} : { ruleId: row.ruleId }),
        ...(row.decoderName === null ? {} : { decoderName: row.decoderName }),
        ...(row.fileName === null ? {} : { fileName: row.fileName }),
        ...(row.tenant === null ? {} : { tenant: row.tenant }),
      })),
    };
  }
}
