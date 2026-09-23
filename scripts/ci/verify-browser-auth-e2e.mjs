const webdriverBaseUrl = process.env.WEBDRIVER_URL ?? 'http://127.0.0.1:9515';
const webBaseUrl = process.env.E2E_WEB_URL ?? 'http://127.0.0.1:3000';
const chromePath = process.env.CHROME_PATH;
const username = process.env.E2E_USERNAME ?? 'mercure-user';
const password = process.env.E2E_PASSWORD ?? 'mercure-user-e2e-password';

if (!chromePath) {
  throw new Error('CHROME_PATH is required.');
}

const elementKey = 'element-6066-11e4-a52e-4f735466cecf';

async function webdriver(path, options = {}) {
  const response = await fetch(`${webdriverBaseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const payload = await response.json();

  if (!response.ok || payload.value?.error) {
    throw new Error(
      `WebDriver request failed: ${options.method ?? 'GET'} ${path}: ${JSON.stringify(
        payload.value ?? payload,
      )}`,
    );
  }

  return payload.value;
}

async function waitFor(label, operation, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const value = await operation();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(
    `${label} timed out.${lastError instanceof Error ? ` Last error: ${lastError.message}` : ''}`,
  );
}

async function createSession() {
  const value = await webdriver('/session', {
    method: 'POST',
    body: JSON.stringify({
      capabilities: {
        alwaysMatch: {
          browserName: 'chrome',
          'goog:chromeOptions': {
            binary: chromePath,
            args: [
              '--headless=new',
              '--disable-gpu',
              '--disable-dev-shm-usage',
              '--no-sandbox',
              '--no-first-run',
            ],
          },
        },
      },
    }),
  });

  if (!value?.sessionId) {
    throw new Error('ChromeDriver did not return a session id.');
  }

  return value.sessionId;
}

async function navigate(sessionId, url) {
  await webdriver(`/session/${sessionId}/url`, {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

async function currentUrl(sessionId) {
  return webdriver(`/session/${sessionId}/url`);
}

async function pageSource(sessionId) {
  return webdriver(`/session/${sessionId}/source`);
}

async function findElement(sessionId, using, value) {
  const element = await webdriver(`/session/${sessionId}/element`, {
    method: 'POST',
    body: JSON.stringify({ using, value }),
  });

  const id = element?.[elementKey];
  if (!id) {
    throw new Error(`Element not found: ${using}=${value}`);
  }

  return id;
}

async function click(sessionId, elementId) {
  await webdriver(`/session/${sessionId}/element/${elementId}/click`, {
    method: 'POST',
    body: '{}',
  });
}

async function type(sessionId, elementId, text) {
  await webdriver(`/session/${sessionId}/element/${elementId}/value`, {
    method: 'POST',
    body: JSON.stringify({
      text,
      value: [...text],
    }),
  });
}

async function deleteSession(sessionId) {
  await webdriver(`/session/${sessionId}`, { method: 'DELETE' });
}

const sessionId = await createSession();

try {
  await navigate(sessionId, `${webBaseUrl}/auth/sign-in`);

  const signInButton = await waitFor('Mercure sign-in button', () =>
    findElement(
      sessionId,
      'xpath',
      "//button[contains(normalize-space(.), 'Continue with Keycloak')]",
    ),
  );
  await click(sessionId, signInButton);

  const usernameInput = await waitFor('Keycloak username field', () =>
    findElement(sessionId, 'css selector', '#username'),
  );
  const passwordInput = await findElement(sessionId, 'css selector', '#password');

  await type(sessionId, usernameInput, username);
  await type(sessionId, passwordInput, password);

  const loginButton = await findElement(sessionId, 'css selector', '#kc-login');
  await click(sessionId, loginButton);

  await waitFor('Mercure authenticated redirect', async () => {
    const url = new URL(await currentUrl(sessionId));
    return url.origin === webBaseUrl && url.pathname === '/';
  });

  const homeSource = await pageSource(sessionId);
  if (!homeSource.includes('Security engineering workspace')) {
    throw new Error('Authenticated Mercure shell was not rendered.');
  }

  await navigate(sessionId, `${webBaseUrl}/rules`);

  await waitFor('Rules page', async () => {
    const url = new URL(await currentUrl(sessionId));
    return url.origin === webBaseUrl && url.pathname === '/rules';
  });

  const rulesSource = await pageSource(sessionId);
  if (!rulesSource.includes('Configuration snapshots')) {
    throw new Error('Rules page did not render authenticated API data.');
  }

  if (rulesSource.includes('Authoring drafts')) {
    throw new Error('Normal user unexpectedly received administrator authoring controls.');
  }

  console.log('Browser Keycloak authentication E2E passed.');
} finally {
  await deleteSession(sessionId).catch(() => undefined);
}
