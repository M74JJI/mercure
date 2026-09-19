import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Post,
  ServiceUnavailableException,
  SetMetadata,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
} from '@mercure/platform-backend-identity-domain';
import {
  PersistImportedRuleset,
  QueryRulesetSnapshots,
  RulesetImportUnavailableError,
  RulesetSnapshotNotFoundError,
  type RulesetSnapshotDecoderQuery,
  type RulesetSnapshotIssueQuery,
  type RulesetSnapshotRuleQuery,
} from '@mercure/rules-backend-application';

import {
  RulesSnapshotDecoderPageDocument,
  RulesSnapshotDecodersQueryDto,
  RulesSnapshotDocument,
  RulesSnapshotIssuePageDocument,
  RulesSnapshotIssuesQueryDto,
  RulesSnapshotListQueryDto,
  RulesSnapshotPageDocument,
  RulesSnapshotParamsDto,
  RulesSnapshotRulePageDocument,
  RulesSnapshotRulesQueryDto,
} from './rules-snapshots.dto';
import { ZodParam, ZodQuery } from './zod-route-parameters';

async function translateRulesHttpErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof RulesetSnapshotNotFoundError) {
      throw new NotFoundException('Rules snapshot not found.');
    }

    if (error instanceof RulesetImportUnavailableError) {
      throw new ServiceUnavailableException(error.message);
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

@SetMetadata(
  REQUIRED_CAPABILITIES_METADATA,
  ['rules:read'] satisfies readonly MercureCapability[],
)
@ApiBearerAuth('keycloak')
@ApiTags('rules')
@ApiExtraModels(
  RulesSnapshotParamsDto,
  RulesSnapshotListQueryDto,
  RulesSnapshotRulesQueryDto,
  RulesSnapshotDecodersQueryDto,
  RulesSnapshotIssuesQueryDto,
)
@Controller('rules/snapshots')
export class RulesSnapshotsController {
  constructor(
    @Inject(PersistImportedRuleset)
    private readonly persistImportedRuleset: PersistImportedRuleset,
    @Inject(QueryRulesetSnapshots)
    private readonly queries: QueryRulesetSnapshots,
  ) {}

  @Post('import')
  @SetMetadata(
    REQUIRED_CAPABILITIES_METADATA,
    ['rules:import'] satisfies readonly MercureCapability[],
  )
  @ApiOperation({ summary: 'Import and persist the configured Rules manager snapshot' })
  @ApiCreatedResponse({ type: RulesSnapshotDocument })
  @ApiServiceUnavailableResponse({
    description: 'No usable Rules source files are currently available to import.',
  })
  @ZodSerializerDto(RulesSnapshotDocument)
  importSnapshot() {
    return translateRulesHttpErrors(async () => {
      const persisted = await this.persistImportedRuleset.execute();
      return this.queries.get(persisted.snapshot.id);
    });
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
}
