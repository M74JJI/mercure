import { describe, expect, it } from 'vitest';

import { RulesDataAccess, RulesFrontendApiError } from './rules-api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

describe('RulesDataAccess', () => {
  it('imports the configured server-side Rules snapshot without a client body', async () => {
    const requests: Request[] = [];
    const api = new RulesDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async (request) => {
        requests.push(request);
        return jsonResponse(
          {
            id: '00000000-0000-4000-8000-000000000001',
            sourceFingerprint: 'a'.repeat(64),
            contentFingerprint: 'b'.repeat(64),
            loadedAt: '2026-09-19T20:00:00.000Z',
            createdAt: '2026-09-19T20:01:00.000Z',
            complete: true,
            sourceErrorCount: 0,
            archiveCount: 2,
            fileCount: 12,
            ruleCount: 120,
            decoderCount: 8,
            useCaseCount: 6,
            jiraVisibleCount: 20,
            testingCount: 5,
            productionCount: 115,
            criticalCount: 12,
            mitreMappedCount: 100,
            missingUseCaseCount: 3,
            brokenDependencyCount: 1,
          },
          201,
        );
      },
    });

    const snapshot = await api.importSnapshot();

    expect(snapshot.id).toBe('00000000-0000-4000-8000-000000000001');
    expect(requests).toHaveLength(1);
    expect(requests[0]?.method).toBe('POST');
    expect(requests[0]?.url).toBe('https://api.mercure.test/api/v1/rules/snapshots/import');
    expect(await requests[0]?.text()).toBe('');
  });

  it('surfaces unavailable imports without exposing response content', async () => {
    const api = new RulesDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async () => jsonResponse({ detail: '/opt/private/rules' }, 503),
    });

    const error = await api.importSnapshot().catch((failure: unknown) => failure);

    expect(error).toBeInstanceOf(RulesFrontendApiError);
    expect(error).toMatchObject({
      operation: 'import snapshot',
      status: 503,
    });
    expect(String(error)).not.toContain('/opt/private/rules');
  });

  it('lists snapshots using the generated query contract', async () => {
    const requests: Request[] = [];
    const api = new RulesDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async (request) => {
        requests.push(request);
        return jsonResponse({
          offset: 0,
          limit: 25,
          total: 1,
          items: [
            {
              id: '00000000-0000-4000-8000-000000000001',
              sourceFingerprint: 'a'.repeat(64),
              contentFingerprint: 'b'.repeat(64),
              loadedAt: '2026-09-18T15:00:00.000Z',
              createdAt: '2026-09-18T15:01:00.000Z',
              complete: true,
              sourceErrorCount: 0,
              archiveCount: 2,
              fileCount: 12,
              ruleCount: 120,
              decoderCount: 8,
              useCaseCount: 6,
              jiraVisibleCount: 20,
              testingCount: 5,
              productionCount: 115,
              criticalCount: 12,
              mitreMappedCount: 100,
              missingUseCaseCount: 3,
              brokenDependencyCount: 1,
            },
          ],
        });
      },
    });

    const page = await api.listSnapshots({ offset: 0, limit: 25 });

    expect(page.total).toBe(1);
    expect(page.items[0]?.ruleCount).toBe(120);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe(
      'https://api.mercure.test/api/v1/rules/snapshots?offset=0&limit=25',
    );
  });

  it('serializes snapshot child filters through the generated contract', async () => {
    const requests: Request[] = [];
    const api = new RulesDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async (request) => {
        requests.push(request);
        return jsonResponse({
          offset: 0,
          limit: 10,
          total: 0,
          items: [],
        });
      },
    });

    const snapshotId = '00000000-0000-4000-8000-000000000001';

    await api.listRules(snapshotId, {
      offset: 0,
      limit: 10,
      tenant: 'manager-a',
      severity: 'high',
      status: 'production',
      useCaseId: 'uc_admin_config',
      ruleId: '110001',
      jiraVisible: 'true',
    });
    await api.listDecoders(snapshotId, {
      offset: 0,
      limit: 10,
      tenant: 'manager-a',
      name: 'fortigate',
    });
    await api.listIssues(snapshotId, {
      offset: 0,
      limit: 10,
      severity: 'warning',
      type: 'missing_decoder',
    });

    expect(requests).toHaveLength(3);

    const rulesUrl = new URL(requests[0]?.url ?? '');
    expect(rulesUrl.pathname).toBe(
      '/api/v1/rules/snapshots/00000000-0000-4000-8000-000000000001/rules',
    );
    expect(Object.fromEntries(rulesUrl.searchParams)).toMatchObject({
      offset: '0',
      limit: '10',
      tenant: 'manager-a',
      severity: 'high',
      status: 'production',
      useCaseId: 'uc_admin_config',
      ruleId: '110001',
      jiraVisible: 'true',
    });

    const decodersUrl = new URL(requests[1]?.url ?? '');
    expect(decodersUrl.pathname).toBe(
      '/api/v1/rules/snapshots/00000000-0000-4000-8000-000000000001/decoders',
    );
    expect(Object.fromEntries(decodersUrl.searchParams)).toMatchObject({
      offset: '0',
      limit: '10',
      tenant: 'manager-a',
      name: 'fortigate',
    });

    const issuesUrl = new URL(requests[2]?.url ?? '');
    expect(issuesUrl.pathname).toBe(
      '/api/v1/rules/snapshots/00000000-0000-4000-8000-000000000001/issues',
    );
    expect(Object.fromEntries(issuesUrl.searchParams)).toMatchObject({
      offset: '0',
      limit: '10',
      severity: 'warning',
      type: 'missing_decoder',
    });
  });

  it('reads snapshot child records by immutable position', async () => {
    const requests: Request[] = [];
    const api = new RulesDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async (request) => {
        requests.push(request);
        const pathname = new URL(request.url).pathname;
        if (pathname.endsWith('/rules/7'))
          return jsonResponse({
            position: 7,
            id: '310001',
            level: 12,
            description: 'Test rule',
            groups: ['production'],
            status: 'production',
            role: 'detection',
            severity: 'critical',
            jiraVisible: true,
            tenant: 'manager-a',
            sourceFile: 'rules.xml',
            useCaseId: 'uc_test',
            useCaseConfidence: 'confirmed',
            mitre: ['T1059.001'],
            dependencies: [],
            fields: [],
            decodedAs: ['test_decoder'],
            options: [],
          });
        if (pathname.endsWith('/decoders/3'))
          return jsonResponse({
            position: 3,
            name: 'test_decoder',
            prematch: ['test'],
            regex: ['src=(\\S+)'],
            orderFields: ['srcip'],
            tenant: 'manager-a',
            sourceFile: 'decoders.xml',
          });
        return jsonResponse({
          position: 5,
          severity: 'warning',
          type: 'external_or_missing_sid',
          title: 'Dependency is external',
          detail: 'Rule references a SID outside this snapshot.',
          ruleId: '310001',
          tenant: 'manager-a',
        });
      },
    });

    const snapshotId = '00000000-0000-4000-8000-000000000001';
    await expect(api.getRule(snapshotId, 7)).resolves.toMatchObject({ position: 7, id: '310001' });
    await expect(api.getDecoder(snapshotId, 3)).resolves.toMatchObject({
      position: 3,
      name: 'test_decoder',
    });
    await expect(api.getIssue(snapshotId, 5)).resolves.toMatchObject({
      position: 5,
      type: 'external_or_missing_sid',
    });
    expect(requests.map((request) => new URL(request.url).pathname)).toEqual([
      '/api/v1/rules/snapshots/00000000-0000-4000-8000-000000000001/rules/7',
      '/api/v1/rules/snapshots/00000000-0000-4000-8000-000000000001/decoders/3',
      '/api/v1/rules/snapshots/00000000-0000-4000-8000-000000000001/issues/5',
    ]);
  });

  it('returns null when an immutable snapshot child record does not exist', async () => {
    const api = new RulesDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async () => new Response(null, { status: 404 }),
    });
    const snapshotId = '00000000-0000-4000-8000-000000000001';
    await expect(api.getRule(snapshotId, 99)).resolves.toBeNull();
    await expect(api.getDecoder(snapshotId, 99)).resolves.toBeNull();
    await expect(api.getIssue(snapshotId, 99)).resolves.toBeNull();
  });

  it('returns null when a snapshot does not exist', async () => {
    const api = new RulesDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async () => new Response(null, { status: 404 }),
    });

    await expect(api.getSnapshot('00000000-0000-4000-8000-000000000099')).resolves.toBeNull();
  });

  it('normalizes network failures', async () => {
    const api = new RulesDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async () => {
        throw new Error('socket path /private/runtime.sock');
      },
    });

    const error = await api.listSnapshots().catch((failure: unknown) => failure);

    expect(error).toBeInstanceOf(RulesFrontendApiError);
    expect(error).toMatchObject({
      operation: 'list snapshots',
      status: 0,
    });
    expect(String(error)).not.toContain('/private/runtime.sock');
  });

  it('normalizes API failures without exposing response content', async () => {
    const api = new RulesDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async () => jsonResponse({ detail: '/private/server/path' }, 503),
    });

    const error = await api.listSnapshots().catch((failure: unknown) => failure);

    expect(error).toBeInstanceOf(RulesFrontendApiError);
    expect(error).toMatchObject({
      operation: 'list snapshots',
      status: 503,
    });
    expect(String(error)).not.toContain('/private/server/path');
  });
});
