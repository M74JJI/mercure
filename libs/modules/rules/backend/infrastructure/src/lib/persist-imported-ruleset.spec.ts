import { describe, expect, it } from 'vitest';

import {
  AnalyzeRuleset,
  ImportArchivedRuleset,
  PersistImportedRuleset,
  RulesetImportInProgressError,
  type RulesetArchiveSource,
  type RulesetSnapshotStore,
} from '@mercure/rules-backend-application';
import type { RulesUseCase } from '@mercure/rules-backend-domain';

import { WazuhXmlRulesetAnalyzer } from './wazuh-xml-ruleset-analyzer';

function useCase(name: string): RulesUseCase {
  return {
    id: 'uc_request',
    name,
    shortName: name,
    description: `${name} catalog entry`,
    component: 'rules',
    vendor: 'Mercure',
    product: 'Rules',
    domain: 'detection',
    category: 'test',
    source: 'custom',
    createdBy: 'test',
  };
}

describe('PersistImportedRuleset', () => {
  it('rejects concurrent imports and accepts a later observation after the active import completes', async () => {
    let readCount = 0;
    let persistedCount = 0;
    let releaseFirstRead: (() => void) | undefined;
    const firstReadGate = new Promise<void>((resolve) => {
      releaseFirstRead = resolve;
    });

    const source: RulesetArchiveSource = {
      async readSnapshot() {
        readCount += 1;
        if (readCount === 1) {
          await firstReadGate;
        }

        return {
          sourceRoot: '/tmp/rules',
          configured: true,
          archives: [],
          files: [
            {
              name: 'manager-a/rules/1000-request_rules.xml',
              content: [
                '<group name="production,">',
                '  <rule id="100001" level="5">',
                '    <description>Request-specific catalog analysis</description>',
                '    <info type="text">use_case:uc_request</info>',
                '  </rule>',
                '</group>',
              ].join('\n'),
            },
          ],
          fingerprint: 'a'.repeat(64),
          loadedAt: '2026-09-20T23:30:00.000Z',
          errors: [],
        };
      },
    };

    const store: RulesetSnapshotStore = {
      async persist(imported) {
        persistedCount += 1;
        return {
          id: `snapshot-${persistedCount}`,
          sourceFingerprint: imported.source.fingerprint,
          contentFingerprint: String(persistedCount).padStart(64, '0'),
          complete: true,
          sourceErrorCount: 0,
          loadedAt: imported.source.loadedAt,
          createdAt: `2026-09-20T23:30:0${persistedCount}.000Z`,
        };
      },
    };

    const importer = new ImportArchivedRuleset(
      source,
      new AnalyzeRuleset(new WazuhXmlRulesetAnalyzer()),
    );
    const persist = new PersistImportedRuleset(importer, store);

    const first = persist.execute({ useCases: [useCase('First')] });

    await expect(persist.execute({ useCases: [useCase('Rejected')] })).rejects.toBeInstanceOf(
      RulesetImportInProgressError,
    );

    releaseFirstRead?.();
    const firstResult = await first;
    const laterResult = await persist.execute({ useCases: [useCase('Later')] });

    expect(readCount).toBe(2);
    expect(persistedCount).toBe(2);
    expect(firstResult.snapshot.id).not.toBe(laterResult.snapshot.id);
    expect(firstResult.analysis.useCases[0]?.name).toBe('First');
    expect(laterResult.analysis.useCases[0]?.name).toBe('Later');
  });
});
