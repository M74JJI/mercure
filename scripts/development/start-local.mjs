import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { config } from 'dotenv';

try {
  await access('.env.local');
} catch {
  console.error('Missing .env.local. Run: pnpm dev:setup');
  process.exit(1);
}

config({ path: '.env.local', override: true });

const shell = process.platform === 'win32';
const commands = [
  ['API', ['exec', 'nx', 'serve', 'api']],
  ['WEB', ['exec', 'nx', 'dev', 'web']],
];
const children = commands.map(([name, args]) => {
  const child = spawn('pnpm', args, {
    env: { ...process.env, NX_DAEMON: 'false' },
    shell,
    stdio: 'inherit',
  });
  child.once('exit', (code) => {
    if (code && code !== 0) console.error(`${name} exited with code ${code}.`);
  });
  return child;
});

let stopping = false;
function stop(signal) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill(signal);
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));

await Promise.all(children.map((child) => new Promise((resolve) => child.once('exit', resolve))));
if (!stopping) process.exitCode = 1;
