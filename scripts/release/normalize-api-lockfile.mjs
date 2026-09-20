import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DOCUMENT_START = '---\n';
const DOCUMENT_SEPARATOR = '\n---\n';
const workspaceRoot = process.cwd();
const rootLockfilePath = path.join(workspaceRoot, 'pnpm-lock.yaml');
const apiRoot = path.join(workspaceRoot, 'dist/apps/api');
const apiPackagePath = path.join(apiRoot, 'package.json');
const apiLockfilePath = path.join(apiRoot, 'pnpm-lock.yaml');

function normalizeNewlines(content) {
  return content.replaceAll('\r\n', '\n');
}

function splitTwoDocumentLockfile(content) {
  const normalized = normalizeNewlines(content);
  if (!normalized.startsWith(DOCUMENT_START)) return null;

  const separatorIndex = normalized.indexOf(DOCUMENT_SEPARATOR, DOCUMENT_START.length);
  if (separatorIndex === -1) return null;

  return {
    environment: normalized.slice(DOCUMENT_START.length, separatorIndex),
    main: normalized.slice(separatorIndex + DOCUMENT_SEPARATOR.length),
  };
}

const apiPackage = JSON.parse(await readFile(apiPackagePath, 'utf8'));
if (typeof apiPackage.packageManager !== 'string' || !apiPackage.packageManager.startsWith('pnpm@')) {
  process.stdout.write('API artifact does not declare a pnpm packageManager pin; no lockfile normalization required.\n');
  process.exit(0);
}

const rootLockfile = normalizeNewlines(await readFile(rootLockfilePath, 'utf8'));
const rootDocuments = splitTwoDocumentLockfile(rootLockfile);
if (!rootDocuments?.environment.includes('packageManagerDependencies:')) {
  throw new Error('Root pnpm lockfile is missing the package-manager dependency document.');
}

const apiLockfile = normalizeNewlines(await readFile(apiLockfilePath, 'utf8'));
const apiDocuments = splitTwoDocumentLockfile(apiLockfile);
if (apiDocuments?.environment.includes('packageManagerDependencies:')) {
  process.stdout.write('API artifact already carries pnpm package-manager dependency metadata.\n');
  process.exit(0);
}

const apiMainDocument = apiDocuments?.main ?? apiLockfile.replace(/^---\n/, '');
const normalized =
  DOCUMENT_START +
  rootDocuments.environment +
  DOCUMENT_SEPARATOR +
  apiMainDocument.replace(/^\n+/, '');

await writeFile(apiLockfilePath, normalized, 'utf8');
process.stdout.write('Normalized API artifact pnpm package-manager dependency metadata.\n');
