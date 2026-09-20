import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const workspaceRoot = process.cwd();
const apiRoot = path.join(workspaceRoot, 'dist/apps/api');
const apiEntrypoint = path.join(apiRoot, 'main.js');
const apiPackageManifest = path.join(apiRoot, 'package.json');
const apiLockfile = path.join(apiRoot, 'pnpm-lock.yaml');
const apiWorkspaceSettings = path.join(apiRoot, 'pnpm-workspace.yaml');
const appRoot = path.join(workspaceRoot, 'apps/web');
const standaloneSource = path.join(appRoot, '.next/standalone');
const staticSource = path.join(appRoot, '.next/static');
const publicSource = path.join(appRoot, 'public');
const webOutputRoot = path.join(workspaceRoot, 'dist/apps/web-standalone');
const releaseManifestPath = path.join(workspaceRoot, 'dist/release-manifest.json');

async function requireFile(label, file) {
  try {
    const metadata = await stat(file);
    if (!metadata.isFile()) throw new Error('not a file');
  } catch {
    throw new Error(`${label} is missing: ${path.relative(workspaceRoot, file)}`);
  }
}

async function requireDirectory(label, directory) {
  try {
    const metadata = await stat(directory);
    if (!metadata.isDirectory()) throw new Error('not a directory');
  } catch {
    throw new Error(`${label} is missing: ${path.relative(workspaceRoot, directory)}`);
  }
}

async function directoryExists(directory) {
  try {
    return (await stat(directory)).isDirectory();
  } catch {
    return false;
  }
}

async function findGeneratedServers(directory) {
  const servers = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;

    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      servers.push(...(await findGeneratedServers(candidate)));
      continue;
    }

    if (entry.isFile() && entry.name === 'server.js') servers.push(candidate);
  }

  return servers;
}

await requireFile('API production entrypoint', apiEntrypoint);
await requireFile('API production package manifest', apiPackageManifest);
await requireFile('API pruned pnpm lockfile', apiLockfile);
await requireFile('API pnpm workspace settings', apiWorkspaceSettings);
await requireDirectory('Next standalone output', standaloneSource);
await requireDirectory('Next static output', staticSource);

await rm(webOutputRoot, { recursive: true, force: true });
await mkdir(path.dirname(webOutputRoot), { recursive: true });
await cp(standaloneSource, webOutputRoot, { recursive: true });

const servers = await findGeneratedServers(webOutputRoot);
if (servers.length !== 1) {
  throw new Error(`Expected exactly one generated Next server.js, found ${servers.length}.`);
}

const webServerFile = servers[0];
const webServerDirectory = path.dirname(webServerFile);
await mkdir(path.join(webServerDirectory, '.next'), { recursive: true });
await cp(staticSource, path.join(webServerDirectory, '.next/static'), { recursive: true });

if (await directoryExists(publicSource)) {
  await cp(publicSource, path.join(webServerDirectory, 'public'), { recursive: true });
}

const releaseManifest = {
  api: {
    artifactRoot: path.relative(workspaceRoot, apiRoot).split(path.sep).join('/'),
    entrypoint: path.relative(apiRoot, apiEntrypoint).split(path.sep).join('/'),
    installCommand: 'pnpm install --prod --frozen-lockfile',
  },
  web: {
    artifactRoot: path.relative(workspaceRoot, webOutputRoot).split(path.sep).join('/'),
    entrypoint: path.relative(webOutputRoot, webServerFile).split(path.sep).join('/'),
  },
};

await writeFile(
  releaseManifestPath,
  `${JSON.stringify(releaseManifest, null, 2)}\n`,
  'utf8',
);

process.stdout.write(
  `Prepared release artifacts.\n` +
    `API artifact: ${releaseManifest.api.artifactRoot}\n` +
    `API entrypoint: ${releaseManifest.api.entrypoint}\n` +
    `Web artifact: ${releaseManifest.web.artifactRoot}\n` +
    `Web entrypoint: ${releaseManifest.web.entrypoint}\n`,
);
