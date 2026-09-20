import { afterEach, describe, expect, it } from 'vitest';

import { resolveApiBaseUrl } from './api-client';

const originalNodeEnvironment = process.env['NODE_ENV'];
const originalApiBaseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'];

afterEach(() => {
  if (originalNodeEnvironment === undefined) delete process.env['NODE_ENV'];
  else process.env['NODE_ENV'] = originalNodeEnvironment;

  if (originalApiBaseUrl === undefined) delete process.env['NEXT_PUBLIC_API_BASE_URL'];
  else process.env['NEXT_PUBLIC_API_BASE_URL'] = originalApiBaseUrl;
});

describe('resolveApiBaseUrl', () => {
  it('uses localhost HTTP outside production when no API origin is configured', () => {
    process.env['NODE_ENV'] = 'development';
    delete process.env['NEXT_PUBLIC_API_BASE_URL'];

    expect(resolveApiBaseUrl()).toBe('http://localhost:3001');
  });

  it('requires an explicit API origin in production', () => {
    process.env['NODE_ENV'] = 'production';
    delete process.env['NEXT_PUBLIC_API_BASE_URL'];

    expect(() => resolveApiBaseUrl()).toThrow(
      'NEXT_PUBLIC_API_BASE_URL is required in production.',
    );
  });

  it('rejects an HTTP API origin in production', () => {
    process.env['NODE_ENV'] = 'production';

    expect(() => resolveApiBaseUrl('http://api.example.test')).toThrow(
      'NEXT_PUBLIC_API_BASE_URL must use HTTPS in production.',
    );
  });

  it('accepts a canonical HTTPS origin in production', () => {
    process.env['NODE_ENV'] = 'production';

    expect(resolveApiBaseUrl('https://api.example.test/')).toBe('https://api.example.test');
  });

  it('rejects credentials, paths, query parameters, and fragments', () => {
    process.env['NODE_ENV'] = 'test';

    expect(() => resolveApiBaseUrl('https://user:pass@api.example.test')).toThrow(
      'API base URL must not contain credentials, query parameters, or fragments.',
    );
    expect(() => resolveApiBaseUrl('https://api.example.test/v1')).toThrow(
      'API base URL must be an origin without a path.',
    );
    expect(() => resolveApiBaseUrl('https://api.example.test?debug=1')).toThrow(
      'API base URL must not contain credentials, query parameters, or fragments.',
    );
    expect(() => resolveApiBaseUrl('https://api.example.test#fragment')).toThrow(
      'API base URL must not contain credentials, query parameters, or fragments.',
    );
  });
});
