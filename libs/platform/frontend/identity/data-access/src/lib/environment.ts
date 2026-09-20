import { z } from 'zod';

const booleanFromEnvironment = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}, z.boolean());

const commaSeparatedValues = z
  .string()
  .transform((value) => [
    ...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ])
  .pipe(z.array(z.string().min(1)).min(1));

const httpUrl = z
  .string()
  .trim()
  .url()
  .superRefine((value, context) => {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      context.addIssue({
        code: 'custom',
        message: 'URL must use the http:// or https:// protocol.',
      });
    }
  });

const originUrl = httpUrl.superRefine((value, context) => {
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash) {
    context.addIssue({
      code: 'custom',
      message:
        'Authentication origin must not contain credentials, query parameters, or fragments.',
    });
  }
  if (url.pathname !== '/' && url.pathname !== '') {
    context.addIssue({
      code: 'custom',
      message: 'Authentication origin must not contain a path.',
    });
  }
});

const webIdentityEnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AUTH_SECRET: z.string().min(32).default('mercure-development-auth-secret-not-for-production'),
  AUTH_URL: originUrl.default('http://localhost:3000'),
  AUTH_TRUST_HOST: booleanFromEnvironment.default(true),
  AUTH_KEYCLOAK_ID: z.string().trim().min(1).default('mercure-web'),
  AUTH_KEYCLOAK_SECRET: z.string().trim().min(1).default('development-only-client-secret'),
  AUTH_KEYCLOAK_ISSUER: httpUrl.default('https://identity.example.test/realms/mercure'),
  WEB_AUTH_AUTHORITY_CLIENT_ID: z.string().trim().min(1).default('mercure-api'),
  WEB_AUTH_ADMIN_AUTHORITIES: commaSeparatedValues.default(['admin', '/security-admins']),
  WEB_AUTH_USER_AUTHORITIES: commaSeparatedValues.default(['user', '/security-users']),
  WEB_AUTH_REFRESH_SKEW_SECONDS: z.coerce.number().int().min(10).max(300).default(60),
  WEB_AUTH_REFRESH_TIMEOUT_MS: z.coerce.number().int().min(500).max(30_000).default(5_000),
  WEB_AUTH_SESSION_MAX_AGE_SECONDS: z.coerce.number().int().min(300).max(86_400).default(28_800),
});

export interface WebIdentityEnvironment {
  readonly nodeEnvironment: 'development' | 'test' | 'production';
  readonly authSecret: string;
  readonly authOrigin: string;
  readonly trustHost: boolean;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly issuer: string;
  readonly authorityClientId: string;
  readonly adminAuthorities: readonly string[];
  readonly userAuthorities: readonly string[];
  readonly refreshSkewMs: number;
  readonly refreshTimeoutMs: number;
  readonly sessionMaxAgeSeconds: number;
  readonly secureCookies: boolean;
  readonly sessionCookieName: string;
}

export function parseWebIdentityEnvironment(
  environment: Record<string, unknown>,
): WebIdentityEnvironment {
  const parsed = webIdentityEnvironmentSchema.parse(environment);

  if (parsed.NODE_ENV === 'production') {
    const required = [
      'AUTH_SECRET',
      'AUTH_URL',
      'AUTH_TRUST_HOST',
      'AUTH_KEYCLOAK_ID',
      'AUTH_KEYCLOAK_SECRET',
      'AUTH_KEYCLOAK_ISSUER',
      'WEB_AUTH_AUTHORITY_CLIENT_ID',
    ] as const;

    for (const key of required) {
      if (typeof environment[key] !== 'string' || environment[key].trim() === '') {
        throw new Error(`${key} must be explicitly configured in production.`);
      }
    }

    if (!parsed.AUTH_URL.startsWith('https://')) {
      throw new Error('AUTH_URL must use https:// in production.');
    }

    if (!parsed.AUTH_KEYCLOAK_ISSUER.startsWith('https://')) {
      throw new Error('AUTH_KEYCLOAK_ISSUER must use https:// in production.');
    }

    if (!parsed.AUTH_TRUST_HOST) {
      throw new Error('AUTH_TRUST_HOST must be explicitly enabled in production.');
    }
  }

  const authOrigin = new URL(parsed.AUTH_URL).origin;
  const secureCookies = authOrigin.startsWith('https://');

  return {
    nodeEnvironment: parsed.NODE_ENV,
    authSecret: parsed.AUTH_SECRET,
    authOrigin,
    trustHost: parsed.AUTH_TRUST_HOST,
    clientId: parsed.AUTH_KEYCLOAK_ID,
    clientSecret: parsed.AUTH_KEYCLOAK_SECRET,
    issuer: parsed.AUTH_KEYCLOAK_ISSUER.replace(/\/$/, ''),
    authorityClientId: parsed.WEB_AUTH_AUTHORITY_CLIENT_ID,
    adminAuthorities: parsed.WEB_AUTH_ADMIN_AUTHORITIES,
    userAuthorities: parsed.WEB_AUTH_USER_AUTHORITIES,
    refreshSkewMs: parsed.WEB_AUTH_REFRESH_SKEW_SECONDS * 1_000,
    refreshTimeoutMs: parsed.WEB_AUTH_REFRESH_TIMEOUT_MS,
    sessionMaxAgeSeconds: parsed.WEB_AUTH_SESSION_MAX_AGE_SECONDS,
    secureCookies,
    sessionCookieName: secureCookies ? '__Host-authjs.session-token' : 'authjs.session-token',
  };
}
