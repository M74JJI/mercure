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
  return platformEnvironmentSchema.parse(environment);
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
