import {
  createMercureApiClient,
  type ApiComponents,
  type MercureApiClient,
  type MercureApiClientOptions,
} from '@mercure/platform-frontend-api-client';

import { RulesFrontendApiError } from './rules-api';

type Schemas = ApiComponents['schemas'];

export type RulesAuthoringDraft = Schemas['RulesAuthoringDraftDocument'];
export type RulesAuthoringDraftPage = Schemas['RulesAuthoringDraftListDocument'];
export type RulesAuthoringDraftSummary = RulesAuthoringDraftPage['items'][number];
export type RulesAuthoringExport = Schemas['RulesAuthoringExportDocument'];
export type RulesAuthoringCreateInput = Schemas['RulesAuthoringDraftCreateDto'];
export type RulesAuthoringCreateNewInput = Schemas['RulesAuthoringDraftCreateNewDto'];
export type RulesAuthoringUpdateInput = Schemas['RulesAuthoringDraftUpdateDto'];

function noStoreFetch(request: Request): Promise<Response> {
  return fetch(request, { cache: 'no-store' });
}

async function execute<T>(
  operation: string,
  request: () => Promise<{ data?: T; response: Response }>,
): Promise<T> {
  try {
    const { data, response } = await request();
    if (data !== undefined) return data;
    throw new RulesFrontendApiError(operation, response.status);
  } catch (error) {
    if (error instanceof RulesFrontendApiError) throw error;
    throw new RulesFrontendApiError(operation, 0);
  }
}

export class RulesAuthoringDataAccess {
  private readonly client: MercureApiClient;

  constructor(options: MercureApiClientOptions = {}) {
    this.client = createMercureApiClient({
      ...options,
      fetch: options.fetch ?? noStoreFetch,
    });
  }

  list(request: {
    readonly offset: number;
    readonly limit: number;
  }): Promise<RulesAuthoringDraftPage> {
    return execute('list authoring drafts', () =>
      this.client.GET('/api/v1/rules/authoring/drafts', {
        params: {
          query: {
            offset: request.offset,
            limit: request.limit,
          },
        },
      }),
    );
  }

  create(input: RulesAuthoringCreateInput): Promise<RulesAuthoringDraft> {
    return execute('create authoring draft', () =>
      this.client.POST('/api/v1/rules/authoring/drafts', {
        body: input,
      }),
    );
  }

  createNew(input: RulesAuthoringCreateNewInput): Promise<RulesAuthoringDraft> {
    return execute('create new authoring draft', () =>
      this.client.POST('/api/v1/rules/authoring/drafts/new', {
        body: input,
      }),
    );
  }

  async get(draftId: string): Promise<RulesAuthoringDraft | null> {
    try {
      return await execute('get authoring draft', () =>
        this.client.GET('/api/v1/rules/authoring/drafts/{draftId}', {
          params: { path: { draftId } },
        }),
      );
    } catch (error) {
      if (error instanceof RulesFrontendApiError && error.status === 404) return null;
      throw error;
    }
  }

  update(draftId: string, input: RulesAuthoringUpdateInput): Promise<RulesAuthoringDraft> {
    return execute('update authoring draft', () =>
      this.client.PUT('/api/v1/rules/authoring/drafts/{draftId}', {
        params: { path: { draftId } },
        body: input,
      }),
    );
  }

  validate(draftId: string, expectedRevision: number): Promise<RulesAuthoringDraft> {
    return execute('validate authoring draft', () =>
      this.client.POST('/api/v1/rules/authoring/drafts/{draftId}/validate', {
        params: { path: { draftId } },
        body: { expectedRevision },
      }),
    );
  }

  approve(draftId: string, expectedRevision: number): Promise<RulesAuthoringDraft> {
    return execute('approve authoring draft', () =>
      this.client.POST('/api/v1/rules/authoring/drafts/{draftId}/approve', {
        params: { path: { draftId } },
        body: { expectedRevision },
      }),
    );
  }

  export(draftId: string): Promise<RulesAuthoringExport> {
    return execute('export authoring draft', () =>
      this.client.GET('/api/v1/rules/authoring/drafts/{draftId}/export', {
        params: { path: { draftId } },
      }),
    );
  }
}
