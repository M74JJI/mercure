const BLOCKED_PATH_PREFIXES = ['/api/auth', '/auth', '/_next'];

function hasControlCharacters(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f)) {
      return true;
    }
  }

  return false;
}

function isBlockedPath(pathname: string): boolean {
  let decoded: string;

  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return true;
  }

  if (decoded.includes('\\') || decoded.startsWith('//') || hasControlCharacters(decoded)) {
    return true;
  }

  return BLOCKED_PATH_PREFIXES.some(
    (prefix) => decoded === prefix || decoded.startsWith(`${prefix}/`),
  );
}

export function sanitizeCallbackPath(
  candidate: string | null | undefined,
  trustedOrigin: string,
  fallback = '/',
): string {
  const base = new URL(trustedOrigin);
  const value = candidate?.trim();

  if (!value || value.includes('\\') || hasControlCharacters(value)) {
    return fallback;
  }

  try {
    const target = new URL(value, base);

    if (target.origin !== base.origin || isBlockedPath(target.pathname)) {
      return fallback;
    }

    return `${target.pathname}${target.search}`;
  } catch {
    return fallback;
  }
}
