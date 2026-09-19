import { describe, expect, it } from 'vitest';

import { canonicalAuthRedirect, signInRedirect } from './auth-navigation';

const origin = 'https://mercure.example.test';

describe('identity navigation policy', () => {
  it('pins redirects to the configured Mercure origin', () => {
    expect(canonicalAuthRedirect('/rules?offset=25', origin).toString()).toBe(
      'https://mercure.example.test/rules?offset=25',
    );

    expect(canonicalAuthRedirect('https://evil.example/rules', origin).toString()).toBe(
      'https://mercure.example.test/',
    );
  });

  it('preserves only a sanitized same-origin callback in the sign-in URL', () => {
    expect(signInRedirect('/rules/snapshot-1?tab=issues', origin).toString()).toBe(
      'https://mercure.example.test/auth/sign-in?callbackUrl=%2Frules%2Fsnapshot-1%3Ftab%3Dissues',
    );

    expect(signInRedirect('//evil.example/rules', origin).toString()).toBe(
      'https://mercure.example.test/auth/sign-in?callbackUrl=%2F',
    );
  });
});
