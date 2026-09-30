import { copyFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { config } from 'dotenv';

const envPath = '.env.local';

try {
  await copyFile('.env.local.example', envPath, 1);
  console.log('Created .env.local from local development template.');
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') {
    console.log('Using existing .env.local.');
  } else {
    throw error;
  }
}

config({ path: envPath, override: true });
await mkdir('.local/siem-managers', { recursive: true });

function run(command, args) {
  const result = spawnSync(command, args, {
    env: process.env,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('docker', ['compose', '-f', 'deploy/local/platform.compose.yml', 'up', '-d', '--wait']);
run('corepack', ['pnpm', 'db:generate']);
run('corepack', ['pnpm', 'db:migrate:deploy']);

console.log('Local platform ready. Run: pnpm dev');
console.log('Keycloak: http://127.0.0.1:8080 (admin / mercure-local-admin)');
console.log('User: mercure-user / mercure-user-e2e-password');
console.log('Admin: mercure-admin / mercure-admin-e2e-password');
