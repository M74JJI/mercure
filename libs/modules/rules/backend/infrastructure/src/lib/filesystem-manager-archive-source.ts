import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { Transform } from 'node:stream';
import { createGunzip } from 'node:zlib';

import { extract, type ExtractEvents } from 'tar-stream';

import type {
  RulesetArchiveInfo,
  RulesetArchiveSnapshot,
  RulesetArchiveSource,
  RulesetSourceInput,
} from '@mercure/rules-backend-application';

const ARCHIVE_EXTENSIONS = ['.tar.gz', '.tgz'] as const;
const XML_SOURCE_PATTERN = /(^|\/)(rules|decoders)\/[^/]+\.xml$/i;
const ARCHIVE_READ_TIMEOUT_MS = 30_000;

interface ManagerArchiveSourceOptions {
  readonly rootPath: string;
  readonly maxArchives: number;
  readonly maxCompressedBytes: number;
  readonly maxDecompressedBytes: number;
  readonly maxFiles: number;
  readonly maxEntryBytes: number;
  readonly maxTotalBytes: number;
}

interface ArchiveReadLimits {
  readonly maxFiles: number;
  readonly maxDecompressedBytes: number;
  readonly remainingFiles: number;
  readonly maxEntryBytes: number;
  readonly maxTotalBytes: number;
  readonly remainingTotalBytes: number;
}

interface ArchiveReadBudget {
  remainingDecompressedBytes: number;
}

interface ArchiveReadFile {
  readonly sourcePath: string;
  readonly content: string;
  readonly size: number;
}

interface ArchiveReadResult {
  readonly xmlFiles: number;
  readonly files: readonly ArchiveReadFile[];
  readonly totalBytes: number;
  readonly decompressedBytes: number;
  readonly errors: readonly string[];
}

