import {
  BadRequestException,
  ConflictException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
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
  ApiNoContentResponse,
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
  CreateCustomRulesUseCase,
  DeleteCustomRulesUseCase,
  RulesSystemUseCaseProtectedError,
  RulesUseCaseAlreadyExistsError,
  RulesUseCaseCatalogValidationError,
  RulesUseCaseNotFoundError,
  UpdateCustomRulesUseCase,
} from '@mercure/rules-backend-application';

import { RulesUseCaseDocument } from './rules-intelligence.dto';
import {
  RulesUseCaseAdministrationParamsDto,
  RulesUseCaseCreateDto,
  RulesUseCaseUpdateDto,
} from './rules-use-case-administration.dto';
import { ZodBody, ZodParam } from './zod-route-parameters';

interface PrincipalRequest {
  readonly mercurePrincipal?: MercurePrincipal;
}

type MutationOperation = 'create' | 'update' | 'delete';

function requirePrincipal(request: PrincipalRequest): MercurePrincipal {
  if (!request.mercurePrincipal) {
    throw new UnauthorizedException('Authentication is required.');
  }

  return request.mercurePrincipal;
}

function translateMutationError(error: unknown): never {
  if (error instanceof RulesUseCaseCatalogValidationError) {
    throw new BadRequestException({
      message: error.message,
      field: error.field,
    });
  }

  if (error instanceof RulesUseCaseNotFoundError) {
    throw new NotFoundException('Rules use case not found.');
  }

  if (error instanceof RulesUseCaseAlreadyExistsError) {
    throw new ConflictException('Rules use case already exists.');
  }

  if (error instanceof RulesSystemUseCaseProtectedError) {
    throw new ConflictException('System Rules use cases are read-only.');
  }

  throw error;
}

@SetMetadata(
  REQUIRED_CAPABILITIES_METADATA,
  ['rules:admin'] satisfies readonly MercureCapability[],
)
@ApiBearerAuth('keycloak')
@ApiTags('rules-use-case-administration')
@ApiExtraModels(
  RulesUseCaseAdministrationParamsDto,
  RulesUseCaseCreateDto,
  RulesUseCaseUpdateDto,
)
@Controller('rules/use-cases')
export class RulesUseCaseAdministrationController {
  private readonly logger = new Logger(RulesUseCaseAdministrationController.name);

  constructor(
    private readonly createUseCase: CreateCustomRulesUseCase,
    private readonly updateUseCase: UpdateCustomRulesUseCase,
    private readonly deleteUseCase: DeleteCustomRulesUseCase,
  ) {}

  private async executeMutation<T>(
    actorSubject: string,
    operation: MutationOperation,
    useCaseId: string,
    action: () => Promise<T>,
  ): Promise<T> {
    try {
      const result = await action();
      this.logger.log({
        event: 'rules.use_case.mutation',
        actorSubject,
        operation,
        useCaseId,
        outcome: 'success',
      });
      return result;
    } catch (error) {
      this.logger.warn({
        event: 'rules.use_case.mutation',
        actorSubject,
        operation,
        useCaseId,
        outcome: 'failure',
        failure: error instanceof Error ? error.name : 'unknown',
      });
      translateMutationError(error);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom Rules use case' })
  @ApiCreatedResponse({ type: RulesUseCaseDocument })
  @ApiBadRequestResponse({ description: 'The use-case payload is invalid.' })
  @ApiConflictResponse({ description: 'The use-case ID already exists.' })
  @ZodSerializerDto(RulesUseCaseDocument)
  create(
    @Req() request: PrincipalRequest,
    @ZodBody(RulesUseCaseCreateDto) body: RulesUseCaseCreateDto,
  ) {
    const principal = requirePrincipal(request);

    return this.executeMutation(principal.subject, 'create', body.id, () =>
      this.createUseCase.execute({
        id: body.id,
        name: body.name,
        shortName: body.shortName,
        description: body.description,
        component: body.component,
        vendor: body.vendor,
        product: body.product,
        domain: body.domain,
        category: body.category,
        createdBy: principal.subject,
      }),
    );
  }

  @Put(':useCaseId')
  @ApiOperation({ summary: 'Update a custom Rules use case' })
  @ApiOkResponse({ type: RulesUseCaseDocument })
  @ApiBadRequestResponse({ description: 'The use-case payload is invalid.' })
  @ApiNotFoundResponse({ description: 'Rules use case not found.' })
  @ApiConflictResponse({ description: 'System Rules use cases are read-only.' })
  @ZodSerializerDto(RulesUseCaseDocument)
  update(
    @Req() request: PrincipalRequest,
    @ZodParam(RulesUseCaseAdministrationParamsDto) params: RulesUseCaseAdministrationParamsDto,
    @ZodBody(RulesUseCaseUpdateDto) body: RulesUseCaseUpdateDto,
  ) {
    const principal = requirePrincipal(request);

    return this.executeMutation(principal.subject, 'update', params.useCaseId, () =>
      this.updateUseCase.execute({
        id: params.useCaseId,
        name: body.name,
        shortName: body.shortName,
        description: body.description,
        component: body.component,
        vendor: body.vendor,
        product: body.product,
        domain: body.domain,
        category: body.category,
      }),
    );
  }

  @Delete(':useCaseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a custom Rules use case' })
  @ApiNoContentResponse({ description: 'The custom Rules use case was deleted.' })
  @ApiNotFoundResponse({ description: 'Rules use case not found.' })
  @ApiConflictResponse({ description: 'System Rules use cases are read-only.' })
  async delete(
    @Req() request: PrincipalRequest,
    @ZodParam(RulesUseCaseAdministrationParamsDto) params: RulesUseCaseAdministrationParamsDto,
  ): Promise<void> {
    const principal = requirePrincipal(request);

    await this.executeMutation(principal.subject, 'delete', params.useCaseId, () =>
      this.deleteUseCase.execute(params.useCaseId),
    );
  }
}
