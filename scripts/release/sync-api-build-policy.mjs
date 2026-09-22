import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const workspaceRoot = process.cwd();
const rootPolicyPath = path.join(workspaceRoot, 'pnpm-workspace.yaml');
const sourceApiPackagePath = path.join(workspaceRoot, 'apps/api/package.json');
const artifactPackagePath = path.join(workspaceRoot, 'dist/apps/api/package.json');
const artifactPolicyPath = path.join(workspaceRoot, 'dist/apps/api/pnpm-workspace.yaml');

function topLevelBlock(content, key) {
  const lines = content.replaceAll('\r\n', '\n').split('\n');
  const start = lines.findIndex((line) => line === `${key}:`);
  if (start === -1) return null;

  let end = start + 1;
  while (end < lines.length) {
    const line = lines[end];
    if (line === '' || /^\s/.test(line) || /^\s*#/.test(line)) {
      end += 1;
      continue;
    }
    break;
  }

  return {
    start,
    end,
    lines: lines.slice(start, end),
  };
}

async function collectWorkspacePackages(directoryPath, packagesByName) {
  const entries = await readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      await collectWorkspacePackages(entryPath, packagesByName);
      continue;
    }

    if (entry.isFile() && entry.name === 'package.json') {
      const manifest = JSON.parse(await readFile(entryPath, 'utf8'));
      if (manifest.name) {
        packagesByName.set(manifest.name, manifest);
      }
    }
  }
}

async function verifyApiRuntimeDependencyClosure(sourceApiPackage) {
  const packagesByName = new Map();
  await collectWorkspacePackages(path.join(workspaceRoot, 'apps'), packagesByName);
  await collectWorkspacePackages(path.join(workspaceRoot, 'libs'), packagesByName);

  const apiDependencies = sourceApiPackage.dependencies ?? {};
  const visited = new Set();
  const pending = [sourceApiPackage];

  while (pending.length > 0) {
    const manifest = pending.pop();
    if (!manifest?.name || visited.has(manifest.name)) continue;
    visited.add(manifest.name);

    for (const [dependencyName, dependencyVersion] of Object.entries(manifest.dependencies ?? {})) {
      if (typeof dependencyVersion === 'string' && dependencyVersion.startsWith('workspace:')) {
        const workspaceDependency = packagesByName.get(dependencyName);
        if (!workspaceDependency) {
          throw new Error(
            `Workspace runtime dependency ${dependencyName} is missing its package manifest.`,
          );
        }
        pending.push(workspaceDependency);
        continue;
      }

      if (apiDependencies[dependencyName] !== dependencyVersion) {
        throw new Error(
          `API runtime dependency closure requires ${dependencyName}@${dependencyVersion}; apps/api/package.json must declare the same exact version.`,
        );
      }
    }
  }
}

const rootContent = await readFile(rootPolicyPath, 'utf8');
const rootAllowBuilds = topLevelBlock(rootContent, 'allowBuilds');
if (!rootAllowBuilds) {
  throw new Error('Root pnpm-workspace.yaml is missing allowBuilds.');
}

const artifactContent = await readFile(artifactPolicyPath, 'utf8');
const artifactLines = artifactContent.replaceAll('\r\n', '\n').split('\n');
const artifactAllowBuilds = topLevelBlock(artifactContent, 'allowBuilds');

if (artifactAllowBuilds) {
  artifactLines.splice(
    artifactAllowBuilds.start,
    artifactAllowBuilds.end - artifactAllowBuilds.start,
    ...rootAllowBuilds.lines,
  );
} else {
  while (artifactLines.at(-1) === '') artifactLines.pop();
  artifactLines.push('', ...rootAllowBuilds.lines);
}

await writeFile(artifactPolicyPath, `${artifactLines.join('\n').replace(/\n*$/, '')}\n`, 'utf8');
process.stdout.write('Synchronized exact API artifact build-script policy.\n');

const sourceApiPackage = JSON.parse(await readFile(sourceApiPackagePath, 'utf8'));
await verifyApiRuntimeDependencyClosure(sourceApiPackage);
const artifactPackage = JSON.parse(await readFile(artifactPackagePath, 'utf8'));
const artifactDependencies = artifactPackage.dependencies ?? {};

for (const dependencyName of Object.keys(sourceApiPackage.dependencies ?? {})) {
  if (!(dependencyName in artifactDependencies)) {
    throw new Error(`Pruned API package is missing declared runtime dependency: ${dependencyName}`);
  }
}

process.stdout.write('Verified declared API runtime dependencies in pruned artifact.\n');
