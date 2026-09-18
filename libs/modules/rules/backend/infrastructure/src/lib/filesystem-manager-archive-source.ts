import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import type {
  RulesetArchiveInfo,
  RulesetArchiveSnapshot,
  RulesetArchiveSource,
  RulesetSourceInput,
} from '@mercure/rules-backend-application';

const ARCHIVE_EXTENSIONS = ['.tar.gz', '.tgz'] as const;
const XML_SOURCE_PATTERN = /(^|\/)(rules|decoders)\/[^/]+\.xml$/i;
const TAR_LIST_OUTPUT_LIMIT_BYTES = 16 * 1024 * 1024;

interface ManagerArchiveSourceOptions {
  readonly rootPath: string;
  readonly maxFiles: number;
  readonly maxEntryBytes: number;
  readonly maxTotalBytes: number;
}

interface ArchiveXmlEntry {
  readonly archiveMember: string;
  readonly sourcePath: string;
}

interface ArchiveWorkItem extends RulesetArchiveInfo {
  readonly path: string;
  readonly entries: readonly ArchiveXmlEntry[];
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function normalizeArchiveEntry(entry: string): string | null {
  const normalized = entry.replaceAll('\\', '/').replace(/^(\.\/)+/, '').trim();

  if (
    !normalized ||
    normalized.startsWith('/') ||
    /^[a-z]:\//i.test(normalized) ||
    normalized.includes('\0')
  ) {
    return null;
  }

  const segments = normalized.split('/');
  if (segments.some((segment) => segment === '..')) {
    return null;
  }

  return XML_SOURCE_PATTERN.test(normalized) ? normalized : null;
}

function runTar(args: readonly string[], maxStdoutBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn('tar', [...args], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let stdoutBytes = 0;
    let settled = false;

    const fail = (error: Error): void => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      reject(error);
    };

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > maxStdoutBytes) {
        fail(new Error(`tar output exceeded the configured ${maxStdoutBytes}-byte limit`));
        return;
      }
      stdout.push(chunk);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      if (stderr.reduce((total, item) => total + item.length, 0) < 64 * 1024) {
        stderr.push(chunk);
      }
    });

    child.on('error', (error) => fail(error));
    child.on('close', (code) => {
      if (settled) return;
      settled = true;

      if (code === 0) {
        resolve(Buffer.concat(stdout));
        return;
      }

      const detail = Buffer.concat(stderr).toString('utf8').trim();
      reject(new Error(detail || `tar exited with code ${String(code)}`));
    });
  });
}

async function listXmlEntries(
  archivePath: string,
  maxFiles: number,
): Promise<readonly ArchiveXmlEntry[]> {
  const output = await runTar(['-tzf', archivePath], TAR_LIST_OUTPUT_LIMIT_BYTES);
  const seen = new Set<string>();
  const entries: ArchiveXmlEntry[] = [];

  for (const rawEntry of output.toString('utf8').split(/\r?\n/)) {
    const archiveMember = rawEntry.trim();
    if (!archiveMember) continue;

    const sourcePath = normalizeArchiveEntry(archiveMember);
    if (!sourcePath) continue;
    if (seen.has(sourcePath)) {
      throw new Error(`duplicate archive member is not allowed: ${sourcePath}`);
    }

    seen.add(sourcePath);
    entries.push({ archiveMember, sourcePath });

    if (entries.length > maxFiles) {
      throw new Error(`archive contains more than the configured ${maxFiles} XML-file limit`);
    }
  }

  entries.sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));
  return entries;
}

async function readArchiveEntry(
  archivePath: string,
  entry: string,
  maxEntryBytes: number,
): Promise<string> {
  const output = await runTar(['-xOzf', archivePath, '--', entry], maxEntryBytes);
  return output.toString('utf8');
}

function buildFingerprint(archives: readonly RulesetArchiveInfo[]): string {
  return createHash('sha256')
    .update(
      JSON.stringify(
        archives.map((archive) => [
          archive.name,
          archive.size,
          archive.modifiedAt,
          archive.xmlFiles,
        ]),
      ),
    )
    .digest('hex');
}

