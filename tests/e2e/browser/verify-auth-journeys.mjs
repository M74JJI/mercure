#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const chromePath = process.env.CHROME_PATH;
const webOrigin = process.env.MERCURE_E2E_WEB_ORIGIN ?? 'http://127.0.0.1:3000';
const keycloakOrigin = process.env.MERCURE_E2E_KEYCLOAK_ORIGIN ?? 'http://127.0.0.1:8080';
const realm = process.env.MERCURE_E2E_KEYCLOAK_REALM ?? 'mercure-e2e';
const timeoutMs = 20_000;

if (!chromePath) {
  throw new Error('CHROME_PATH is required.');
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function safeLocation(value) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return String(value);
  }
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.socket = null;
  }

  async connect() {
    const socket = new WebSocket(this.url);
    this.socket = socket;

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out connecting to Chrome CDP.')), 5_000);
      socket.addEventListener('open', () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });
      socket.addEventListener('error', () => {
        clearTimeout(timeout);
        reject(new Error('Chrome CDP WebSocket connection failed.'));
      }, { once: true });
    });

    socket.addEventListener('message', (event) => {
      let message;
      try {
        message = JSON.parse(typeof event.data === 'string' ? event.data : String(event.data));
      } catch {
        return;
      }

      if (typeof message.id !== 'number') return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);

      if (message.error) {
        pending.reject(new Error(`CDP ${pending.method} failed: ${message.error.message}`));
        return;
      }

      pending.resolve(message.result ?? {});
    });

    socket.addEventListener('close', () => {
      for (const pending of this.pending.values()) {
        pending.reject(new Error('Chrome CDP connection closed unexpectedly.'));
      }
      this.pending.clear();
    });
  }

  send(method, params = {}) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error(`CDP socket is unavailable for ${method}.`));
    }

    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { method, resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const response = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });

    if (response.exceptionDetails) {
      throw new Error(`Browser evaluation failed: ${response.exceptionDetails.text ?? 'unknown error'}`);
    }

    return response.result?.value;
  }

  close() {
    this.socket?.close();
  }
}

async function waitFor(label, readValue, predicate, timeout = timeoutMs) {
  const deadline = Date.now() + timeout;
  let lastValue;

  while (Date.now() < deadline) {
    try {
      lastValue = await readValue();
      if (predicate(lastValue)) return lastValue;
    } catch {
      // Navigation can briefly invalidate the execution context.
    }
    await sleep(100);
  }

  const printable = typeof lastValue === 'string' ? safeLocation(lastValue) : JSON.stringify(lastValue);
  throw new Error(`Timed out waiting for ${label}. Last observed value: ${printable}`);
}

