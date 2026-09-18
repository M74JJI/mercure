import createClient from 'openapi-fetch';

import type { paths } from '../generated/mercure-api';

const LOCAL_API_ORIGIN = 'http://localhost:3001';

export interface MercureApiClientOptions {
  readonly baseUrl?: string;
  readonly fetch?: typeof globalThis.fetch;
}

export function resolveApiBaseUrl(explicitBaseUrl?: string): string {
  const configured = explicitBaseUrl ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  const candidate =
    configured?.trim() ||
    (process.env.NODE_ENV === 'production' ? undefined : LOCAL_API_ORIGIN);

  if (!candidate) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is required in production.');
  }

  const url = new URL(candidate);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('API base URL must use HTTP or HTTPS.');
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error('API base URL must not contain credentials, query parameters, or fragments.');
  }

  if (url.pathname !== '/' && url.pathname !== '') {
    throw new Error('API base URL must be an origin without a path.');
  }

  return url.origin;
}

export function createMercureApiClient(options: MercureApiClientOptions = {}) {
  return createClient<paths>({
    baseUrl: resolveApiBaseUrl(options.baseUrl),
    fetch: options.fetch,
  });
}

export type MercureApiClient = ReturnType<typeof createMercureApiClient>;
