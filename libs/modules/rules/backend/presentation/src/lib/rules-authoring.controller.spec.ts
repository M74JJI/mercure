import 'reflect-metadata';

import { describe, expect, it } from 'vitest';

import { REQUIRED_CAPABILITIES_METADATA } from '@mercure/platform-backend-identity-domain';

import { RulesAuthoringController } from './rules-authoring.controller';

describe('RulesAuthoringController authorization metadata', () => {
  it('requires rules:admin at the controller boundary', () => {
    expect(
      Reflect.getMetadata(REQUIRED_CAPABILITIES_METADATA, RulesAuthoringController),
    ).toEqual(['rules:admin']);
  });
});
