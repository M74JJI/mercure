import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';

import {
  PersistImportedRuleset,
  QueryRulesetSnapshots,
  RulesetImportUnavailableError,
  RulesetSnapshotNotFoundError,
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

@ApiTags('rules')
@Controller('rules/snapshots')
export class RulesSnapshotsController {
  constructor(
    private readonly persistImportedRuleset: PersistImportedRuleset,
    private readonly queries: QueryRulesetSnapshots,
  ) {}

  @Post('import')
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
  listSnapshots(@Query() query: RulesSnapshotListQueryDto) {
    return this.queries.list(query);
  }

  @Get(':snapshotId')
  @ApiOperation({ summary: 'Get one immutable Rules snapshot' })
  @ApiOkResponse({ type: RulesSnapshotDocument })
  @ApiNotFoundResponse({ description: 'Rules snapshot not found.' })
  @ZodSerializerDto(RulesSnapshotDocument)
  getSnapshot(@Param() params: RulesSnapshotParamsDto) {
    return translateRulesHttpErrors(() => this.queries.get(params.snapshotId));
  }

  @Get(':snapshotId/rules')
  @ApiOperation({ summary: 'List normalized rules in a snapshot' })
  @ApiOkResponse({ type: RulesSnapshotRulePageDocument })
  @ApiNotFoundResponse({ description: 'Rules snapshot not found.' })
  @ZodSerializerDto(RulesSnapshotRulePageDocument)
  listRules(
    @Param() params: RulesSnapshotParamsDto,
    @Query() query: RulesSnapshotRulesQueryDto,
  ) {
    return translateRulesHttpErrors(() => this.queries.listRules(params.snapshotId, query));
  }

  @Get(':snapshotId/decoders')
  @ApiOperation({ summary: 'List normalized decoders in a snapshot' })
  @ApiOkResponse({ type: RulesSnapshotDecoderPageDocument })
  @ApiNotFoundResponse({ description: 'Rules snapshot not found.' })
  @ZodSerializerDto(RulesSnapshotDecoderPageDocument)
  listDecoders(
    @Param() params: RulesSnapshotParamsDto,
    @Query() query: RulesSnapshotDecodersQueryDto,
  ) {
    return translateRulesHttpErrors(() => this.queries.listDecoders(params.snapshotId, query));
  }

  @Get(':snapshotId/issues')
  @ApiOperation({ summary: 'List validation issues in a snapshot' })
  @ApiOkResponse({ type: RulesSnapshotIssuePageDocument })
  @ApiNotFoundResponse({ description: 'Rules snapshot not found.' })
  @ZodSerializerDto(RulesSnapshotIssuePageDocument)
  listIssues(
    @Param() params: RulesSnapshotParamsDto,
    @Query() query: RulesSnapshotIssuesQueryDto,
  ) {
    return translateRulesHttpErrors(() => this.queries.listIssues(params.snapshotId, query));
  }
}
