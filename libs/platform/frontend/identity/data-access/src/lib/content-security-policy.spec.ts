import { describe, expect, it } from 'vitest';

import {
  createContentSecurityPolicy,
  createContentSecurityPolicyContext,
  isPublicIdentityPath,
} from './content-security-policy';

describe('content security policy', () => {
  it('uses a nonce for scripts without unsafe-inline in production', () => {
    const policy = createContentSecurityPolicy('test-nonce', 'production');
    const scriptDirective = policy
      .split('; ')
      .find((directive) => directive.startsWith('script-src '));

    expect(scriptDirective).toBe("script-src 'self' 'nonce-test-nonce' 'strict-dynamic'");
    expect(scriptDirective).not.toContain("'unsafe-inline'");
    expect(scriptDirective).not.toContain("'unsafe-eval'");
    expect(policy).toContain("script-src-attr 'none'");
    expect(policy).toContain("style-src 'self' 'unsafe-inline'");
    expect(policy).toContain('upgrade-insecure-requests');
  });

  it('permits development eval without permitting inline scripts', () => {
    const policy = createContentSecurityPolicy('development-nonce', 'development');
    const scriptDirective = policy
      .split('; ')
      .find((directive) => directive.startsWith('script-src '));

    expect(scriptDirective).toContain("'unsafe-eval'");
    expect(scriptDirective).not.toContain("'unsafe-inline'");
    expect(policy).not.toContain('upgrade-insecure-requests');
  });

  it('forwards the nonce and policy to the rendered request without mutating input headers', () => {
    const incomingHeaders = new Headers({
      'x-existing-header': 'preserved',
    });

    const context = createContentSecurityPolicyContext(incomingHeaders, {
      nonce: 'request-nonce',
      nodeEnvironment: 'production',
    });

    expect(context.nonce).toBe('request-nonce');
    expect(context.requestHeaders.get('x-existing-header')).toBe('preserved');
    expect(context.requestHeaders.get('x-nonce')).toBe('request-nonce');
    expect(context.requestHeaders.get('content-security-policy')).toBe(context.value);
    expect(incomingHeaders.get('x-nonce')).toBeNull();
    expect(incomingHeaders.get('content-security-policy')).toBeNull();
  });

  it('exposes only the intended public identity pages', () => {
    expect(isPublicIdentityPath('/auth/sign-in')).toBe(true);
    expect(isPublicIdentityPath('/auth/forbidden')).toBe(true);
    expect(isPublicIdentityPath('/auth/error')).toBe(true);
    expect(isPublicIdentityPath('/auth/sign-in/extra')).toBe(false);
    expect(isPublicIdentityPath('/rules')).toBe(false);
  });
});
