import 'reflect-metadata';

import { ConflictException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import {
  REQUIRED_CAPABILITIES_METADATA,
  type MercurePrincipal,
} from '@mercure/platform-backend-identity-domain';
import {
  PersistImportedRuleset,
  QueryRulesetSnapshots,
  RulesetImportInProgressError,
} from '@mercure/rules-backend-application';

import { RulesSnapshotsController } from './rules-snapshots.controller';

describe('Rules snapshot import authorization metadata', () => {
  it('keeps snapshot reads at rules:read', () => {
    expect(Reflect.getMetadata(REQUIRED_CAPABILITIES_METADATA, RulesSnapshotsController)).toEqual([
      'rules:read',
    ]);
  });

  it('maps an active import to HTTP 409 without queueing another import', async () => {
    const principal: MercurePrincipal = {
      subject: 'admin-subject',
      username: 'security-admin',
      roles: ['admin', 'user'],
      capabilities: ['platform:read', 'rules:read', 'rules:import', 'rules:admin'],
      authorities: ['mercure-admin'],
    };
    const persistImportedRuleset = {
      execute: () => Promise.reject(new RulesetImportInProgressError()),
    } as unknown as PersistImportedRuleset;
    const queries = {} as QueryRulesetSnapshots;
    const controller = new RulesSnapshotsController(persistImportedRuleset, queries);

    await expect(
      controller.importSnapshot({ mercurePrincipal: principal }),
    ).rejects.toBeInstanceOf(ConflictException);
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
