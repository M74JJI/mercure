import type { RulesUseCase } from '@mercure/rules-backend-domain';

export const RULES_USE_CASE_CATALOG = Symbol('mercure.rules.use-case-catalog');

export interface RulesUseCaseCatalogReader {
  list(): Promise<readonly RulesUseCase[]>;
  get(id: string): Promise<RulesUseCase | null>;
}

export interface CreateCustomRulesUseCaseInput {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
  readonly component: string;
  readonly vendor: string;
  readonly product: string;
  readonly domain: string;
  readonly category: string;
  readonly createdBy: string;
}

export interface UpdateCustomRulesUseCaseInput {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
  readonly component: string;
  readonly vendor: string;
  readonly product: string;
  readonly domain: string;
  readonly category: string;
}

export interface RulesUseCaseCatalog extends RulesUseCaseCatalogReader {
  createCustom(input: CreateCustomRulesUseCaseInput): Promise<RulesUseCase>;
  updateCustom(input: UpdateCustomRulesUseCaseInput): Promise<RulesUseCase>;
  deleteCustom(id: string): Promise<void>;
}

export class RulesUseCaseCatalogValidationError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = 'RulesUseCaseCatalogValidationError';
  }
}

export class RulesUseCaseNotFoundError extends Error {
  constructor(readonly useCaseId: string) {
    super(`Rules use case not found: ${useCaseId}`);
    this.name = 'RulesUseCaseNotFoundError';
  }
}

export class RulesUseCaseAlreadyExistsError extends Error {
  constructor(readonly useCaseId: string) {
    super(`Rules use case already exists: ${useCaseId}`);
    this.name = 'RulesUseCaseAlreadyExistsError';
  }
}

export class RulesSystemUseCaseProtectedError extends Error {
  constructor(readonly useCaseId: string) {
    super(`System Rules use case is read-only: ${useCaseId}`);
    this.name = 'RulesSystemUseCaseProtectedError';
  }
}

function requiredText(field: string, value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new RulesUseCaseCatalogValidationError(field, `${field} is required.`);
  }
  return normalized;
}

function useCaseId(value: string): string {
  const normalized = value.trim();
  if (!/^uc_[a-z0-9_]+$/.test(normalized)) {
    throw new RulesUseCaseCatalogValidationError(
      'id',
      'Use-case ID must start with uc_ and contain only lowercase letters, digits, and underscores.',
    );
  }
  if (normalized.length > 255) {
    throw new RulesUseCaseCatalogValidationError(
      'id',
      'Use-case ID must be 255 characters or fewer.',
    );
  }
  return normalized;
}

function normalizedCreateInput(
  input: CreateCustomRulesUseCaseInput,
): CreateCustomRulesUseCaseInput {
  return {
    id: useCaseId(input.id),
    name: requiredText('name', input.name),
    shortName: requiredText('shortName', input.shortName),
    description: requiredText('description', input.description),
    component: requiredText('component', input.component),
    vendor: requiredText('vendor', input.vendor),
    product: requiredText('product', input.product),
    domain: requiredText('domain', input.domain),
    category: requiredText('category', input.category),
    createdBy: requiredText('createdBy', input.createdBy),
  };
}

function normalizedUpdateInput(
  input: UpdateCustomRulesUseCaseInput,
): UpdateCustomRulesUseCaseInput {
  return {
    id: useCaseId(input.id),
    name: requiredText('name', input.name),
    shortName: requiredText('shortName', input.shortName),
    description: requiredText('description', input.description),
    component: requiredText('component', input.component),
    vendor: requiredText('vendor', input.vendor),
    product: requiredText('product', input.product),
    domain: requiredText('domain', input.domain),
    category: requiredText('category', input.category),
  };
}

export class ListRulesUseCases {
  constructor(private readonly catalog: RulesUseCaseCatalogReader) {}

  execute(): Promise<readonly RulesUseCase[]> {
    return this.catalog.list();
  }
}

export class GetRulesUseCase {
  constructor(private readonly catalog: RulesUseCaseCatalogReader) {}

  async execute(id: string): Promise<RulesUseCase> {
    const normalizedId = useCaseId(id);
    const useCase = await this.catalog.get(normalizedId);
    if (!useCase) {
      throw new RulesUseCaseNotFoundError(normalizedId);
    }
    return useCase;
  }
}

export class CreateCustomRulesUseCase {
  constructor(private readonly catalog: RulesUseCaseCatalog) {}

  async execute(input: CreateCustomRulesUseCaseInput): Promise<RulesUseCase> {
    return this.catalog.createCustom(normalizedCreateInput(input));
  }
}

export class UpdateCustomRulesUseCase {
  constructor(private readonly catalog: RulesUseCaseCatalog) {}

  async execute(input: UpdateCustomRulesUseCaseInput): Promise<RulesUseCase> {
    return this.catalog.updateCustom(normalizedUpdateInput(input));
  }
}

export class DeleteCustomRulesUseCase {
  constructor(private readonly catalog: RulesUseCaseCatalog) {}

  async execute(id: string): Promise<void> {
    await this.catalog.deleteCustom(useCaseId(id));
  }
}
