import 'reflect-metadata';

import { describe, expect, it } from 'vitest';

import { REQUIRED_CAPABILITIES_METADATA } from '@mercure/platform-backend-identity-domain';

import {
  RulesIntelligenceController,
  RulesUseCasesController,
} from './rules-intelligence.controller';

describe('Rules intelligence authorization contract', () => {
  it.each([RulesIntelligenceController, RulesUseCasesController])(
    'requires rules:read for %s',
    (controller) => {
      expect(Reflect.getMetadata(REQUIRED_CAPABILITIES_METADATA, controller)).toEqual([
        'rules:read',
      ]);
    },
  );
});
