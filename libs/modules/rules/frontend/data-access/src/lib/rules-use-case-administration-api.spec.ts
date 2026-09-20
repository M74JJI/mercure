import { describe, expect, it } from 'vitest';

import {
  RulesUseCaseAdministrationDataAccess,
  type RulesUseCaseCreateInput,
} from './rules-use-case-administration-api';
import { RulesFrontendApiError } from './rules-api';

const input: RulesUseCaseCreateInput = {
  id: 'uc_admin_config',
  name: 'Administrator configuration change',
  shortName: 'Admin config',
  description: 'Tracks privileged configuration changes.',
  component: 'firewall',
  vendor: 'Fortinet',
  product: 'FortiGate',
  domain: 'network',
  category: 'configuration',
};

function responseBody() {
  return {
    ...input,
    source: 'custom' as const,
    createdBy: 'keycloak-subject-123',
  };
}

describe('RulesUseCaseAdministrationDataAccess', () => {
  it('sends only editable create fields through the typed API contract', async () => {
    let requestBody: unknown;
    const api = new RulesUseCaseAdministrationDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async (request) => {
        requestBody = await request.json();
        return new Response(JSON.stringify(responseBody()), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        });
      },
    });

    const result = await api.create(input);

    expect(requestBody).toEqual(input);
    expect(JSON.stringify(requestBody)).not.toContain('createdBy');
    expect(JSON.stringify(requestBody)).not.toContain('source');
    expect(result.createdBy).toBe('keycloak-subject-123');
  });

  it('surfaces conflict status without exposing response content', async () => {
    const api = new RulesUseCaseAdministrationDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async () =>
        new Response(JSON.stringify({ detail: 'internal conflict detail' }), {
          status: 409,
          headers: { 'content-type': 'application/json' },
        }),
    });

    const error = await api.create(input).catch((failure: unknown) => failure);

    expect(error).toBeInstanceOf(RulesFrontendApiError);
    expect(error).toMatchObject({
      operation: 'create Rules use case',
      status: 409,
    });
    expect(String(error)).not.toContain('internal conflict detail');
  });

  it('accepts a successful no-content delete', async () => {
    const api = new RulesUseCaseAdministrationDataAccess({
      baseUrl: 'https://api.mercure.test',
      fetch: async () => new Response(null, { status: 204 }),
    });

    await expect(api.delete('uc_admin_config')).resolves.toBeUndefined();
  });
});