function isArchiveName(name: string): boolean {
  const lower = name.toLowerCase();
  return ARCHIVE_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

export class FilesystemManagerArchiveSource implements RulesetArchiveSource {
  constructor(private readonly options: ManagerArchiveSourceOptions) {}

  async readSnapshot(): Promise<RulesetArchiveSnapshot> {
    const loadedAt = new Date().toISOString();
    const archives: RulesetArchiveInfo[] = [];
    const workItems: ArchiveWorkItem[] = [];
    const files: RulesetSourceInput[] = [];
    const errors: string[] = [];

    try {
      const root = await stat(this.options.rootPath);
      if (!root.isDirectory()) {
        return this.emptySnapshot(loadedAt, [`${this.options.rootPath} is not a directory.`]);
      }
    } catch (error) {
      return this.emptySnapshot(loadedAt, [
        errorMessage(error, `Cannot read ${this.options.rootPath}.`),
      ]);
    }

    let directoryEntries;
    try {
      directoryEntries = await readdir(this.options.rootPath, { withFileTypes: true });
    } catch (error) {
      return this.emptySnapshot(loadedAt, [
        errorMessage(error, `Cannot list ${this.options.rootPath}.`),
      ]);
    }

    const archiveNames = directoryEntries
      .filter((entry) => entry.isFile() && isArchiveName(entry.name))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));

    let totalXmlFiles = 0;

    for (const archiveName of archiveNames) {
      const archivePath = path.join(this.options.rootPath, archiveName);

      try {
        const archiveStat = await stat(archivePath);
        const entries = await listXmlEntries(archivePath, this.options.maxFiles - totalXmlFiles);

        totalXmlFiles += entries.length;
        if (totalXmlFiles > this.options.maxFiles) {
          throw new Error(
            `snapshot contains more than the configured ${this.options.maxFiles} XML-file limit`,
          );
        }

        const archive: RulesetArchiveInfo = {
          name: archiveName,
          size: archiveStat.size,
          modifiedAt: archiveStat.mtime.toISOString(),
          xmlFiles: entries.length,
        };

        archives.push(archive);
        workItems.push({
          ...archive,
          path: archivePath,
          entries,
        });
      } catch (error) {
        errors.push(`${archiveName}: ${errorMessage(error, 'failed to inspect archive')}`);
      }
    }

    let totalBytes = 0;

    for (const archive of workItems) {
      for (const entry of archive.entries) {
        if (files.length >= this.options.maxFiles) {
          errors.push(
            `snapshot XML-file limit of ${this.options.maxFiles} reached before all archives were read`,
          );
          break;
        }

        try {
          const content = await readArchiveEntry(
            archive.path,
            entry.archiveMember,
            this.options.maxEntryBytes,
          );
          const size = Buffer.byteLength(content, 'utf8');

          if (size > this.options.maxEntryBytes) {
            throw new Error(
              `XML member exceeds the configured ${this.options.maxEntryBytes}-byte limit`,
            );
          }

          if (totalBytes + size > this.options.maxTotalBytes) {
            throw new Error(
              `snapshot exceeds the configured ${this.options.maxTotalBytes}-byte XML limit`,
            );
          }

          totalBytes += size;
          files.push({
            name: `${archive.name}/${entry.sourcePath}`,
            content,
            size,
          });
        } catch (error) {
          errors.push(
            `${archive.name}/${entry.sourcePath}: ${errorMessage(error, 'failed to read archive member')}`,
          );
        }
      }
    }

    return {
      sourceRoot: this.options.rootPath,
      configured: true,
      archives,
      files,
      fingerprint: buildFingerprint(archives),
      loadedAt,
      errors,
    };
  }

  private emptySnapshot(loadedAt: string, errors: readonly string[]): RulesetArchiveSnapshot {
    return {
      sourceRoot: this.options.rootPath,
      configured: true,
      archives: [],
      files: [],
      fingerprint: '',
      loadedAt,
      errors,
    };
  }
}

export type { ManagerArchiveSourceOptions };
