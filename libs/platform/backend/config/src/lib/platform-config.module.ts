import { Global, Inject, Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { z } from 'zod';

const booleanFromEnvironment = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  if (value === 'true' || value === '1') {
    return true;
  }

  if (value === 'false' || value === '0') {
    return false;
  }

  return value;
}, z.boolean());

const corsOrigins = z
  .string()
  .default('http://localhost:3000')
  .transform((value, context) => {
    const values = value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    const normalized = new Set<string>();

    for (const origin of values) {
      if (origin === '*') {
        context.addIssue({
          code: 'custom',
          message: 'Wildcard CORS origins are prohibited.',
        });
        continue;
      }

      try {
        const url = new URL(origin);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          throw new Error('unsupported protocol');
        }
        normalized.add(url.origin);
      } catch {
        context.addIssue({
          code: 'custom',
          message: `Invalid CORS origin: ${origin}`,
        });
      }
    }

    if (normalized.size === 0) {
      context.addIssue({
        code: 'custom',
        message: 'At least one valid CORS origin is required.',
      });
    }

    return [...normalized];
  });

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

const postgresUrl = z
  .string()
  .trim()
  .min(1)
  .superRefine((value, context) => {
    try {
      const url = new URL(value);
      if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
        context.addIssue({
          code: 'custom',
          message: 'DATABASE_URL must use the postgresql:// or postgres:// protocol.',
        });
      }
    } catch {
      context.addIssue({
        code: 'custom',
        message: 'DATABASE_URL must be a valid PostgreSQL connection URL.',
      });
    }
  });

const platformEnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SERVICE_NAME: z.string().trim().min(1).default('mercure-api'),
  API_HOST: z.string().trim().min(1).default('0.0.0.0'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  API_CORS_ORIGINS: corsOrigins,
  API_BODY_LIMIT_BYTES: z.coerce
    .number()
    .int()
    .min(1024)
    .max(10 * 1024 * 1024)
    .default(1024 * 1024),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  OPENAPI_ENABLED: booleanFromEnvironment.default(false),
  OIDC_ISSUER_URL: httpUrl.default('https://identity.example.test/realms/mercure'),
  OIDC_JWKS_URL: httpUrl.optional(),
  OIDC_AUDIENCE: z.string().trim().min(1).default('mercure-api'),
  OIDC_CLIENT_ID: z.string().trim().min(1).default('mercure-api'),
  OIDC_ADMIN_AUTHORITIES: commaSeparatedValues.default(['admin', '/security-admins']),
  OIDC_USER_AUTHORITIES: commaSeparatedValues.default(['user', '/security-users']),
  OIDC_JWKS_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(5_000),
  OIDC_JWKS_COOLDOWN_MS: z.coerce.number().int().min(1_000).max(600_000).default(30_000),
  OIDC_JWKS_CACHE_MAX_AGE_MS: z.coerce
    .number()
    .int()
    .min(10_000)
    .max(86_400_000)
    .default(600_000),
  DATABASE_URL: postgresUrl,
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  DATABASE_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(100).max(60_000).default(5_000),
  DATABASE_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(600_000).default(10_000),
  DATABASE_HEALTH_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(2_000),
  RULES_MANAGER_ARCHIVE_DIR: z.string().trim().min(1).default('/opt/mercure/siem-managers'),
  RULES_ARCHIVE_MAX_FILES: z.coerce.number().int().min(1).max(50_000).default(10_000),
  RULES_ARCHIVE_MAX_ENTRY_BYTES: z.coerce
    .number()
    .int()
    .min(1_024)
    .max(50 * 1024 * 1024)
    .default(5 * 1024 * 1024),
  RULES_ARCHIVE_MAX_TOTAL_BYTES: z.coerce
    .number()
    .int()
    .min(1_024)
    .max(1024 * 1024 * 1024)
    .default(256 * 1024 * 1024),
});

export type PlatformEnvironment = z.infer<typeof platformEnvironmentSchema>;

export function parsePlatformEnvironment(
  environment: Record<string, unknown>,
): PlatformEnvironment {
  const parsed = platformEnvironmentSchema.parse(environment);

  if (parsed.NODE_ENV === 'production') {
    const required = ['OIDC_ISSUER_URL', 'OIDC_AUDIENCE', 'OIDC_CLIENT_ID'] as const;
    for (const key of required) {
      const rawValue = environment[key];
      if (typeof rawValue !== 'string' || rawValue.trim() === '') {
        throw new Error(`${key} must be explicitly configured in production.`);
      }
    }

    if (!parsed.OIDC_ISSUER_URL.startsWith('https://')) {
      throw new Error('OIDC_ISSUER_URL must use https:// in production.');
    }

    if (parsed.OIDC_JWKS_URL && !parsed.OIDC_JWKS_URL.startsWith('https://')) {
      throw new Error('OIDC_JWKS_URL must use https:// in production.');
    }
  }

  return parsed;
}

