import {
  ConflictException,
  Controller,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Post,
  Req,
  ServiceUnavailableException,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';

import {
  REQUIRED_CAPABILITIES_METADATA,
  type MercureCapability,
  type MercurePrincipal,
} from '@mercure/platform-backend-identity-domain';
import {
  PersistImportedRuleset,
  QueryRulesetSnapshots,
  RulesetImportInProgressError,
  RulesetImportUnavailableError,
  RulesetSnapshotNotFoundError,
  RulesetSnapshotRecordNotFoundError,
  type RulesetSnapshotDecoderQuery,
  type RulesetSnapshotIssueQuery,
  type RulesetSnapshotRuleQuery,
} from '@mercure/rules-backend-application';

import {
  RulesSnapshotDecoderDocument,
  RulesSnapshotDecoderPageDocument,
  RulesSnapshotDecodersQueryDto,
  RulesSnapshotDocument,
  RulesSnapshotIssueDocument,
  RulesSnapshotIssuePageDocument,
  RulesSnapshotIssuesQueryDto,
  RulesSnapshotListQueryDto,
  RulesSnapshotPageDocument,
  RulesSnapshotParamsDto,
  RulesSnapshotRecordParamsDto,
  RulesSnapshotRuleDocument,
  RulesSnapshotRulePageDocument,
  RulesSnapshotRulesQueryDto,
} from './rules-snapshots.dto';
import { ZodParam, ZodQuery } from './zod-route-parameters';

interface PrincipalRequest {
  readonly mercurePrincipal?: MercurePrincipal;
}

async function translateRulesHttpErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof RulesetSnapshotNotFoundError) {
      throw new NotFoundException('Rules snapshot not found.');
    }

    if (error instanceof RulesetSnapshotRecordNotFoundError) {
      throw new NotFoundException(`Rules snapshot ${error.kind} record not found.`);
    }

    if (error instanceof RulesetImportUnavailableError) {
      throw new ServiceUnavailableException(error.message);
    }

    if (error instanceof RulesetImportInProgressError) {
      throw new ConflictException(error.message);
    }

    throw error;
  }
}

function ruleQueryFromDto(query: RulesSnapshotRulesQueryDto): RulesetSnapshotRuleQuery {
  return {
    offset: query.offset,
    limit: query.limit,
    ...(query.tenant === undefined ? {} : { tenant: query.tenant }),
    ...(query.severity === undefined ? {} : { severity: query.severity }),
    ...(query.status === undefined ? {} : { status: query.status }),
    ...(query.useCaseId === undefined ? {} : { useCaseId: query.useCaseId }),
    ...(query.ruleId === undefined ? {} : { ruleId: query.ruleId }),
    ...(query.jiraVisible === undefined ? {} : { jiraVisible: query.jiraVisible }),
  };
}

function decoderQueryFromDto(query: RulesSnapshotDecodersQueryDto): RulesetSnapshotDecoderQuery {
  return {
    offset: query.offset,
    limit: query.limit,
    ...(query.tenant === undefined ? {} : { tenant: query.tenant }),
    ...(query.name === undefined ? {} : { name: query.name }),
  };
}

function issueQueryFromDto(query: RulesSnapshotIssuesQueryDto): RulesetSnapshotIssueQuery {
  return {
    offset: query.offset,
    limit: query.limit,
    ...(query.severity === undefined ? {} : { severity: query.severity }),
    ...(query.type === undefined ? {} : { type: query.type }),
  };
}

@SetMetadata(REQUIRED_CAPABILITIES_METADATA, ['rules:read'] satisfies readonly MercureCapability[])
@ApiBearerAuth('keycloak')
@ApiTags('rules')
@ApiExtraModels(
  RulesSnapshotParamsDto,
  RulesSnapshotRecordParamsDto,
  RulesSnapshotListQueryDto,
  RulesSnapshotRulesQueryDto,
  RulesSnapshotDecodersQueryDto,
  RulesSnapshotIssuesQueryDto,
)
@Controller('rules/snapshots')
export class RulesSnapshotsController {
  private readonly logger = new Logger(RulesSnapshotsController.name);

  constructor(
    @Inject(PersistImportedRuleset)
    private readonly persistImportedRuleset: PersistImportedRuleset,
    @Inject(QueryRulesetSnapshots)
    private readonly queries: QueryRulesetSnapshots,
  ) {}

  @Post('import')
  @SetMetadata(REQUIRED_CAPABILITIES_METADATA, [
    'rules:import',
  ] satisfies readonly MercureCapability[])
  @ApiOperation({ summary: 'Import and persist the configured Rules manager snapshot' })
  @ApiCreatedResponse({ type: RulesSnapshotDocument })
  @ApiConflictResponse({
    description: 'Another Rules snapshot import is already in progress.',
  })
  @ApiServiceUnavailableResponse({
    description: 'No usable Rules source files are currently available to import.',
  })
  @ZodSerializerDto(RulesSnapshotDocument)
  async importSnapshot(@Req() request: PrincipalRequest) {
    const principal = request.mercurePrincipal;
    if (!principal) {
      throw new UnauthorizedException('Authentication is required.');
    }

    try {
      const snapshot = await translateRulesHttpErrors(async () => {
        const persisted = await this.persistImportedRuleset.execute();
        return this.queries.get(persisted.snapshot.id);
      });

      this.logger.log({
        event: 'rules.snapshot.import',
        actorSubject: principal.subject,
        snapshotId: snapshot.id,
        outcome: 'success',
      });

      return snapshot;
    } catch (error) {
      this.logger.warn({
        event: 'rules.snapshot.import',
        actorSubject: principal.subject,
        outcome: 'failure',
        failure: error instanceof Error ? error.name : 'unknown',
      });
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'List immutable Rules snapshots' })
  @ApiOkResponse({ type: RulesSnapshotPageDocument })
  @ZodSerializerDto(RulesSnapshotPageDocument)
  listSnapshots(@ZodQuery(RulesSnapshotListQueryDto) query: RulesSnapshotListQueryDto) {
    return this.queries.list(query);
  }

