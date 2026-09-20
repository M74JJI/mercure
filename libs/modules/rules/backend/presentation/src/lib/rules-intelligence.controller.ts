import { Controller, Get, NotFoundException, SetMetadata } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';

import {
  AnalyzeRulesetSnapshotFields,
  AnalyzeRulesetSnapshotRoundtrip,
  BuildRulesetSnapshotGraph,
  CompareRulesetSnapshots,
  GetRulesUseCase,
  ListRulesUseCases,
  RulesetSnapshotNotFoundError,
  RulesUseCaseNotFoundError,
  ScoreRulesetSnapshotQuality,
} from '@mercure/rules-backend-application';
import {
  REQUIRED_CAPABILITIES_METADATA,
  type MercureCapability,
} from '@mercure/platform-backend-identity-domain';

import {
  RulesFieldIntelligenceDocument,
  RulesFieldIntelligenceQueryDto,
  RulesGraphDocument,
  RulesGraphQueryDto,
  RulesIntelligenceSnapshotParamsDto,
  RulesQualityDocument,
  RulesQualityQueryDto,
  RulesRoundtripDocument,
  RulesRoundtripQueryDto,
  RulesSnapshotCompareDocument,
  RulesSnapshotCompareQueryDto,
  RulesUseCaseDocument,
  RulesUseCaseListQueryDto,
  RulesUseCasePageDocument,
  RulesUseCaseParamsDto,
} from './rules-intelligence.dto';
import {
  presentFieldIntelligence,
  presentGraph,
  presentQuality,
  presentRoundtrip,
  presentSnapshotComparison,
  presentUseCases,
} from './rules-intelligence.presenter';
import { ZodParam, ZodQuery } from './zod-route-parameters';

async function translateReadErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof RulesetSnapshotNotFoundError) {
      throw new NotFoundException('Rules snapshot not found.');
    }

    if (error instanceof RulesUseCaseNotFoundError) {
      throw new NotFoundException('Rules use case not found.');
    }

    throw error;
  }
}

const rulesReadRequirement = ['rules:read'] satisfies readonly MercureCapability[];

@SetMetadata(REQUIRED_CAPABILITIES_METADATA, rulesReadRequirement)
@ApiBearerAuth('keycloak')
@ApiTags('rules-intelligence')
@ApiExtraModels(
  RulesIntelligenceSnapshotParamsDto,
  RulesFieldIntelligenceQueryDto,
  RulesQualityQueryDto,
  RulesGraphQueryDto,
  RulesSnapshotCompareQueryDto,
  RulesRoundtripQueryDto,
)
@Controller('rules/intelligence')
export class RulesIntelligenceController {
  constructor(
    private readonly fields: AnalyzeRulesetSnapshotFields,
    private readonly quality: ScoreRulesetSnapshotQuality,
    private readonly graph: BuildRulesetSnapshotGraph,
    private readonly comparison: CompareRulesetSnapshots,
    private readonly roundtrip: AnalyzeRulesetSnapshotRoundtrip,
  ) {}

  @Get('snapshots/:snapshotId/fields')
  @ApiOperation({ summary: 'Read bounded field intelligence for a Rules snapshot' })
  @ApiOkResponse({ type: RulesFieldIntelligenceDocument })
  @ApiNotFoundResponse({ description: 'Rules snapshot not found.' })
  @ZodSerializerDto(RulesFieldIntelligenceDocument)
  fieldsForSnapshot(
    @ZodParam(RulesIntelligenceSnapshotParamsDto) params: RulesIntelligenceSnapshotParamsDto,
    @ZodQuery(RulesFieldIntelligenceQueryDto) query: RulesFieldIntelligenceQueryDto,
  ) {
    return translateReadErrors(async () =>
      presentFieldIntelligence(await this.fields.execute(params.snapshotId), query),
    );
  }

  @Get('snapshots/:snapshotId/quality')
  @ApiOperation({ summary: 'Read bounded quality scoring for a Rules snapshot' })
  @ApiOkResponse({ type: RulesQualityDocument })
  @ApiNotFoundResponse({ description: 'Rules snapshot not found.' })
  @ZodSerializerDto(RulesQualityDocument)
  qualityForSnapshot(
    @ZodParam(RulesIntelligenceSnapshotParamsDto) params: RulesIntelligenceSnapshotParamsDto,
    @ZodQuery(RulesQualityQueryDto) query: RulesQualityQueryDto,
  ) {
    return translateReadErrors(async () =>
      presentQuality(await this.quality.execute(params.snapshotId), query),
    );
  }

