import { describe, expect, it } from 'vitest';

import { RulesAuthoringDataAccess } from './rules-authoring-api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const draft = {
  id: '10000000-0000-4000-8000-000000000001',
  sourceSnapshotId: '20000000-0000-4000-8000-000000000001',
  sourceFilePosition: 2,
  fileName: 'rules/test.xml',
  tenant: 'manager-a',
  sourceType: 'rules' as const,
  content: '<group name="test,"></group>',
  sha256: 'a'.repeat(64),
  revision: 1,
  state: 'draft' as const,
  createdBy: 'user-1',
  updatedBy: 'user-1',
  createdAt: '2026-09-20T00:00:00.000Z',
  updatedAt: '2026-09-20T00:00:00.000Z',
};

describe('RulesAuthoringDataAccess', () => {
  it('uses typed authoring endpoints for the state transitions', async () => {
    const requests: Request[] = [];
    const api = new RulesAuthoringDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async (request) => {
        requests.push(request);
        const pathname = new URL(request.url).pathname;
        if (pathname.endsWith('/export')) {
          return jsonResponse({
            draftId: draft.id,
            revision: 1,
            fileName: draft.fileName,
            sourceType: draft.sourceType,
            sha256: draft.sha256,
            content: draft.content,
          });
        }
        if (pathname.endsWith('/drafts') && request.method === 'GET') {
          return jsonResponse([
            {
              id: draft.id,
              sourceSnapshotId: draft.sourceSnapshotId,
              sourceFilePosition: draft.sourceFilePosition,
              fileName: draft.fileName,
              tenant: draft.tenant,
              sourceType: draft.sourceType,
              sha256: draft.sha256,
              revision: draft.revision,
              state: draft.state,
              createdBy: draft.createdBy,
              updatedBy: draft.updatedBy,
              createdAt: draft.createdAt,
              updatedAt: draft.updatedAt,
            },
          ]);
        }
        return jsonResponse(draft, request.method === 'POST' && pathname.endsWith('/drafts') ? 201 : 200);
      },
    });

    await api.list();
    await api.create({ sourceSnapshotId: draft.sourceSnapshotId, sourceFilePosition: 2 });
    await api.createNew({
      fileName: '4300-new_rules.xml',
      tenant: 'manager-new',
      sourceType: 'rules',
    });
    await api.get(draft.id);
    await api.update(draft.id, { expectedRevision: 1, content: draft.content });
    await api.validate(draft.id, 1);
    await api.approve(draft.id, 1);
    await api.export(draft.id);

    expect(requests.map((request) => [request.method, new URL(request.url).pathname])).toEqual([
      ['GET', '/api/v1/rules/authoring/drafts'],
      ['POST', '/api/v1/rules/authoring/drafts'],
      ['POST', '/api/v1/rules/authoring/drafts/new'],
      ['GET', '/api/v1/rules/authoring/drafts/' + draft.id],
      ['PUT', '/api/v1/rules/authoring/drafts/' + draft.id],
      ['POST', '/api/v1/rules/authoring/drafts/' + draft.id + '/validate'],
      ['POST', '/api/v1/rules/authoring/drafts/' + draft.id + '/approve'],
      ['GET', '/api/v1/rules/authoring/drafts/' + draft.id + '/export'],
    ]);
  });

  it('returns null for a missing draft', async () => {
    const api = new RulesAuthoringDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async () => new Response(null, { status: 404 }),
    });

    await expect(api.get(draft.id)).resolves.toBeNull();
  });
});
