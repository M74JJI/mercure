import { describe, expect, it } from 'vitest';

import {
  RulesUseCaseAdministrationParamsDto,
  RulesUseCaseCreateDto,
  RulesUseCaseUpdateDto,
} from './rules-use-case-administration.dto';

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

describe('Rules use-case administration DTOs', () => {
  it('accepts bounded canonical custom use-case input', () => {
    expect(
      RulesUseCaseCreateDto.create({
        id: 'uc_admin_config',
        ...editable,
      }),
    ).toEqual({
      id: 'uc_admin_config',
      ...editable,
    });
  });

  it('rejects server-owned identity and provenance fields', () => {
    expect(() =>
      RulesUseCaseCreateDto.create({
        id: 'uc_admin_config',
        ...editable,
        createdBy: 'spoofed-user',
      }),
    ).toThrow();

    expect(() =>
      RulesUseCaseUpdateDto.create({
        ...editable,
        source: 'system',
      }),
    ).toThrow();
  });

  it('rejects invalid IDs and oversized public fields', () => {
    expect(() =>
      RulesUseCaseAdministrationParamsDto.create({
        useCaseId: 'UC_ADMIN',
      }),
    ).toThrow();

    expect(() =>
      RulesUseCaseCreateDto.create({
        id: 'uc_admin_config',
        ...editable,
        description: 'x'.repeat(4_097),
      }),
    ).toThrow();
  });
});