type ArchiveEntryStream = ExtractEvents['entry'][1];

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function normalizeArchiveEntry(entry: string): string | null {
  const normalized = entry
    .replaceAll('\\', '/')
    .replace(/^(\.\/)+/, '')
    .trim();

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

function consumeDecompressedBytes(
  budget: ArchiveReadBudget,
  bytes: number,
  maxDecompressedBytes: number,
): void {
  if (bytes > budget.remainingDecompressedBytes) {
    budget.remainingDecompressedBytes = 0;
    throw new Error(
      `archive decompressed data exceeds the configured ${maxDecompressedBytes}-byte limit`,
    );
  }

  budget.remainingDecompressedBytes -= bytes;
}

async function drainArchiveEntry(
  stream: ArchiveEntryStream,
  expectedBytes: number,
): Promise<number> {
  let bytes = 0;

  for await (const chunk of stream) {
    if (!Buffer.isBuffer(chunk) && !(chunk instanceof Uint8Array)) {
      throw new Error('archive member emitted an unsupported stream chunk');
    }

    bytes += chunk.length;
    if (bytes > expectedBytes) {
      throw new Error(`archive member exceeded its declared ${expectedBytes}-byte size`);
    }
  }

  if (bytes !== expectedBytes) {
    throw new Error(
      `archive member size mismatch: expected ${expectedBytes} bytes but read ${bytes}`,
    );
  }

  return bytes;
}

async function readArchiveEntry(
  stream: ArchiveEntryStream,
  expectedBytes: number,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let bytes = 0;

  for await (const chunk of stream) {
    if (!Buffer.isBuffer(chunk) && !(chunk instanceof Uint8Array)) {
      throw new Error('archive member emitted an unsupported stream chunk');
    }

    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;

    if (bytes > expectedBytes) {
      throw new Error(`archive member exceeded its declared ${expectedBytes}-byte size`);
    }

    chunks.push(buffer);
  }

  if (bytes !== expectedBytes) {
    throw new Error(
      `archive member size mismatch: expected ${expectedBytes} bytes but read ${bytes}`,
    );
  }

  return Buffer.concat(chunks, bytes);
}

function isRegularArchiveFile(type: string): boolean {
  return type === 'file' || type === 'contiguous-file';
}

function readArchiveXml(
  archivePath: string,
  limits: ArchiveReadLimits,
  budget: ArchiveReadBudget,
): Promise<ArchiveReadResult> {
  return new Promise((resolve, reject) => {
    const input = createReadStream(archivePath);
    const gunzip = createGunzip();
    const extractor = extract();
    const seen = new Set<string>();
    const files: ArchiveReadFile[] = [];
    const errors: string[] = [];
    let xmlFiles = 0;
    let totalBytes = 0;
    let decompressedBytes = 0;
    let settled = false;
    const decompressionMeter = new Transform({
      transform(chunk, _encoding, callback) {
        try {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          consumeDecompressedBytes(budget, buffer.length, limits.maxDecompressedBytes);
          decompressedBytes += buffer.length;
          callback(null, buffer);
        } catch (error) {
          callback(error instanceof Error ? error : new Error('failed to meter decompressed archive data'));
        }
      },
    });

    const timeout = setTimeout(() => {
      fail(new Error(`archive read exceeded the configured ${ARCHIVE_READ_TIMEOUT_MS}-ms timeout`));
    }, ARCHIVE_READ_TIMEOUT_MS);
    timeout.unref();

    const fail = (error: Error): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      input.destroy();
      gunzip.destroy();
      decompressionMeter.destroy();
      extractor.destroy(error);
      reject(error);
    };

    extractor.on('entry', (header, stream, next) => {
      void (async () => {
        const drain = async (): Promise<void> => {
          await drainArchiveEntry(stream, header.size);
          next();
        };

        const sourcePath = normalizeArchiveEntry(header.name);
        if (!sourcePath) {
          await drain();
          return;
        }

        xmlFiles += 1;
        if (xmlFiles > limits.remainingFiles) {
          throw new Error(
            `snapshot contains more than the configured ${limits.maxFiles} XML-file limit`,
          );
        }

        if (seen.has(sourcePath)) {
          throw new Error(`duplicate archive member is not allowed: ${sourcePath}`);
        }
        seen.add(sourcePath);

        if (!isRegularArchiveFile(header.type)) {
          errors.push(`${sourcePath}: archive member is not a regular file`);
          await drain();
          return;
        }

        if (header.size > limits.maxEntryBytes) {
          errors.push(
            `${sourcePath}: XML member exceeds the configured ${limits.maxEntryBytes}-byte limit`,
          );
          await drain();
          return;
        }

        if (totalBytes + header.size > limits.remainingTotalBytes) {
          errors.push(
            `${sourcePath}: snapshot exceeds the configured ${limits.maxTotalBytes}-byte XML limit`,
          );
          await drain();
          return;
        }

        const content = await readArchiveEntry(stream, header.size);
        totalBytes += content.length;
        files.push({
          sourcePath,
          content: content.toString('utf8'),
          size: content.length,
        });
        next();
      })().catch((error: unknown) => {
        next(error instanceof Error ? error : new Error('failed to read archive member'));
      });
    });

    input.on('error', fail);
    gunzip.on('error', fail);
    decompressionMeter.on('error', fail);
    extractor.on('error', fail);
    extractor.on('finish', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      files.sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));
      resolve({
        xmlFiles,
        files,
        totalBytes,
        decompressedBytes,
        errors,
      });
    });

    input.pipe(gunzip).pipe(decompressionMeter).pipe(extractor);
  });
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

    if (archiveNames.length > this.options.maxArchives) {
      return this.emptySnapshot(loadedAt, [
        `Rules source contains ${archiveNames.length} archives, above the configured ${this.options.maxArchives}-archive limit.`,
      ]);
    }

    let totalCompressedBytes = 0;
    const decompressionBudget: ArchiveReadBudget = {
      remainingDecompressedBytes: this.options.maxDecompressedBytes,
    };
    let totalXmlFiles = 0;
    let totalBytes = 0;

    for (const archiveName of archiveNames) {
      const archivePath = path.join(this.options.rootPath, archiveName);

      try {
        const archiveStat = await stat(archivePath);
        totalCompressedBytes += archiveStat.size;
        if (totalCompressedBytes > this.options.maxCompressedBytes) {
          return this.emptySnapshot(loadedAt, [
            `Rules archives exceed the configured ${this.options.maxCompressedBytes}-byte compressed-input limit.`,
          ]);
        }

        const result = await readArchiveXml(
          archivePath,
          {
            maxFiles: this.options.maxFiles,
            maxDecompressedBytes: this.options.maxDecompressedBytes,
            remainingFiles: this.options.maxFiles - totalXmlFiles,
            maxEntryBytes: this.options.maxEntryBytes,
            maxTotalBytes: this.options.maxTotalBytes,
            remainingTotalBytes: this.options.maxTotalBytes - totalBytes,
          },
          decompressionBudget,
        );

        totalXmlFiles += result.xmlFiles;
        totalBytes += result.totalBytes;

        const archive: RulesetArchiveInfo = {
          name: archiveName,
          size: archiveStat.size,
          modifiedAt: archiveStat.mtime.toISOString(),
          xmlFiles: result.xmlFiles,
        };

        archives.push(archive);
        files.push(
          ...result.files.map((file) => ({
            name: `${archive.name}/${file.sourcePath}`,
            content: file.content,
            size: file.size,
          })),
        );
        errors.push(...result.errors.map((error) => `${archive.name}/${error}`));
      } catch (error) {
        errors.push(`${archiveName}: ${errorMessage(error, 'failed to inspect archive')}`);
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
