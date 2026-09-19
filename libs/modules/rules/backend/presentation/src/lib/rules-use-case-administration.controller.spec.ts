import 'reflect-metadata';

import { ConflictException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import {
  REQUIRED_CAPABILITIES_METADATA,
  type MercurePrincipal,
} from '@mercure/platform-backend-identity-domain';
import {
  CreateCustomRulesUseCase,
  DeleteCustomRulesUseCase,
  RulesSystemUseCaseProtectedError,
  UpdateCustomRulesUseCase,
  type CreateCustomRulesUseCaseInput,
  type RulesUseCaseCatalog,
} from '@mercure/rules-backend-application';
import type { RulesUseCase } from '@mercure/rules-backend-domain';

import { RulesUseCaseAdministrationController } from './rules-use-case-administration.controller';

const principal: MercurePrincipal = {
  subject: 'keycloak-subject-123',
  username: 'security-admin',
  roles: ['admin', 'user'],
  capabilities: ['platform:read', 'rules:read', 'rules:import', 'rules:admin'],
  authorities: ['admin'],
};

const editable = {
  name: 'Administrator configuration change',
  shortName: 'Admin config',
  description: 'Tracks privileged configuration changes.',
  component: 'firewall',
  vendor: 'Fortinet',
  product: 'FortiGate',
  domain: 'network',
  category: 'configuration',
};

function customUseCase(input: CreateCustomRulesUseCaseInput): RulesUseCase {
  return {
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
  };
}

describe('RulesUseCaseAdministrationController', () => {
  it('requires rules:admin at the controller boundary', () => {
    expect(
      Reflect.getMetadata(REQUIRED_CAPABILITIES_METADATA, RulesUseCaseAdministrationController),
    ).toEqual(['rules:admin']);
  });

  it('derives creator attribution from the authenticated principal subject', async () => {
    let captured: CreateCustomRulesUseCaseInput | undefined;
    const catalog: RulesUseCaseCatalog = {
      list: async () => [],
      get: async () => null,
      createCustom: async (input) => {
        captured = input;
        return customUseCase(input);
      },
      updateCustom: async (input) => ({
        id: input.id,
        ...editable,
        source: 'custom',
        createdBy: principal.subject,
      }),
      deleteCustom: async () => undefined,
    };
    const controller = new RulesUseCaseAdministrationController(
      new CreateCustomRulesUseCase(catalog),
      new UpdateCustomRulesUseCase(catalog),
      new DeleteCustomRulesUseCase(catalog),
    );

    const result = await controller.create(
      { mercurePrincipal: principal },
      {
        id: 'uc_admin_config',
        ...editable,
      },
    );

    expect(captured?.createdBy).toBe(principal.subject);
    expect(result.createdBy).toBe(principal.subject);
  });

  it('maps protected system-entry mutation to a conflict', async () => {
    const catalog: RulesUseCaseCatalog = {
      list: async () => [],
      get: async () => null,
      createCustom: async (input) => customUseCase(input),
      updateCustom: async (input) => {
        throw new RulesSystemUseCaseProtectedError(input.id);
      },
      deleteCustom: async () => undefined,
    };
    const controller = new RulesUseCaseAdministrationController(
      new CreateCustomRulesUseCase(catalog),
      new UpdateCustomRulesUseCase(catalog),
      new DeleteCustomRulesUseCase(catalog),
    );

    await expect(
      controller.update(
        { mercurePrincipal: principal },
        { useCaseId: 'uc_system' },
        editable,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
