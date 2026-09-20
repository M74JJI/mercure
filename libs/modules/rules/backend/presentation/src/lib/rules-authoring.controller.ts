import {
  BadRequestException,
  ConflictException,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Post,
  Put,
  Req,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';

import {
  REQUIRED_CAPABILITIES_METADATA,
  type MercureCapability,
  type MercurePrincipal,
} from '@mercure/platform-backend-identity-domain';
import {
  ApproveRulesAuthoringDraft,
  CreateNewRulesAuthoringDraft,
  CreateRulesAuthoringDraft,
  ExportRulesAuthoringDraft,
  GetRulesAuthoringDraft,
  ListRulesAuthoringDrafts,
  RulesAuthoringConflictError,
  RulesAuthoringContentValidationError,
  RulesAuthoringDraftNotFoundError,
  RulesAuthoringInvalidStateError,
  RulesAuthoringSourceNotFoundError,
  RulesAuthoringUnsupportedSourceError,
  UpdateRulesAuthoringDraft,
  ValidateRulesAuthoringDraft,
} from '@mercure/rules-backend-application';

import {
  RulesAuthoringDraftCreateDto,
  RulesAuthoringDraftCreateNewDto,
  RulesAuthoringDraftDocument,
  RulesAuthoringDraftListDocument,
  RulesAuthoringDraftListQueryDto,
  RulesAuthoringDraftParamsDto,
  RulesAuthoringDraftTransitionDto,
  RulesAuthoringDraftUpdateDto,
  RulesAuthoringExportDocument,
} from './rules-authoring.dto';
import { ZodBody, ZodParam, ZodQuery } from './zod-route-parameters';

interface PrincipalRequest {
  readonly mercurePrincipal?: MercurePrincipal;
}

type AuthoringOperation = 'create' | 'edit' | 'validate' | 'approve' | 'export';

function principal(request: PrincipalRequest): MercurePrincipal {
  if (!request.mercurePrincipal) throw new UnauthorizedException('Authentication is required.');
  return request.mercurePrincipal;
}

function translateAuthoringError(error: unknown): never {
  if (error instanceof RulesAuthoringContentValidationError) {
    throw new BadRequestException(error.message);
  }
  if (error instanceof RulesAuthoringUnsupportedSourceError) {
    throw new BadRequestException('This snapshot source type cannot be authored.');
  }
  if (
    error instanceof RulesAuthoringDraftNotFoundError ||
    error instanceof RulesAuthoringSourceNotFoundError
  ) {
    throw new NotFoundException('Rules authoring resource not found.');
  }
  if (
    error instanceof RulesAuthoringConflictError ||
    error instanceof RulesAuthoringInvalidStateError
  ) {
    throw new ConflictException(error.message);
  }
  throw error;
}

@SetMetadata(
  REQUIRED_CAPABILITIES_METADATA,
  ['rules:admin'] satisfies readonly MercureCapability[],
)
@ApiBearerAuth('keycloak')
@ApiTags('rules-authoring')
@ApiExtraModels(
  RulesAuthoringDraftParamsDto,
  RulesAuthoringDraftListQueryDto,
  RulesAuthoringDraftCreateDto,
  RulesAuthoringDraftCreateNewDto,
  RulesAuthoringDraftUpdateDto,
  RulesAuthoringDraftTransitionDto,
)
@Controller('rules/authoring/drafts')
export class RulesAuthoringController {
  private readonly logger = new Logger(RulesAuthoringController.name);

  constructor(
    private readonly listDrafts: ListRulesAuthoringDrafts,
    private readonly getDraft: GetRulesAuthoringDraft,
    private readonly createNewDraft: CreateNewRulesAuthoringDraft,
    private readonly createDraft: CreateRulesAuthoringDraft,
    private readonly updateDraft: UpdateRulesAuthoringDraft,
    private readonly validateDraft: ValidateRulesAuthoringDraft,
    private readonly approveDraft: ApproveRulesAuthoringDraft,
    private readonly exportDraft: ExportRulesAuthoringDraft,
  ) {}

  private async mutation<T>(
    actorSubject: string,
    operation: AuthoringOperation,
    draftId: string | undefined,
    action: () => Promise<T>,
  ): Promise<T> {
    try {
      const result = await action();
      this.logger.log({
        event: 'rules.authoring.mutation',
        actorSubject,
        operation,
        ...(draftId === undefined ? {} : { draftId }),
        outcome: 'success',
      });
      return result;
    } catch (error) {
      this.logger.warn({
        event: 'rules.authoring.mutation',
        actorSubject,
        operation,
        ...(draftId === undefined ? {} : { draftId }),
        outcome: 'failure',
        failure: error instanceof Error ? error.name : 'unknown',
      });
      translateAuthoringError(error);
    }
  }

  @Get()
  @ApiOperation({ summary: 'List Rules authoring drafts' })
  @ApiOkResponse({ type: RulesAuthoringDraftListDocument })
  @ZodSerializerDto(RulesAuthoringDraftListDocument)
  list(@ZodQuery(RulesAuthoringDraftListQueryDto) query: RulesAuthoringDraftListQueryDto) {
    return this.listDrafts.execute({
      offset: query.offset,
      limit: query.limit,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a Rules authoring draft from an immutable snapshot file' })
  @ApiCreatedResponse({ type: RulesAuthoringDraftDocument })
  @ApiBadRequestResponse({ description: 'The source is not authorable.' })
  @ApiNotFoundResponse({ description: 'The source snapshot file was not found.' })
  @ZodSerializerDto(RulesAuthoringDraftDocument)
  create(
    @Req() request: PrincipalRequest,
    @ZodBody(RulesAuthoringDraftCreateDto) body: RulesAuthoringDraftCreateDto,
  ) {
    const actor = principal(request).subject;
    return this.mutation(actor, 'create', undefined, () =>
      this.createDraft.execute({
        sourceSnapshotId: body.sourceSnapshotId,
        sourceFilePosition: body.sourceFilePosition,
        actorSubject: actor,
      }),
    );
  }

  @Post('new')
  @ApiOperation({ summary: 'Create a new bounded logical Rules XML draft' })
  @ApiCreatedResponse({ type: RulesAuthoringDraftDocument })
  @ApiBadRequestResponse({
    description: 'The logical file name, tenant, or source type is invalid.',
  })
  @ZodSerializerDto(RulesAuthoringDraftDocument)
  createNew(
    @Req() request: PrincipalRequest,
    @ZodBody(RulesAuthoringDraftCreateNewDto) body: RulesAuthoringDraftCreateNewDto,
  ) {
    const actor = principal(request).subject;
    return this.mutation(actor, 'create', undefined, () =>
      this.createNewDraft.execute({
        fileName: body.fileName,
        tenant: body.tenant,
        sourceType: body.sourceType,
        actorSubject: actor,
      }),
    );
  }

  @Get(':draftId')
  @ApiOperation({ summary: 'Get one Rules authoring draft' })
  @ApiOkResponse({ type: RulesAuthoringDraftDocument })
  @ApiNotFoundResponse({ description: 'Rules authoring draft not found.' })
  @ZodSerializerDto(RulesAuthoringDraftDocument)
  async get(@ZodParam(RulesAuthoringDraftParamsDto) params: RulesAuthoringDraftParamsDto) {
    try {
      return await this.getDraft.execute(params.draftId);
    } catch (error) {
      translateAuthoringError(error);
    }
  }

  @Put(':draftId')
  @ApiOperation({ summary: 'Update Rules authoring draft XML using optimistic concurrency' })
  @ApiOkResponse({ type: RulesAuthoringDraftDocument })
  @ApiBadRequestResponse({ description: 'The draft content is invalid or exceeds limits.' })
  @ApiNotFoundResponse({ description: 'Rules authoring draft not found.' })
  @ApiConflictResponse({ description: 'The draft revision changed concurrently.' })
  @ZodSerializerDto(RulesAuthoringDraftDocument)
  update(
    @Req() request: PrincipalRequest,
    @ZodParam(RulesAuthoringDraftParamsDto) params: RulesAuthoringDraftParamsDto,
    @ZodBody(RulesAuthoringDraftUpdateDto) body: RulesAuthoringDraftUpdateDto,
  ) {
    const actor = principal(request).subject;
    return this.mutation(actor, 'edit', params.draftId, () =>
      this.updateDraft.execute({
        draftId: params.draftId,
        expectedRevision: body.expectedRevision,
        content: body.content,
        actorSubject: actor,
      }),
    );
  }

  @Post(':draftId/validate')
  @ApiOperation({ summary: 'Validate the exact current Rules authoring draft revision' })
  @ApiOkResponse({ type: RulesAuthoringDraftDocument })
  @ApiNotFoundResponse({ description: 'Rules authoring draft not found.' })
  @ApiConflictResponse({ description: 'The draft revision changed concurrently.' })
  @ZodSerializerDto(RulesAuthoringDraftDocument)
  validate(
    @Req() request: PrincipalRequest,
    @ZodParam(RulesAuthoringDraftParamsDto) params: RulesAuthoringDraftParamsDto,
    @ZodBody(RulesAuthoringDraftTransitionDto) body: RulesAuthoringDraftTransitionDto,
  ) {
    const actor = principal(request).subject;
    return this.mutation(actor, 'validate', params.draftId, () =>
      this.validateDraft.execute(params.draftId, body.expectedRevision, actor),
    );
  }

  @Post(':draftId/approve')
  @ApiOperation({ summary: 'Approve an error-free validated Rules authoring draft revision' })
  @ApiOkResponse({ type: RulesAuthoringDraftDocument })
  @ApiNotFoundResponse({ description: 'Rules authoring draft not found.' })
  @ApiConflictResponse({ description: 'The draft is stale, unvalidated, or contains errors.' })
  @ZodSerializerDto(RulesAuthoringDraftDocument)
  approve(
    @Req() request: PrincipalRequest,
    @ZodParam(RulesAuthoringDraftParamsDto) params: RulesAuthoringDraftParamsDto,
    @ZodBody(RulesAuthoringDraftTransitionDto) body: RulesAuthoringDraftTransitionDto,
  ) {
    const actor = principal(request).subject;
    return this.mutation(actor, 'approve', params.draftId, () =>
      this.approveDraft.execute(params.draftId, body.expectedRevision, actor),
    );
  }

  @Get(':draftId/export')
  @ApiOperation({ summary: 'Export the unchanged approved Rules authoring draft revision' })
  @ApiOkResponse({ type: RulesAuthoringExportDocument })
  @ApiNotFoundResponse({ description: 'Rules authoring draft not found.' })
  @ApiConflictResponse({ description: 'Only an unchanged approved revision can be exported.' })
  @ZodSerializerDto(RulesAuthoringExportDocument)
  export(
    @Req() request: PrincipalRequest,
    @ZodParam(RulesAuthoringDraftParamsDto) params: RulesAuthoringDraftParamsDto,
  ) {
    const actor = principal(request).subject;
    return this.mutation(actor, 'export', params.draftId, () =>
      this.exportDraft.execute(params.draftId),
    );
  }
}
