import { describe, expect, it } from 'vitest';

import { sanitizeCallbackPath } from './callback-path';

const origin = 'https://mercure.example.test';

describe('sanitizeCallbackPath', () => {
  it.each([
    ['/rules?tenant=afma', '/rules?tenant=afma'],
    ['https://mercure.example.test/rules/abc?tab=issues', '/rules/abc?tab=issues'],
    ['/', '/'],
  ])('keeps a safe same-origin callback %s', (candidate, expected) => {
    expect(sanitizeCallbackPath(candidate, origin)).toBe(expected);
  });

  it.each([
    ['https://evil.example/rules'],
    ['//evil.example/rules'],
    ['/\\evil.example/rules'],
    ['/api/auth/callback/keycloak'],
    ['/auth/sign-in'],
    ['/_next/static/chunk.js'],
    ['/%61uth/sign-in'],
    ['/%5c%5cevil.example/rules'],
    ['/%2f%2fevil.example/rules'],
    ['javascript:alert(1)'],
    ['\u0000/rules'],
  ])('rejects unsafe callback %s', (candidate) => {
    expect(sanitizeCallbackPath(candidate, origin)).toBe('/');
  });

  it('uses the requested fallback when no callback is supplied', () => {
    expect(sanitizeCallbackPath(undefined, origin, '/rules')).toBe('/rules');
  });
});
