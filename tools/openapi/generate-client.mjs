import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import openapiTS, { astToString } from 'openapi-typescript';
import { format, resolveConfig } from 'prettier';

const CHECK_MODE = process.argv.includes('--check');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT = path.join(
  ROOT,
  'libs/platform/frontend/api-client/src/generated/mercure-api.ts',
);

function pnpmExecutable() {
  return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

async function allocatePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Unable to allocate a localhost port.'));
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

function terminateProcessTree(child) {
  if (!child.pid || child.exitCode !== null) {
    return;
  }

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
    });
    return;
  }

  child.kill('SIGTERM');
}

async function waitForDocument(url, child, logBuffer) {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `Mercure API exited before OpenAPI generation completed.\n${logBuffer.join('')}`,
      );
    }

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(1_500),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch {
      // The API may still be building or binding the ephemeral port.
    }

    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  throw new Error(`Timed out waiting for ${url}.\n${logBuffer.join('')}`);
}

async function main() {
  const port = await allocatePort();
  const apiUrl = `http://127.0.0.1:${port}/api/openapi.json`;
  const logs = [];
  const child = spawn(pnpmExecutable(), ['exec', 'nx', 'serve', 'api'], {
    cwd: ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      SERVICE_NAME: 'mercure-openapi-generator',
      API_HOST: '127.0.0.1',
      API_PORT: String(port),
      API_CORS_ORIGINS: 'http://localhost:3000',
      API_BODY_LIMIT_BYTES: '1048576',
      LOG_LEVEL: 'error',
      OPENAPI_ENABLED: 'true',
      DATABASE_URL: 'postgresql://mercure:unused@127.0.0.1:1/mercure',
      DATABASE_POOL_MAX: '1',
      DATABASE_CONNECTION_TIMEOUT_MS: '250',
      DATABASE_IDLE_TIMEOUT_MS: '1000',
      DATABASE_HEALTH_TIMEOUT_MS: '250',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    logs.push(String(chunk));
  });
  child.stderr.on('data', (chunk) => {
    logs.push(String(chunk));
  });

  try {
    const document = await waitForDocument(apiUrl, child, logs);
    const ast = await openapiTS(document);
    const rawGenerated =
      '// This file is generated from the Mercure NestJS OpenAPI contract. Do not edit manually.\n\n' +
      astToString(ast);
    const prettierConfig = (await resolveConfig(OUTPUT)) ?? {};
    const generated = await format(rawGenerated, {
      ...prettierConfig,
      parser: 'typescript',
    });

    if (CHECK_MODE) {
      const existing = await readFile(OUTPUT, 'utf8').catch(() => '');
      if (existing !== generated) {
        throw new Error(
          'Generated API types are out of date. Run "pnpm api:client:generate" and commit the result.',
        );
      }
      return;
    }

    await mkdir(path.dirname(OUTPUT), { recursive: true });
    await writeFile(OUTPUT, generated, 'utf8');
  } finally {
    terminateProcessTree(child);
  }
}

await main();