@Injectable()
export class PlatformConfig {
  constructor(
    @Inject(ConfigService) private readonly config: ConfigService<PlatformEnvironment, true>,
  ) {}

  get nodeEnvironment(): PlatformEnvironment['NODE_ENV'] {
    return this.config.getOrThrow('NODE_ENV', { infer: true });
  }

  get serviceName(): string {
    return this.config.getOrThrow('SERVICE_NAME', { infer: true });
  }

  get apiHost(): string {
    return this.config.getOrThrow('API_HOST', { infer: true });
  }

  get apiPort(): number {
    return this.config.getOrThrow('API_PORT', { infer: true });
  }

  get corsOrigins(): string[] {
    return this.config.getOrThrow('API_CORS_ORIGINS', { infer: true });
  }

  get bodyLimitBytes(): number {
    return this.config.getOrThrow('API_BODY_LIMIT_BYTES', { infer: true });
  }

  get logLevel(): PlatformEnvironment['LOG_LEVEL'] {
    return this.config.getOrThrow('LOG_LEVEL', { infer: true });
  }

  get openApiEnabled(): boolean {
    return this.config.getOrThrow('OPENAPI_ENABLED', { infer: true });
  }

  get oidcIssuerUrl(): string {
    return this.config.getOrThrow('OIDC_ISSUER_URL', { infer: true });
  }

  get oidcJwksUrl(): string {
    const explicit = this.config.get('OIDC_JWKS_URL', { infer: true });
    if (explicit) {
      return explicit;
    }

    return `${this.oidcIssuerUrl.replace(/\/$/, '')}/protocol/openid-connect/certs`;
  }

  get oidcAudience(): string {
    return this.config.getOrThrow('OIDC_AUDIENCE', { infer: true });
  }

  get oidcClientId(): string {
    return this.config.getOrThrow('OIDC_CLIENT_ID', { infer: true });
  }

  get oidcAdminAuthorities(): string[] {
    return this.config.getOrThrow('OIDC_ADMIN_AUTHORITIES', { infer: true });
  }

  get oidcUserAuthorities(): string[] {
    return this.config.getOrThrow('OIDC_USER_AUTHORITIES', { infer: true });
  }

  get oidcJwksTimeoutMs(): number {
    return this.config.getOrThrow('OIDC_JWKS_TIMEOUT_MS', { infer: true });
  }

  get oidcJwksCooldownMs(): number {
    return this.config.getOrThrow('OIDC_JWKS_COOLDOWN_MS', { infer: true });
  }

  get oidcJwksCacheMaxAgeMs(): number {
    return this.config.getOrThrow('OIDC_JWKS_CACHE_MAX_AGE_MS', { infer: true });
  }

  get databaseUrl(): string {
    return this.config.getOrThrow('DATABASE_URL', { infer: true });
  }

  get databasePoolMax(): number {
    return this.config.getOrThrow('DATABASE_POOL_MAX', { infer: true });
  }

  get databaseConnectionTimeoutMs(): number {
    return this.config.getOrThrow('DATABASE_CONNECTION_TIMEOUT_MS', { infer: true });
  }

  get databaseIdleTimeoutMs(): number {
    return this.config.getOrThrow('DATABASE_IDLE_TIMEOUT_MS', { infer: true });
  }

  get databaseHealthTimeoutMs(): number {
    return this.config.getOrThrow('DATABASE_HEALTH_TIMEOUT_MS', { infer: true });
  }

  get rulesManagerArchiveDir(): string {
    return this.config.getOrThrow('RULES_MANAGER_ARCHIVE_DIR', { infer: true });
  }

  get rulesArchiveMaxFiles(): number {
    return this.config.getOrThrow('RULES_ARCHIVE_MAX_FILES', { infer: true });
  }

  get rulesArchiveMaxEntryBytes(): number {
    return this.config.getOrThrow('RULES_ARCHIVE_MAX_ENTRY_BYTES', { infer: true });
  }

  get rulesArchiveMaxTotalBytes(): number {
    return this.config.getOrThrow('RULES_ARCHIVE_MAX_TOTAL_BYTES', { infer: true });
  }
}

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: false,
      validate: parsePlatformEnvironment,
    }),
  ],
  providers: [PlatformConfig],
  exports: [PlatformConfig],
})
export class PlatformConfigModule {}
