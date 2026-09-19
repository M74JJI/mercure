import { sanitizeCallbackPath } from './callback-path';

export function canonicalAuthRedirect(
  candidate: string,
  authOrigin: string,
): URL {
  const safePath = sanitizeCallbackPath(candidate, authOrigin);
  return new URL(safePath, authOrigin);
}

export function signInRedirect(
  requestedPath: string,
  authOrigin: string,
): URL {
  const safeCallbackPath = sanitizeCallbackPath(requestedPath, authOrigin);
  const signInUrl = new URL('/auth/sign-in', authOrigin);
  signInUrl.searchParams.set('callbackUrl', safeCallbackPath);
  return signInUrl;
}