  @Get('snapshots/:snapshotId/graph')
  @ApiOperation({ summary: 'Read a bounded semantic graph for a Rules snapshot' })
  @ApiOkResponse({ type: RulesGraphDocument })
  @ApiNotFoundResponse({ description: 'Rules snapshot not found.' })
  @ZodSerializerDto(RulesGraphDocument)
  graphForSnapshot(
    @ZodParam(RulesIntelligenceSnapshotParamsDto) params: RulesIntelligenceSnapshotParamsDto,
    @ZodQuery(RulesGraphQueryDto) query: RulesGraphQueryDto,
  ) {
    const filters = {
      mode: query.mode,
      ...(query.query === undefined ? {} : { query: query.query }),
      ...(query.tenant === undefined ? {} : { tenant: query.tenant }),
      ...(query.useCaseId === undefined ? {} : { useCaseId: query.useCaseId }),
      ...(query.status === undefined ? {} : { status: query.status }),
      ...(query.role === undefined ? {} : { role: query.role }),
      ...(query.jiraOnly === undefined ? {} : { jiraOnly: query.jiraOnly }),
      ...(query.includeExternal === undefined ? {} : { includeExternal: query.includeExternal }),
      limit: query.limit,
    };

    return translateReadErrors(async () =>
      presentGraph(
        await this.graph.execute({
          snapshotId: params.snapshotId,
          filters,
        }),
        query.limit,
      ),
    );
  }

  @Get('snapshots/:snapshotId/roundtrip')
  @ApiOperation({ summary: 'Read safe XML round-trip diagnostics for a Rules snapshot' })
  @ApiOkResponse({ type: RulesRoundtripDocument })
  @ApiNotFoundResponse({ description: 'Rules snapshot not found.' })
  @ZodSerializerDto(RulesRoundtripDocument)
  roundtripForSnapshot(
    @ZodParam(RulesIntelligenceSnapshotParamsDto) params: RulesIntelligenceSnapshotParamsDto,
    @ZodQuery(RulesRoundtripQueryDto) query: RulesRoundtripQueryDto,
  ) {
    return translateReadErrors(async () =>
      presentRoundtrip(await this.roundtrip.execute(params.snapshotId), query),
    );
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare two immutable Rules snapshots with bounded detail output' })
  @ApiOkResponse({ type: RulesSnapshotCompareDocument })
  @ApiNotFoundResponse({ description: 'One or both Rules snapshots were not found.' })
  @ZodSerializerDto(RulesSnapshotCompareDocument)
  compareSnapshots(@ZodQuery(RulesSnapshotCompareQueryDto) query: RulesSnapshotCompareQueryDto) {
    return translateReadErrors(async () =>
      presentSnapshotComparison(
        await this.comparison.execute({
          beforeSnapshotId: query.beforeSnapshotId,
          afterSnapshotId: query.afterSnapshotId,
        }),
        query,
      ),
    );
  }
}

@SetMetadata(REQUIRED_CAPABILITIES_METADATA, rulesReadRequirement)
@ApiBearerAuth('keycloak')
@ApiTags('rules-use-cases')
@ApiExtraModels(RulesUseCaseParamsDto, RulesUseCaseListQueryDto)
@Controller('rules/use-cases')
export class RulesUseCasesController {
  constructor(
    private readonly listUseCases: ListRulesUseCases,
    private readonly getUseCase: GetRulesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List the canonical Rules use-case catalog' })
  @ApiOkResponse({ type: RulesUseCasePageDocument })
  @ZodSerializerDto(RulesUseCasePageDocument)
  async list(@ZodQuery(RulesUseCaseListQueryDto) query: RulesUseCaseListQueryDto) {
    return presentUseCases(await this.listUseCases.execute(), query);
  }

  @Get(':useCaseId')
  @ApiOperation({ summary: 'Read one canonical Rules use case' })
  @ApiOkResponse({ type: RulesUseCaseDocument })
  @ApiNotFoundResponse({ description: 'Rules use case not found.' })
  @ZodSerializerDto(RulesUseCaseDocument)
  get(@ZodParam(RulesUseCaseParamsDto) params: RulesUseCaseParamsDto) {
    return translateReadErrors(() => this.getUseCase.execute(params.useCaseId));
  }
}
