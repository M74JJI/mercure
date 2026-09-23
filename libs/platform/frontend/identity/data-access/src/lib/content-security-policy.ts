const PUBLIC_IDENTITY_PATHS = new Set(['/auth/sign-in', '/auth/forbidden', '/auth/error']);

interface ContentSecurityPolicyOptions {
  readonly nonce?: string;
  readonly nodeEnvironment?: string;
}

export interface ContentSecurityPolicyContext {
  readonly nonce: string;
  readonly value: string;
  readonly requestHeaders: Headers;
}

export function isPublicIdentityPath(pathname: string): boolean {
  return PUBLIC_IDENTITY_PATHS.has(pathname);
}

export function createContentSecurityPolicy(
  nonce: string,
  nodeEnvironment: string | undefined = process.env.NODE_ENV,
): string {
  // Keep same-origin external chunks allowed in addition to nonce-gated inline
  // scripts. Next.js App Router can currently emit loading/error boundary
  // chunks without a nonce; strict-dynamic would cause modern browsers to
  // ignore the 'self' fallback and block those framework chunks.
  const scriptSources = ["'self'", `'nonce-${nonce}'`];

  if (nodeEnvironment === 'development') {
    scriptSources.push("'unsafe-eval'");
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src ${scriptSources.join(' ')}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    ...(nodeEnvironment === 'production' ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

export function createContentSecurityPolicyContext(
  incomingHeaders: Headers,
  options: ContentSecurityPolicyOptions = {},
): ContentSecurityPolicyContext {
  const nonce = options.nonce ?? crypto.randomUUID();
  const value = createContentSecurityPolicy(nonce, options.nodeEnvironment);
  const requestHeaders = new Headers(incomingHeaders);

  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', value);

  return {
    nonce,
    value,
    requestHeaders,
  };
}
