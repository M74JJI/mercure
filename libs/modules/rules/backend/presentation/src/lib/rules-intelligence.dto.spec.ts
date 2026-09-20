import { describe, expect, it } from 'vitest';

import {
  RulesFieldIntelligenceQueryDto,
  RulesGraphQueryDto,
  RulesSnapshotCompareQueryDto,
  RulesUseCaseParamsDto,
} from './rules-intelligence.dto';

describe('Rules intelligence API bounds', () => {
  it('applies conservative defaults to field intelligence paging', () => {
    expect(RulesFieldIntelligenceQueryDto.create({})).toMatchObject({
      offset: 0,
      limit: 50,
    });
  });

  it('rejects paginated requests above the public maximum', () => {
    expect(() => RulesFieldIntelligenceQueryDto.create({ limit: '101' })).toThrow();
    expect(() =>
      RulesSnapshotCompareQueryDto.create({
        beforeSnapshotId: '00000000-0000-4000-8000-000000000001',
        afterSnapshotId: '00000000-0000-4000-8000-000000000002',
        limit: '101',
      }),
    ).toThrow();
  });

  it('bounds semantic graph size to 500 entities', () => {
    expect(RulesGraphQueryDto.create({ limit: '500' })).toMatchObject({
      mode: 'all',
      limit: 500,
    });
    expect(() => RulesGraphQueryDto.create({ limit: '501' })).toThrow();
  });

  it('rejects non-canonical use-case identifiers', () => {
    expect(RulesUseCaseParamsDto.create({ useCaseId: 'uc_authentication' })).toEqual({
      useCaseId: 'uc_authentication',
    });
    expect(() => RulesUseCaseParamsDto.create({ useCaseId: '../etc/passwd' })).toThrow();
    expect(() => RulesUseCaseParamsDto.create({ useCaseId: 'UC_ADMIN' })).toThrow();
  });
});
