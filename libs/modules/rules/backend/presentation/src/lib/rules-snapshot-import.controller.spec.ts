import 'reflect-metadata';

import { describe, expect, it } from 'vitest';

import { REQUIRED_CAPABILITIES_METADATA } from '@mercure/platform-backend-identity-domain';

import { RulesSnapshotsController } from './rules-snapshots.controller';

describe('Rules snapshot import authorization metadata', () => {
  it('keeps snapshot reads at rules:read', () => {
    expect(Reflect.getMetadata(REQUIRED_CAPABILITIES_METADATA, RulesSnapshotsController)).toEqual([
      'rules:read',
    ]);
  });

  it('requires rules:import specifically for the import mutation', () => {
    expect(
      Reflect.getMetadata(
        REQUIRED_CAPABILITIES_METADATA,
        RulesSnapshotsController.prototype.importSnapshot,
      ),
    ).toEqual(['rules:import']);
  });
});
