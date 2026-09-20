import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const workspaceRoot = process.cwd();
const rootPolicyPath = path.join(workspaceRoot, 'pnpm-workspace.yaml');
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
