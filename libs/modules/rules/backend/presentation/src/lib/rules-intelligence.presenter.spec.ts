import { describe, expect, it } from 'vitest';

import {
  presentRoundtrip,
  presentSnapshotComparison,
} from './rules-intelligence.presenter';

describe('Rules intelligence public projection', () => {
  it('removes raw Rules XML and source-file contents from snapshot comparison output', () => {
    const result = {
      beforeSnapshotId: '00000000-0000-4000-8000-000000000001',
      afterSnapshotId: '00000000-0000-4000-8000-000000000002',
      diff: {
        summary: {
          rulesAdded: 1,
          rulesRemoved: 0,
          rulesChanged: 0,
          decodersAdded: 0,
          decodersRemoved: 0,
          decodersChanged: 0,
          filesAdded: 1,
          filesRemoved: 0,
          filesChanged: 0,
          useCasesAdded: 0,
          useCasesRemoved: 0,
          newIssues: 0,
          resolvedIssues: 0,
          jiraVisibilityChanged: 0,
          severityChanged: 0,
          mitreChanged: 0,
          useCaseChanged: 0,
        },
        rules: {
          added: [
            {
              key: 'tenant-a:100001',
              after: {
                id: '100001',
                level: 12,
                description: 'Public-safe description',
                groups: ['test'],
                status: 'production',
                role: 'detection',
                severity: 'high',
                jiraVisible: true,
                tenant: 'tenant-a',
                sourceFile: 'rules.xml',
                useCaseId: 'uc_test',
                useCaseConfidence: 'confirmed',
                mitre: ['T1003'],
                dependencies: [],
                fields: [],
                decodedAs: [],
                options: [],
                rawXml: '<rule secret="must-not-leak"/>',
              },
            },
          ],
          removed: [],
          changed: [],
        },
        decoders: { added: [], removed: [], changed: [] },
        files: {
          added: [
            {
              key: 'rules.xml',
              after: {
                name: 'rules.xml',
                tenant: 'tenant-a',
                size: 123,
                type: 'rules',
                content: '<secret>source</secret>',
                sha256: 'a'.repeat(64),
              },
            },
          ],
          removed: [],
          changed: [],
        },
        useCases: { added: [], removed: [] },
        issues: { added: [], resolved: [] },
      },
    } as const;

    const rules = presentSnapshotComparison(result, {
      beforeSnapshotId: result.beforeSnapshotId,
      afterSnapshotId: result.afterSnapshotId,
      kind: 'rules',
      offset: 0,
      limit: 50,
    });
    const files = presentSnapshotComparison(result, {
      beforeSnapshotId: result.beforeSnapshotId,
      afterSnapshotId: result.afterSnapshotId,
      kind: 'files',
      offset: 0,
      limit: 50,
    });

    expect(JSON.stringify(rules)).not.toContain('must-not-leak');
    expect(JSON.stringify(rules)).not.toContain('rawXml');
    expect(JSON.stringify(files)).not.toContain('<secret>');
    expect(JSON.stringify(files)).not.toContain('content');
  });

  it('removes XML snippets and generated patch material from round-trip output', () => {
    const result = {
      snapshotId: '00000000-0000-4000-8000-000000000001',
      analysis: {
        sourceSections: [],
        commentedRules: [
          {
            tenant: 'tenant-a',
            fileName: 'rules.xml',
            ruleId: '100001',
            snippet: '<rule>must-not-leak</rule>',
          },
        ],
        groupFlows: [],
        missingUseCaseSuggestions: [
          {
            tenant: 'tenant-a',
            ruleId: '100001',
            sourceFile: 'rules.xml',
            useCaseId: 'uc_test',
            confidence: 'inferred',
            insertLine: '<info>must-not-leak</info>',
            suggestedXml: '<rule>must-not-leak</rule>',
            placement: 'after description',
          },
        ],
        splitFiles: [
          {
            tenant: 'tenant-a',
            sourceSection: 'rules.xml',
            fileName: 'tenant-a__rules.xml',
            ruleCount: 1,
            xml: '<rule>must-not-leak</rule>',
          },
        ],
        summary: {
          sourceSections: 0,
          combinedFiles: 0,
          commentedRules: 1,
          idRangeWarnings: 0,
          orphanGroups: 0,
          missingGroupProducers: 0,
          missingUseCaseSuggestions: 1,
        },
      },
    } as const;

    const projected = presentRoundtrip(result, { offset: 0, limit: 50 });
    const serialized = JSON.stringify(projected);

    expect(serialized).not.toContain('must-not-leak');
    expect(serialized).not.toContain('snippet');
    expect(serialized).not.toContain('insertLine');
    expect(serialized).not.toContain('suggestedXml');
    expect(serialized).not.toContain('splitFiles');
  });
});
