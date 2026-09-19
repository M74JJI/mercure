import {
  createMercureApiClient,
  type ApiComponents,
  type ApiPaths,
  type MercureApiClient,
  type MercureApiClientOptions,
} from '@mercure/platform-frontend-api-client';

import { RulesFrontendApiError } from './rules-api';

type Schemas = ApiComponents['schemas'];

export type RulesFieldIntelligence = Schemas['RulesFieldIntelligenceDocument'];
export type RulesQuality = Schemas['RulesQualityDocument'];
export type RulesGraph = Schemas['RulesGraphDocument'];
export type RulesSnapshotComparison = Schemas['RulesSnapshotCompareDocument'];
export type RulesRoundtrip = Schemas['RulesRoundtripDocument'];
export type RulesUseCasePage = Schemas['RulesUseCasePageDocument'];
export type RulesUseCase = Schemas['RulesUseCaseDocument'];

export type RulesFieldIntelligenceQuery = NonNullable<
  ApiPaths['/api/v1/rules/intelligence/snapshots/{snapshotId}/fields']['get']['parameters']['query']
>;
export type RulesQualityQuery = NonNullable<
  ApiPaths['/api/v1/rules/intelligence/snapshots/{snapshotId}/quality']['get']['parameters']['query']
>;
export type RulesGraphQuery = NonNullable<
  ApiPaths['/api/v1/rules/intelligence/snapshots/{snapshotId}/graph']['get']['parameters']['query']
>;
export type RulesSnapshotComparisonQuery = NonNullable<
  ApiPaths['/api/v1/rules/intelligence/compare']['get']['parameters']['query']
>;
export type RulesRoundtripQuery = NonNullable<
  ApiPaths['/api/v1/rules/intelligence/snapshots/{snapshotId}/roundtrip']['get']['parameters']['query']
>;
export type RulesUseCaseListQuery = NonNullable<
  ApiPaths['/api/v1/rules/use-cases']['get']['parameters']['query']
>;

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

export class RulesIntelligenceDataAccess {
  private readonly client: MercureApiClient;

  constructor(options: MercureApiClientOptions = {}) {
    this.client = createMercureApiClient({
      ...options,
      fetch: options.fetch ?? noStoreFetch,
    });
  }

  async fieldIntelligence(
    snapshotId: string,
    query: RulesFieldIntelligenceQuery = {},
  ): Promise<RulesFieldIntelligence> {
    const { data, response } = await safelyRequest('read field intelligence', () =>
      this.client.GET('/api/v1/rules/intelligence/snapshots/{snapshotId}/fields', {
        params: {
          path: { snapshotId },
          query,
        },
      }),
    );

    return requireData('read field intelligence', data, response);
  }

  async quality(
    snapshotId: string,
    query: RulesQualityQuery = {},
  ): Promise<RulesQuality> {
    const { data, response } = await safelyRequest('read quality intelligence', () =>
      this.client.GET('/api/v1/rules/intelligence/snapshots/{snapshotId}/quality', {
        params: {
          path: { snapshotId },
          query,
        },
      }),
    );

    return requireData('read quality intelligence', data, response);
  }

  async graph(snapshotId: string, query: RulesGraphQuery = {}): Promise<RulesGraph> {
    const { data, response } = await safelyRequest('read Rules graph', () =>
      this.client.GET('/api/v1/rules/intelligence/snapshots/{snapshotId}/graph', {
        params: {
          path: { snapshotId },
          query,
        },
      }),
    );

    return requireData('read Rules graph', data, response);
  }

  async compare(query: RulesSnapshotComparisonQuery): Promise<RulesSnapshotComparison> {
    const { data, response } = await safelyRequest('compare Rules snapshots', () =>
      this.client.GET('/api/v1/rules/intelligence/compare', {
        params: { query },
      }),
    );

    return requireData('compare Rules snapshots', data, response);
  }

  async roundtrip(
    snapshotId: string,
    query: RulesRoundtripQuery = {},
  ): Promise<RulesRoundtrip> {
    const { data, response } = await safelyRequest('read round-trip diagnostics', () =>
      this.client.GET('/api/v1/rules/intelligence/snapshots/{snapshotId}/roundtrip', {
        params: {
          path: { snapshotId },
          query,
        },
      }),
    );

    return requireData('read round-trip diagnostics', data, response);
  }

  async listUseCases(query: RulesUseCaseListQuery = {}): Promise<RulesUseCasePage> {
    const { data, response } = await safelyRequest('list Rules use cases', () =>
      this.client.GET('/api/v1/rules/use-cases', {
        params: { query },
      }),
    );

    return requireData('list Rules use cases', data, response);
  }

  async getUseCase(useCaseId: string): Promise<RulesUseCase | null> {
    const { data, response } = await safelyRequest('get Rules use case', () =>
      this.client.GET('/api/v1/rules/use-cases/{useCaseId}', {
        params: {
          path: { useCaseId },
        },
      }),
    );

    if (response.status === 404) {
      return null;
    }

    return requireData('get Rules use case', data, response);
  }
}
