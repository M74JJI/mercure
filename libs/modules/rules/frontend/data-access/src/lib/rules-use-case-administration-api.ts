import {
  createMercureApiClient,
  type ApiComponents,
  type MercureApiClient,
  type MercureApiClientOptions,
} from '@mercure/platform-frontend-api-client';

import { RulesFrontendApiError } from './rules-api';

type Schemas = ApiComponents['schemas'];

export type RulesUseCaseCreateInput = Schemas['RulesUseCaseCreateDto'];
export type RulesUseCaseUpdateInput = Schemas['RulesUseCaseUpdateDto'];
export type RulesUseCaseAdministrationResult = Schemas['RulesUseCaseDocument'];

function noStoreFetch(request: Request): Promise<Response> {
  return fetch(request, { cache: 'no-store' });
}

async function safelyRequest<T>(operation: string, request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof RulesFrontendApiError) {
      throw error;
    }

    throw new RulesFrontendApiError(operation, 0);
  }
}

function requireData<T>(operation: string, data: T | undefined, response: Response): T {
  if (data !== undefined) {
    return data;
  }

  throw new RulesFrontendApiError(operation, response.status);
}

export class RulesUseCaseAdministrationDataAccess {
  private readonly client: MercureApiClient;

  constructor(options: MercureApiClientOptions = {}) {
    this.client = createMercureApiClient({
      ...options,
      fetch: options.fetch ?? noStoreFetch,
    });
  }

  async create(input: RulesUseCaseCreateInput): Promise<RulesUseCaseAdministrationResult> {
    const { data, response } = await safelyRequest('create Rules use case', () =>
      this.client.POST('/api/v1/rules/use-cases', {
        body: input,
      }),
    );

    return requireData('create Rules use case', data, response);
  }

  async update(
    useCaseId: string,
    input: RulesUseCaseUpdateInput,
  ): Promise<RulesUseCaseAdministrationResult> {
    const { data, response } = await safelyRequest('update Rules use case', () =>
      this.client.PUT('/api/v1/rules/use-cases/{useCaseId}', {
        params: {
          path: { useCaseId },
        },
        body: input,
      }),
    );

    return requireData('update Rules use case', data, response);
  }

  async delete(useCaseId: string): Promise<void> {
    const { response } = await safelyRequest('delete Rules use case', () =>
      this.client.DELETE('/api/v1/rules/use-cases/{useCaseId}', {
        params: {
          path: { useCaseId },
        },
      }),
    );

    if (response.status !== 204) {
      throw new RulesFrontendApiError('delete Rules use case', response.status);
    }
  }
}
