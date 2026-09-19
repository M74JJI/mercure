import type { PrismaClient } from '@mercure/platform-backend-database/client';
import {
  RulesSystemUseCaseProtectedError,
  RulesUseCaseAlreadyExistsError,
  RulesUseCaseNotFoundError,
  type CreateCustomRulesUseCaseInput,
  type RulesUseCaseCatalog,
  type UpdateCustomRulesUseCaseInput,
} from '@mercure/rules-backend-application';
import type { RulesUseCase } from '@mercure/rules-backend-domain';

function source(value: string): RulesUseCase['source'] {
  if (value === 'system' || value === 'custom') return value;
  throw new Error(`Persisted Rules use-case source is invalid: ${value}`);
}

function mapUseCase(row: {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
  readonly component: string;
  readonly vendor: string;
  readonly product: string;
  readonly domain: string;
  readonly category: string;
  readonly source: string;
  readonly createdBy: string;
  readonly createdAt: Date;
}): RulesUseCase {
  return {
    id: row.id,
    name: row.name,
    shortName: row.shortName,
    description: row.description,
    component: row.component,
    vendor: row.vendor,
    product: row.product,
    domain: row.domain,
    category: row.category,
    source: source(row.source),
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { readonly code?: unknown }).code === 'P2002'
  );
}

export class PrismaRulesUseCaseCatalog implements RulesUseCaseCatalog {
  constructor(private readonly database: PrismaClient) {}

  async list(): Promise<readonly RulesUseCase[]> {
    const rows = await this.database.rulesUseCaseCatalogEntry.findMany({
      orderBy: [{ component: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    });

    return rows.map(mapUseCase);
  }

  async get(id: string): Promise<RulesUseCase | null> {
    const row = await this.database.rulesUseCaseCatalogEntry.findUnique({
      where: { id },
    });

    return row ? mapUseCase(row) : null;
  }

  async createCustom(input: CreateCustomRulesUseCaseInput): Promise<RulesUseCase> {
    try {
      const row = await this.database.rulesUseCaseCatalogEntry.create({
        data: {
          id: input.id,
          name: input.name,
          shortName: input.shortName,
          description: input.description,
          component: input.component,
          vendor: input.vendor,
          product: input.product,
          domain: input.domain,
          category: input.category,
          source: 'custom',
          createdBy: input.createdBy,
        },
      });

      return mapUseCase(row);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new RulesUseCaseAlreadyExistsError(input.id);
      }
      throw error;
    }
  }

  async updateCustom(input: UpdateCustomRulesUseCaseInput): Promise<RulesUseCase> {
    return this.database.$transaction(async (transaction) => {
      const existing = await transaction.rulesUseCaseCatalogEntry.findUnique({
        where: { id: input.id },
        select: { source: true },
      });

      if (!existing) {
        throw new RulesUseCaseNotFoundError(input.id);
      }
      if (existing.source === 'system') {
        throw new RulesSystemUseCaseProtectedError(input.id);
      }

      const row = await transaction.rulesUseCaseCatalogEntry.update({
        where: { id: input.id },
        data: {
          name: input.name,
          shortName: input.shortName,
          description: input.description,
          component: input.component,
          vendor: input.vendor,
          product: input.product,
          domain: input.domain,
          category: input.category,
        },
      });

      return mapUseCase(row);
    });
  }

  async deleteCustom(id: string): Promise<void> {
    await this.database.$transaction(async (transaction) => {
      const existing = await transaction.rulesUseCaseCatalogEntry.findUnique({
        where: { id },
        select: { source: true },
      });

      if (!existing) {
        throw new RulesUseCaseNotFoundError(id);
      }
      if (existing.source === 'system') {
        throw new RulesSystemUseCaseProtectedError(id);
      }

      await transaction.rulesUseCaseCatalogEntry.delete({ where: { id } });
    });
  }
}
