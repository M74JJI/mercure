const webdriverBaseUrl = process.env.WEBDRIVER_URL ?? 'http://127.0.0.1:9515';
const webBaseUrl = process.env.E2E_WEB_URL ?? 'http://localhost:3000';
const chromePath = process.env.CHROME_PATH;
const userUsername = process.env.E2E_USERNAME ?? 'mercure-user';
const userPassword = process.env.E2E_PASSWORD ?? 'mercure-user-e2e-password';
const adminUsername = process.env.E2E_ADMIN_USERNAME ?? 'mercure-admin';
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'mercure-admin-e2e-password';

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

async function executeScript(sessionId, script, args = []) {
  return webdriver(`/session/${sessionId}/execute/sync`, {
    method: 'POST',
    body: JSON.stringify({ script, args }),
  });
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

async function waitForReactHydration(sessionId, elementId) {
  await waitFor('React hydration', () =>
    executeScript(
      sessionId,
      "const element = arguments[0]; return Object.keys(element).some((key) => key.startsWith('__reactProps$'));",
      [{ [elementKey]: elementId }],
    ),
  );
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

async function browserDiagnostic(sessionId) {
  const url = await currentUrl(sessionId).catch(() => '<unavailable>');
  const source = await pageSource(sessionId).catch(() => '');
  const compactSource = source.replace(/\s+/g, ' ').slice(0, 800);

  return { url, source: compactSource };
}

async function deleteSession(sessionId) {
  await webdriver(`/session/${sessionId}`, { method: 'DELETE' });
}

async function login(sessionId, username, password, label) {
  await navigate(sessionId, `${webBaseUrl}/auth/sign-in`);

  const signInButton = await waitFor(`${label} Mercure sign-in button`, () =>
    findElement(
      sessionId,
      'xpath',
      "//button[contains(normalize-space(.), 'Continue with Keycloak')]",
    ),
  );
  await waitForReactHydration(sessionId, signInButton);
  await click(sessionId, signInButton);

  try {
    await waitFor(`${label} Keycloak provider redirect`, async () => {
      const url = new URL(await currentUrl(sessionId));
      return (
        url.origin === 'http://127.0.0.1:8080' && url.pathname.includes('/realms/mercure-e2e/')
      );
    });
  } catch (error) {
    const diagnostic = await browserDiagnostic(sessionId);
    throw new Error(
      `${label} Keycloak provider redirect failed at ${diagnostic.url}. Page: ${diagnostic.source}`,
      { cause: error },
    );
  }

  const usernameInput = await waitFor(`${label} Keycloak username field`, () =>
    findElement(sessionId, 'css selector', '#username'),
  );
  const passwordInput = await findElement(sessionId, 'css selector', '#password');

  await type(sessionId, usernameInput, username);
  await type(sessionId, passwordInput, password);

  const loginButton = await findElement(sessionId, 'css selector', '#kc-login');
  await click(sessionId, loginButton);

  await waitFor(`${label} Mercure authenticated redirect`, async () => {
    const url = new URL(await currentUrl(sessionId));
    return url.origin === webBaseUrl && url.pathname === '/';
  });

  const homeSource = await pageSource(sessionId);
  if (!homeSource.includes('Security engineering workspace')) {
    throw new Error(`${label} authenticated Mercure shell was not rendered.`);
  }
}

async function verifyRulesAccess(sessionId, label, expectAdminControls) {
  await navigate(sessionId, `${webBaseUrl}/rules`);

  await waitFor(`${label} Rules page`, async () => {
    const url = new URL(await currentUrl(sessionId));
    return url.origin === webBaseUrl && url.pathname === '/rules';
  });

  const rulesSource = await pageSource(sessionId);
  if (!rulesSource.includes('Configuration snapshots')) {
    throw new Error(`${label} Rules page did not render authenticated API data.`);
  }

  const hasAdminControls = rulesSource.includes('Authoring drafts');
  if (hasAdminControls !== expectAdminControls) {
    throw new Error(
      expectAdminControls
        ? `${label} did not receive expected administrator authoring controls.`
        : `${label} unexpectedly received administrator authoring controls.`,
    );
  }
}

async function verifyAdminBoundary(sessionId, label, expectAdminAccess) {
  await navigate(sessionId, `${webBaseUrl}/rules/drafts`);

  if (!expectAdminAccess) {
    await waitFor(`${label} forbidden redirect`, async () => {
      const url = new URL(await currentUrl(sessionId));
      return url.origin === webBaseUrl && url.pathname === '/auth/forbidden';
    });
    return;
  }

  await waitFor(`${label} authoring page`, async () => {
    const url = new URL(await currentUrl(sessionId));
    return url.origin === webBaseUrl && url.pathname === '/rules/drafts';
  });

  const authoringSource = await pageSource(sessionId);
  if (
    !authoringSource.includes('Authoring drafts') ||
    !authoringSource.includes('Create a blank XML draft')
  ) {
    throw new Error(`${label} administrator authoring page was not rendered.`);
  }
}

async function runScenario({ label, username, password, expectAdminAccess }) {
  const sessionId = await createSession();

  try {
    await login(sessionId, username, password, label);
    await verifyRulesAccess(sessionId, label, expectAdminAccess);
    await verifyAdminBoundary(sessionId, label, expectAdminAccess);
    console.log(`${label} browser authentication E2E passed.`);
  } finally {
    await deleteSession(sessionId).catch(() => undefined);
  }
}

await runScenario({
  label: 'Normal user',
  username: userUsername,
  password: userPassword,
  expectAdminAccess: false,
});

await runScenario({
  label: 'Administrator',
  username: adminUsername,
  password: adminPassword,
  expectAdminAccess: true,
});

console.log('Browser Keycloak user/admin authentication E2E passed.');
