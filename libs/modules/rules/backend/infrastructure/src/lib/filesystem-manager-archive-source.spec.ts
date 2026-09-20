import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

import { AnalyzeRuleset, ImportArchivedRuleset } from '@mercure/rules-backend-application';

import { FilesystemManagerArchiveSource } from './filesystem-manager-archive-source';
import { WazuhXmlRulesetAnalyzer } from './wazuh-xml-ruleset-analyzer';

const execFileAsync = promisify(execFile);

async function withTempDirectory<T>(run: (root: string) => Promise<T>): Promise<T> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mercure-rules-archive-'));

  try {
    return await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function createArchive(archivePath: string, sourceRoot: string): Promise<void> {
  await execFileAsync('tar', ['-czf', archivePath, '-C', sourceRoot, '.']);
}

describe('FilesystemManagerArchiveSource', () => {
  it('discovers manager archives and imports accepted rules and decoder XML', async () => {
    await withTempDirectory(async (root) => {
      const archiveRoot = path.join(root, 'archives');
      const sourceRoot = path.join(root, 'source');
      await mkdir(path.join(archiveRoot), { recursive: true });
      await mkdir(path.join(sourceRoot, 'rules'), { recursive: true });
      await mkdir(path.join(sourceRoot, 'decoders'), { recursive: true });
      await mkdir(path.join(sourceRoot, 'other'), { recursive: true });

      await writeFile(
        path.join(sourceRoot, 'rules', '1000-test_rules.xml'),
        [
          '<group name="archive,">',
          '  <rule id="210001" level="11">',
          '    <description>Archive rule</description>',
          '    <group>production,</group>',
          '  </rule>',
          '</group>',
        ].join('\n'),
      );
      await writeFile(
        path.join(sourceRoot, 'decoders', '1000-test_decoders.xml'),
        ['<decoder name="archive_decoder">', '  <prematch>archive</prematch>', '</decoder>'].join(
          '\n',
        ),
      );
      await writeFile(path.join(sourceRoot, 'other', 'ignore.txt'), 'ignored');

      const archivePath = path.join(archiveRoot, 'manager-a.tar.gz');
      await createArchive(archivePath, sourceRoot);

      const source = new FilesystemManagerArchiveSource({
        rootPath: archiveRoot,
        maxFiles: 10,
        maxEntryBytes: 1024 * 1024,
        maxTotalBytes: 2 * 1024 * 1024,
      });

      const snapshot = await source.readSnapshot();

      expect(snapshot.configured).toBe(true);
      expect(snapshot.sourceRoot).toBe(archiveRoot);
      expect(snapshot.archives).toEqual([
        expect.objectContaining({
          name: 'manager-a.tar.gz',
          xmlFiles: 2,
        }),
      ]);
      expect(snapshot.files.map((file) => file.name)).toEqual([
        'manager-a.tar.gz/decoders/1000-test_decoders.xml',
        'manager-a.tar.gz/rules/1000-test_rules.xml',
      ]);
      expect(snapshot.errors).toEqual([]);
      expect(snapshot.fingerprint).toMatch(/^[a-f0-9]{64}$/);

      const importer = new ImportArchivedRuleset(
        source,
        new AnalyzeRuleset(new WazuhXmlRulesetAnalyzer()),
      );
      const imported = await importer.execute();

      expect(imported.analysis.rules).toHaveLength(1);
      expect(imported.analysis.decoders).toHaveLength(1);
      expect(imported.analysis.rules[0]).toMatchObject({
        id: '210001',
        tenant: 'manager-a',
        sourceFile: 'manager-a.tar.gz/rules/1000-test_rules.xml',
      });
      expect(imported.source.archives).toHaveLength(1);
      expect('files' in imported.source).toBe(false);
    });
  });

  it('does not extract archive members outside accepted rules and decoder XML paths', async () => {
    await withTempDirectory(async (root) => {
      const archiveRoot = path.join(root, 'archives');
      const sourceRoot = path.join(root, 'source');
      await mkdir(archiveRoot, { recursive: true });
      await mkdir(path.join(sourceRoot, 'rules', 'nested'), { recursive: true });
      await mkdir(path.join(sourceRoot, 'misc'), { recursive: true });

      await writeFile(
        path.join(sourceRoot, 'rules', 'accepted.xml'),
        '<rule id="220001" level="1"><description>Accepted</description></rule>',
      );
      await writeFile(
        path.join(sourceRoot, 'rules', 'nested', 'rejected.xml'),
        '<rule id="220002" level="1"><description>Nested</description></rule>',
      );
      await writeFile(
        path.join(sourceRoot, 'misc', 'rejected.xml'),
        '<rule id="220003" level="1"><description>Misc</description></rule>',
      );

      await createArchive(path.join(archiveRoot, 'manager-b.tgz'), sourceRoot);

      const source = new FilesystemManagerArchiveSource({
        rootPath: archiveRoot,
        maxFiles: 10,
        maxEntryBytes: 1024 * 1024,
        maxTotalBytes: 2 * 1024 * 1024,
      });

      const snapshot = await source.readSnapshot();

      expect(snapshot.files).toHaveLength(1);
      expect(snapshot.files[0]?.name).toBe('manager-b.tgz/rules/accepted.xml');
      expect(snapshot.errors).toEqual([]);
    });
  });


  it('streams manager archives without requiring the system tar executable at runtime', async () => {
    await withTempDirectory(async (root) => {
      const archiveRoot = path.join(root, 'archives');
      const sourceRoot = path.join(root, 'source');
      await mkdir(archiveRoot, { recursive: true });
      await mkdir(path.join(sourceRoot, 'rules'), { recursive: true });

      await writeFile(
        path.join(sourceRoot, 'rules', 'streamed.xml'),
        '<rule id="225001" level="1"><description>Streamed archive rule</description></rule>',
      );
      await createArchive(path.join(archiveRoot, 'manager-streamed.tar.gz'), sourceRoot);

      const source = new FilesystemManagerArchiveSource({
        rootPath: archiveRoot,
        maxFiles: 10,
        maxEntryBytes: 1024 * 1024,
        maxTotalBytes: 2 * 1024 * 1024,
      });
      const previousPath = process.env.PATH;

      try {
        process.env.PATH = '';
        const snapshot = await source.readSnapshot();

        expect(snapshot.files.map((file) => file.name)).toEqual([
          'manager-streamed.tar.gz/rules/streamed.xml',
        ]);
        expect(snapshot.errors).toEqual([]);
      } finally {
        if (previousPath === undefined) {
          delete process.env.PATH;
        } else {
          process.env.PATH = previousPath;
        }
      }
    });
  });

  it('enforces the total XML byte limit across streamed archive members', async () => {
    await withTempDirectory(async (root) => {
      const archiveRoot = path.join(root, 'archives');
      const sourceRoot = path.join(root, 'source');
      await mkdir(archiveRoot, { recursive: true });
      await mkdir(path.join(sourceRoot, 'rules'), { recursive: true });

      await writeFile(
        path.join(sourceRoot, 'rules', 'first.xml'),
        `<rule id="226001" level="1"><description>${'a'.repeat(600)}</description></rule>`,
      );
      await writeFile(
        path.join(sourceRoot, 'rules', 'second.xml'),
        `<rule id="226002" level="1"><description>${'b'.repeat(600)}</description></rule>`,
      );
      await createArchive(path.join(archiveRoot, 'manager-total.tar.gz'), sourceRoot);

      const source = new FilesystemManagerArchiveSource({
        rootPath: archiveRoot,
        maxFiles: 10,
        maxEntryBytes: 1024,
        maxTotalBytes: 900,
      });

      const snapshot = await source.readSnapshot();

      expect(snapshot.files).toHaveLength(1);
      expect(snapshot.errors).toHaveLength(1);
      expect(snapshot.errors[0]).toContain('900-byte XML limit');
    });
  });

  it('enforces per-entry and total XML byte limits without extracting to disk', async () => {
    await withTempDirectory(async (root) => {
      const archiveRoot = path.join(root, 'archives');
      const sourceRoot = path.join(root, 'source');
      await mkdir(archiveRoot, { recursive: true });
      await mkdir(path.join(sourceRoot, 'rules'), { recursive: true });

      await writeFile(
        path.join(sourceRoot, 'rules', 'large.xml'),
        `<rule id="230001" level="1"><description>${'x'.repeat(4096)}</description></rule>`,
      );
      await createArchive(path.join(archiveRoot, 'manager-c.tar.gz'), sourceRoot);

      const source = new FilesystemManagerArchiveSource({
        rootPath: archiveRoot,
        maxFiles: 10,
        maxEntryBytes: 1024,
        maxTotalBytes: 2048,
      });

      const snapshot = await source.readSnapshot();

      expect(snapshot.files).toEqual([]);
      expect(snapshot.errors).toHaveLength(1);
      expect(snapshot.errors[0]).toContain('1024-byte limit');
    });
  });

  it('returns a non-fatal empty snapshot when the configured root is unavailable', async () => {
    await withTempDirectory(async (root) => {
      const missingRoot = path.join(root, 'missing');
      const source = new FilesystemManagerArchiveSource({
        rootPath: missingRoot,
        maxFiles: 10,
        maxEntryBytes: 1024 * 1024,
        maxTotalBytes: 2 * 1024 * 1024,
      });

      const snapshot = await source.readSnapshot();

      expect(snapshot).toMatchObject({
        sourceRoot: missingRoot,
        configured: true,
        archives: [],
        files: [],
        fingerprint: '',
      });
      expect(snapshot.errors).toHaveLength(1);
    });
  });
});