async function main() {
  const profileDirectory = await mkdtemp(path.join(tmpdir(), 'mercure-chrome-e2e-'));
  const debuggingPort = 9333;
  const chromeOutput = [];
  const chrome = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--no-first-run',
      `--remote-debugging-port=${debuggingPort}`,
      `--user-data-dir=${profileDirectory}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );

  chrome.stderr.setEncoding('utf8');
  chrome.stderr.on('data', (chunk) => {
    chromeOutput.push(chunk);
    if (chromeOutput.length > 40) chromeOutput.shift();
  });

  let client;
  try {
    const version = await waitFor(
      'Chrome DevTools endpoint',
      async () => {
        const response = await fetch(`http://127.0.0.1:${debuggingPort}/json/version`);
        if (!response.ok) return null;
        return response.json();
      },
      (value) => Boolean(value?.Browser),
      10_000,
    );

    if (!version.Browser) throw new Error('Chrome DevTools endpoint returned no browser version.');

    const targetResponse = await fetch(
      `http://127.0.0.1:${debuggingPort}/json/new?${encodeURIComponent('about:blank')}`,
      { method: 'PUT' },
    );
    if (!targetResponse.ok) {
      throw new Error(`Could not create Chrome E2E target: HTTP ${targetResponse.status}.`);
    }

    const target = await targetResponse.json();
    if (typeof target.webSocketDebuggerUrl !== 'string') {
      throw new Error('Chrome E2E target did not expose a CDP WebSocket URL.');
    }

    client = new CdpClient(target.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Network.enable');

    const currentUrl = () => client.evaluate('location.href');
    const bodyText = () => client.evaluate('document.body?.innerText ?? ""');

    async function navigate(url) {
      const previousUrl = await currentUrl();
      const targetOrigin = url === 'about:blank' ? 'null' : new URL(url).origin;

      await client.send('Page.navigate', { url });
      await waitFor(
        `navigation away from ${safeLocation(previousUrl)}`,
        currentUrl,
        (value) => {
          if (typeof value !== 'string' || value === previousUrl) return false;
          if (url === 'about:blank') return value === 'about:blank';
          try {
            return new URL(value).origin === targetOrigin;
          } catch {
            return false;
          }
        },
      );
      await waitFor(
        `document readiness for ${safeLocation(url)}`,
        () => client.evaluate('document.readyState'),
        (value) => value === 'interactive' || value === 'complete',
      );
    }

    async function waitForBody(fragment) {
      return waitFor(
        `body text ${JSON.stringify(fragment)}`,
        bodyText,
        (value) => typeof value === 'string' && value.includes(fragment),
      );
    }

    async function signIn(username, password) {
      await navigate(`${webOrigin}/auth/sign-in`);
      await waitForBody('Continue with Keycloak');

      const clicked = await client.evaluate(`(() => {
        const button = [...document.querySelectorAll('button')].find((candidate) =>
          candidate.textContent?.includes('Continue with Keycloak'),
        );
        if (!button) return false;
        button.click();
        return true;
      })()`);
      if (!clicked) throw new Error('Could not activate the Mercure Keycloak sign-in button.');

      await waitFor(
        'Keycloak authorization page',
        currentUrl,
        (value) =>
          typeof value === 'string' &&
          value.startsWith(`${keycloakOrigin}/realms/${realm}/protocol/openid-connect/auth`),
      );
      await waitFor(
        'Keycloak login form',
        () =>
          client.evaluate(
            `Boolean(document.querySelector('input[name="username"]') && document.querySelector('input[name="password"]'))`,
          ),
        (value) => value === true,
      );

      const submitted = await client.evaluate(`(() => {
        const username = document.querySelector('input[name="username"]');
        const password = document.querySelector('input[name="password"]');
        const form = document.querySelector('#kc-form-login') ?? username?.form;
        if (!(username instanceof HTMLInputElement) || !(password instanceof HTMLInputElement) || !(form instanceof HTMLFormElement)) {
          return false;
        }
        username.value = ${JSON.stringify(username)};
        password.value = ${JSON.stringify(password)};
        username.dispatchEvent(new Event('input', { bubbles: true }));
        password.dispatchEvent(new Event('input', { bubbles: true }));
        if (typeof form.requestSubmit === 'function') form.requestSubmit();
        else form.submit();
        return true;
      })()`);
      if (!submitted) throw new Error('Could not submit the Keycloak login form.');

      await waitFor(
        `Mercure callback completion for ${username}`,
        currentUrl,
        (value) => {
          if (typeof value !== 'string') return false;
          try {
            const url = new URL(value);
            return url.origin === webOrigin && url.pathname === '/';
          } catch {
            return false;
          }
        },
        25_000,
      );
      await waitForBody('Security engineering, composed cleanly.');
    }

    async function clearSession() {
      await client.send('Network.clearBrowserCookies');
      await client.send('Storage.clearDataForOrigin', { origin: webOrigin, storageTypes: 'all' });
      await client.send('Storage.clearDataForOrigin', { origin: keycloakOrigin, storageTypes: 'all' });
      await navigate('about:blank');
    }

    await signIn('mercure-user', 'mercure-user-e2e-password');
    await navigate(`${webOrigin}/rules`);
    const userRulesBody = await waitForBody('Configuration snapshots');
    if (userRulesBody.includes('Authoring drafts')) {
      throw new Error('Normal user unexpectedly received the Rules authoring navigation action.');
    }

    await navigate(`${webOrigin}/rules/drafts`);
    await waitFor(
      'normal user admin-page denial',
      currentUrl,
      (value) => {
        if (typeof value !== 'string') return false;
        try {
          const url = new URL(value);
          return url.origin === webOrigin && url.pathname === '/auth/forbidden';
        } catch {
          return false;
        }
      },
    );
    await waitForBody('Your Mercure role does not permit this action');

    await clearSession();

    await signIn('mercure-admin', 'mercure-admin-e2e-password');
    await navigate(`${webOrigin}/rules`);
    const adminRulesBody = await waitForBody('Configuration snapshots');
    if (!adminRulesBody.includes('Authoring drafts')) {
      throw new Error('Administrator did not receive the Rules authoring navigation action.');
    }

    await navigate(`${webOrigin}/rules/drafts`);
    await waitForBody('Authoring drafts');

    console.log('Full-stack browser authentication journeys passed.');
  } catch (error) {
    if (client) {
      try {
        const url = await client.evaluate('location.href');
        const body = await client.evaluate('(document.body?.innerText ?? "").slice(0, 600)');
        console.error(`Browser failure location: ${safeLocation(url)}`);
        console.error(`Browser body excerpt: ${String(body).replace(/\s+/g, ' ').trim()}`);
      } catch {
        // Preserve the original error when browser diagnostics are unavailable.
      }
    }
    console.error(chromeOutput.join('').slice(-4_000));
    throw error;
  } finally {
    client?.close();
    chrome.kill('SIGTERM');
    await rm(profileDirectory, { recursive: true, force: true });
  }
}

await main();
