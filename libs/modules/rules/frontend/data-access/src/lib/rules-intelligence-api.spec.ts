import { describe, expect, it } from 'vitest';

import { RulesIntelligenceDataAccess } from './rules-intelligence-api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

describe('RulesIntelligenceDataAccess', () => {
  it('serializes bounded graph filters through the generated API contract', async () => {
    const requests: Request[] = [];
    const api = new RulesIntelligenceDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async (request) => {
        requests.push(request);
        return jsonResponse({
          snapshotId: '00000000-0000-4000-8000-000000000001',
          graph: {
            nodes: [],
            edges: [],
            stats: {
              nodes: 0,
              edges: 0,
              rules: 0,
              decoders: 0,
              fields: 0,
              groups: 0,
              useCases: 0,
              mitre: 0,
              external: 0,
            },
          },
        });
      },
    });

    await api.graph('00000000-0000-4000-8000-000000000001', {
      mode: 'fields',
      tenant: 'manager-a',
      query: 'source.ip',
      includeExternal: 'false',
      limit: 200,
    });

    const url = new URL(requests[0]?.url ?? '');
    expect(url.pathname).toBe(
      '/api/v1/rules/intelligence/snapshots/00000000-0000-4000-8000-000000000001/graph',
    );
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      mode: 'fields',
      tenant: 'manager-a',
      query: 'source.ip',
      includeExternal: 'false',
      limit: '200',
    });
  });

  it('preserves authorization status without exposing response content', async () => {
    const api = new RulesIntelligenceDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async () => jsonResponse({ detail: 'internal identity detail' }, 403),
    });

    const error = await api.listUseCases().catch((failure: unknown) => failure);

    expect(error).toMatchObject({
      operation: 'list Rules use cases',
      status: 403,
    });
    expect(String(error)).not.toContain('internal identity detail');
  });

  it('returns null for a missing use case', async () => {
    const api = new RulesIntelligenceDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async () => new Response(null, { status: 404 }),
    });

    await expect(api.getUseCase('uc_missing')).resolves.toBeNull();
  });
});