  @Get(':snapshotId')
  @ApiOperation({ summary: 'Get one immutable Rules snapshot' })
  @ApiOkResponse({ type: RulesSnapshotDocument })
  @ApiNotFoundResponse({ description: 'Rules snapshot not found.' })
  @ZodSerializerDto(RulesSnapshotDocument)
  getSnapshot(@ZodParam(RulesSnapshotParamsDto) params: RulesSnapshotParamsDto) {
    return translateRulesHttpErrors(() => this.queries.get(params.snapshotId));
  }

  @Get(':snapshotId/rules')
  @ApiOperation({ summary: 'List normalized rules in a snapshot' })
  @ApiOkResponse({ type: RulesSnapshotRulePageDocument })
  @ApiNotFoundResponse({ description: 'Rules snapshot not found.' })
  @ZodSerializerDto(RulesSnapshotRulePageDocument)
  listRules(
    @ZodParam(RulesSnapshotParamsDto) params: RulesSnapshotParamsDto,
    @ZodQuery(RulesSnapshotRulesQueryDto) query: RulesSnapshotRulesQueryDto,
  ) {
    return translateRulesHttpErrors(() =>
      this.queries.listRules(params.snapshotId, ruleQueryFromDto(query)),
    );
  }

  @Get(':snapshotId/rules/:position')
  @ApiOperation({ summary: 'Get one normalized rule record from a snapshot' })
  @ApiOkResponse({ type: RulesSnapshotRuleDocument })
  @ApiNotFoundResponse({ description: 'Rules snapshot or rule record not found.' })
  @ZodSerializerDto(RulesSnapshotRuleDocument)
  getRule(@ZodParam(RulesSnapshotRecordParamsDto) params: RulesSnapshotRecordParamsDto) {
    return translateRulesHttpErrors(() => this.queries.getRule(params.snapshotId, params.position));
  }

  @Get(':snapshotId/decoders')
  @ApiOperation({ summary: 'List normalized decoders in a snapshot' })
  @ApiOkResponse({ type: RulesSnapshotDecoderPageDocument })
  @ApiNotFoundResponse({ description: 'Rules snapshot not found.' })
  @ZodSerializerDto(RulesSnapshotDecoderPageDocument)
  listDecoders(
    @ZodParam(RulesSnapshotParamsDto) params: RulesSnapshotParamsDto,
    @ZodQuery(RulesSnapshotDecodersQueryDto) query: RulesSnapshotDecodersQueryDto,
  ) {
    return translateRulesHttpErrors(() =>
      this.queries.listDecoders(params.snapshotId, decoderQueryFromDto(query)),
    );
  }

  @Get(':snapshotId/decoders/:position')
  @ApiOperation({ summary: 'Get one normalized decoder record from a snapshot' })
  @ApiOkResponse({ type: RulesSnapshotDecoderDocument })
  @ApiNotFoundResponse({ description: 'Rules snapshot or decoder record not found.' })
  @ZodSerializerDto(RulesSnapshotDecoderDocument)
  getDecoder(@ZodParam(RulesSnapshotRecordParamsDto) params: RulesSnapshotRecordParamsDto) {
    return translateRulesHttpErrors(() =>
      this.queries.getDecoder(params.snapshotId, params.position),
    );
  }

  @Get(':snapshotId/issues')
  @ApiOperation({ summary: 'List validation issues in a snapshot' })
  @ApiOkResponse({ type: RulesSnapshotIssuePageDocument })
  @ApiNotFoundResponse({ description: 'Rules snapshot not found.' })
  @ZodSerializerDto(RulesSnapshotIssuePageDocument)
  listIssues(
    @ZodParam(RulesSnapshotParamsDto) params: RulesSnapshotParamsDto,
    @ZodQuery(RulesSnapshotIssuesQueryDto) query: RulesSnapshotIssuesQueryDto,
  ) {
    return translateRulesHttpErrors(() =>
      this.queries.listIssues(params.snapshotId, issueQueryFromDto(query)),
    );
  }

  @Get(':snapshotId/issues/:position')
  @ApiOperation({ summary: 'Get one validation finding from a snapshot' })
  @ApiOkResponse({ type: RulesSnapshotIssueDocument })
  @ApiNotFoundResponse({ description: 'Rules snapshot or validation finding not found.' })
  @ZodSerializerDto(RulesSnapshotIssueDocument)
  getIssue(@ZodParam(RulesSnapshotRecordParamsDto) params: RulesSnapshotRecordParamsDto) {
    return translateRulesHttpErrors(() =>
      this.queries.getIssue(params.snapshotId, params.position),
    );
  }
}
