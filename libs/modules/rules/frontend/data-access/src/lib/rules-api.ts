import {
  createMercureApiClient,
  type ApiComponents,
  type ApiPaths,
  type MercureApiClient,
  type MercureApiClientOptions,
} from '@mercure/platform-frontend-api-client';

type Schemas = ApiComponents['schemas'];

export type RulesSnapshot = Schemas['RulesSnapshotDocument'];
export type RulesSnapshotPage = Schemas['RulesSnapshotPageDocument'];
export type RulesSnapshotRulePage = Schemas['RulesSnapshotRulePageDocument'];
export type RulesSnapshotDecoderPage = Schemas['RulesSnapshotDecoderPageDocument'];
export type RulesSnapshotIssuePage = Schemas['RulesSnapshotIssuePageDocument'];

export type RulesSnapshotRule = RulesSnapshotRulePage['items'][number];
export type RulesSnapshotDecoder = RulesSnapshotDecoderPage['items'][number];
export type RulesSnapshotIssue = RulesSnapshotIssuePage['items'][number];

export type RulesSnapshotListQuery = NonNullable<
  ApiPaths['/api/v1/rules/snapshots']['get']['parameters']['query']
>;
export type RulesSnapshotRuleQuery = NonNullable<
  ApiPaths['/api/v1/rules/snapshots/{snapshotId}/rules']['get']['parameters']['query']
>;
export type RulesSnapshotDecoderQuery = NonNullable<
  ApiPaths['/api/v1/rules/snapshots/{snapshotId}/decoders']['get']['parameters']['query']
>;
export type RulesSnapshotIssueQuery = NonNullable<
  ApiPaths['/api/v1/rules/snapshots/{snapshotId}/issues']['get']['parameters']['query']
>;

export class RulesFrontendApiError extends Error {
  constructor(
    readonly operation: string,
    readonly status: number,
  ) {
    super(`Rules API request failed during ${operation} with status ${status}.`);
    this.name = 'RulesFrontendApiError';
  }
}

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

export class RulesDataAccess {
  private readonly client: MercureApiClient;

  constructor(options: MercureApiClientOptions = {}) {
    this.client = createMercureApiClient({
      ...options,
      fetch: options.fetch ?? noStoreFetch,
    });
  }

  async listSnapshots(query: RulesSnapshotListQuery = {}): Promise<RulesSnapshotPage> {
    const { data, response } = await safelyRequest('list snapshots', () =>
      this.client.GET('/api/v1/rules/snapshots', {
        params: { query },
      }),
    );

    return requireData('list snapshots', data, response);
  }

  async getSnapshot(snapshotId: string): Promise<RulesSnapshot | null> {
    const { data, response } = await safelyRequest('get snapshot', () =>
      this.client.GET('/api/v1/rules/snapshots/{snapshotId}', {
        params: {
          path: { snapshotId },
        },
      }),
    );

    if (response.status === 404) {
      return null;
    }

    return requireData('get snapshot', data, response);
  }

  async listRules(
    snapshotId: string,
    query: RulesSnapshotRuleQuery = {},
  ): Promise<RulesSnapshotRulePage> {
    const { data, response } = await safelyRequest('list snapshot rules', () =>
      this.client.GET('/api/v1/rules/snapshots/{snapshotId}/rules', {
        params: {
          path: { snapshotId },
          query,
        },
      }),
    );

    return requireData('list snapshot rules', data, response);
  }

  async listDecoders(
    snapshotId: string,
    query: RulesSnapshotDecoderQuery = {},
  ): Promise<RulesSnapshotDecoderPage> {
    const { data, response } = await safelyRequest('list snapshot decoders', () =>
      this.client.GET('/api/v1/rules/snapshots/{snapshotId}/decoders', {
        params: {
          path: { snapshotId },
          query,
        },
      }),
    );

    return requireData('list snapshot decoders', data, response);
  }

  async listIssues(
    snapshotId: string,
    query: RulesSnapshotIssueQuery = {},
  ): Promise<RulesSnapshotIssuePage> {
    const { data, response } = await safelyRequest('list snapshot issues', () =>
      this.client.GET('/api/v1/rules/snapshots/{snapshotId}/issues', {
        params: {
          path: { snapshotId },
          query,
        },
      }),
    );

    return requireData('list snapshot issues', data, response);
  }
}
