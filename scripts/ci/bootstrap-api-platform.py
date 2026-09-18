from pathlib import Path

FILES: dict[str, str] = {
    ".env.example": """NODE_ENV=development
SERVICE_NAME=mercure-api
API_HOST=0.0.0.0
API_PORT=3001
API_CORS_ORIGINS=http://localhost:3000
API_BODY_LIMIT_BYTES=1048576
LOG_LEVEL=info
OPENAPI_ENABLED=true
""",
    "apps/api/package.json": """{
  "name": "@mercure/api",
  "version": "0.0.0",
  "private": true,
  "type": "commonjs",
  "dependencies": {
    "@mercure/platform-backend-feature": "workspace:*"
  }
}
""",
    "apps/api/project.json": """{
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "name": "api",
  "projectType": "application",
  "sourceRoot": "apps/api/src",
  "tags": ["scope:composition", "side:backend", "type:app"],
  "targets": {
    "build": {
      "executor": "@nx/webpack:webpack",
      "outputs": ["{workspaceRoot}/dist/apps/api"],
      "options": {
        "webpackConfig": "apps/api/webpack.config.cjs",
        "isolatedConfig": true
      }
    },
    "serve": {
      "executor": "@nx/js:node",
      "options": {
        "buildTarget": "api:build"
      }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit -p apps/api/tsconfig.app.json"
      }
    }
  }
}
""",
    "apps/api/webpack.config.cjs": """const { join } = require('node:path');
const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/api'),
    clean: true,
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      buildLibsFromSource: true,
      generatePackageJson: false,
      optimization: true,
      outputHashing: 'none',
      sourceMap: true,
    }),
  ],
};
""",
    "apps/api/src/app/app.module.ts": """import { Module } from '@nestjs/common';

import { PlatformBackendModule } from '@mercure/platform-backend-feature';

@Module({
  imports: [PlatformBackendModule],
})
export class AppModule {}
""",
    "apps/api/src/main.ts": """import 'reflect-metadata';

import { bootstrapApi } from '@mercure/platform-backend-feature';

import { AppModule } from './app/app.module';

void bootstrapApi(AppModule);
""",
    "libs/platform/backend/config/package.json": """{
  "name": "@mercure/platform-backend-config",
  "version": "0.0.0",
  "private": true,
  "type": "commonjs",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@nestjs/common": "11.2.5",
    "@nestjs/config": "12.0.0",
    "zod": "4.5.4"
  }
}
""",
    "libs/platform/backend/config/project.json": """{
  "$schema": "../../../../node_modules/nx/schemas/project-schema.json",
  "name": "platform-backend-config",
  "projectType": "library",
  "sourceRoot": "libs/platform/backend/config/src",
  "tags": ["scope:platform", "side:backend", "type:infrastructure"],
  "targets": {
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit -p libs/platform/backend/config/tsconfig.lib.json"
      }
    }
  }
}
""",
    "libs/platform/backend/config/eslint.config.mjs": """import baseConfig from '../../../../eslint.config.mjs';

export default baseConfig;
""",
    "libs/platform/backend/config/tsconfig.lib.json": """{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": true,
    "target": "ES2023",
    "types": ["node"],
    "useDefineForClassFields": false
  },
  "include": ["src/**/*.ts"]
}
""",
    "libs/platform/backend/config/src/index.ts": """export {
  PlatformConfig,
  PlatformConfigModule,
  parsePlatformEnvironment,
  type PlatformEnvironment,
} from './lib/platform-config.module';
""",
    "libs/platform/backend/config/src/lib/platform-config.module.ts": """import { Global, Inject, Injectable, Module } from '@nestjs/common';
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

const platformEnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SERVICE_NAME: z.string().trim().min(1).default('mercure-api'),
  API_HOST: z.string().trim().min(1).default('0.0.0.0'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  API_CORS_ORIGINS: corsOrigins,
  API_BODY_LIMIT_BYTES: z.coerce.number().int().min(1024).max(10 * 1024 * 1024).default(1024 * 1024),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  OPENAPI_ENABLED: booleanFromEnvironment.default(false),
});

export type PlatformEnvironment = z.infer<typeof platformEnvironmentSchema>;

export function parsePlatformEnvironment(environment: Record<string, unknown>): PlatformEnvironment {
  return platformEnvironmentSchema.parse(environment);
}

@Injectable()
export class PlatformConfig {
  constructor(@Inject(ConfigService) private readonly config: ConfigService<PlatformEnvironment, true>) {}

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
""",
    "libs/platform/backend/logging/package.json": """{
  "name": "@mercure/platform-backend-logging",
  "version": "0.0.0",
  "private": true,
  "type": "commonjs",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@mercure/platform-backend-config": "workspace:*",
    "@nestjs/common": "11.2.5",
    "nestjs-pino": "5.1.0",
    "pino-http": "11.0.0"
  }
}
""",
    "libs/platform/backend/logging/project.json": """{
  "$schema": "../../../../node_modules/nx/schemas/project-schema.json",
  "name": "platform-backend-logging",
  "projectType": "library",
  "sourceRoot": "libs/platform/backend/logging/src",
  "tags": ["scope:platform", "side:backend", "type:infrastructure"],
  "targets": {
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit -p libs/platform/backend/logging/tsconfig.lib.json"
      }
    }
  }
}
""",
    "libs/platform/backend/logging/eslint.config.mjs": """import baseConfig from '../../../../eslint.config.mjs';

export default baseConfig;
""",
    "libs/platform/backend/logging/tsconfig.lib.json": """{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": true,
    "target": "ES2023",
    "types": ["node"],
    "useDefineForClassFields": false
  },
  "include": ["src/**/*.ts"]
}
""",
    "libs/platform/backend/logging/src/index.ts": """export { PlatformLoggingModule } from './lib/platform-logging.module';
""",
    "libs/platform/backend/logging/src/lib/platform-logging.module.ts": """import { randomUUID } from 'node:crypto';

import { Module } from '@nestjs/common';
import { LoggerModule, type Params } from 'nestjs-pino';

import { PlatformConfig, PlatformConfigModule } from '@mercure/platform-backend-config';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [PlatformConfigModule],
      inject: [PlatformConfig],
      useFactory: (config: PlatformConfig): Params => ({
        pinoHttp: {
          level: config.logLevel,
          base: {
            service: config.serviceName,
            environment: config.nodeEnvironment,
          },
          autoLogging: true,
          quietReqLogger: false,
          genReqId: (request, response) => {
            const incoming = headerValue(request.headers['x-request-id']);
            const requestId = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
            response.setHeader('x-request-id', requestId);
            return requestId;
          },
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'res.headers.set-cookie',
              'req.body.password',
              'req.body.token',
              'req.body.accessToken',
              'req.body.refreshToken',
              'req.body.secret',
              'req.body.apiKey',
            ],
            remove: true,
          },
        },
      }),
    }),
  ],
})
export class PlatformLoggingModule {}
""",
    "libs/platform/backend/http/package.json": """{
  "name": "@mercure/platform-backend-http",
  "version": "0.0.0",
  "private": true,
  "type": "commonjs",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@fastify/cors": "11.3.0",
    "@fastify/helmet": "13.1.1",
    "@mercure/platform-backend-config": "workspace:*",
    "@nestjs/platform-fastify": "11.2.5",
    "fastify": "5.12.4"
  }
}
""",
    "libs/platform/backend/http/project.json": """{
  "$schema": "../../../../node_modules/nx/schemas/project-schema.json",
  "name": "platform-backend-http",
  "projectType": "library",
  "sourceRoot": "libs/platform/backend/http/src",
  "tags": ["scope:platform", "side:backend", "type:infrastructure"],
  "targets": {
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit -p libs/platform/backend/http/tsconfig.lib.json"
      }
    }
  }
}
""",
    "libs/platform/backend/http/eslint.config.mjs": """import baseConfig from '../../../../eslint.config.mjs';

export default baseConfig;
""",
    "libs/platform/backend/http/tsconfig.lib.json": """{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": true,
    "target": "ES2023",
    "types": ["node"],
    "useDefineForClassFields": false
  },
  "include": ["src/**/*.ts"]
}
""",
    "libs/platform/backend/http/src/index.ts": """export { configureApiHttp } from './lib/api-http';
""",
    "libs/platform/backend/http/src/lib/api-http.ts": """import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import type { PlatformConfig } from '@mercure/platform-backend-config';

export async function configureApiHttp(
  app: NestFastifyApplication,
  config: PlatformConfig,
): Promise<void> {
  await app.register(helmet, {
    strictTransportSecurity: config.nodeEnvironment === 'production' ? undefined : false,
    contentSecurityPolicy: config.openApiEnabled
      ? {
          directives: {
            defaultSrc: [\"'self'\"],
            styleSrc: [\"'self'\", \"'unsafe-inline'\"],
            scriptSrc: [\"'self'\", \"'unsafe-inline'\"],
            imgSrc: [\"'self'\", 'data:'],
          },
        }
      : undefined,
  });

  await app.register(cors, {
    origin: config.corsOrigins,
    credentials: false,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
    strictPreflight: true,
  });

  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
}
""",
    "libs/platform/backend/presentation/package.json": """{
  "name": "@mercure/platform-backend-presentation",
  "version": "0.0.0",
  "private": true,
  "type": "commonjs",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@nestjs/common": "11.2.5",
    "@nestjs/core": "11.2.5",
    "@nestjs/swagger": "11.4.7",
    "fastify": "5.12.4",
    "nestjs-zod": "5.5.0"
  }
}
""",
    "libs/platform/backend/presentation/project.json": """{
  "$schema": "../../../../node_modules/nx/schemas/project-schema.json",
  "name": "platform-backend-presentation",
  "projectType": "library",
  "sourceRoot": "libs/platform/backend/presentation/src",
  "tags": ["scope:platform", "side:backend", "type:presentation"],
  "targets": {
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit -p libs/platform/backend/presentation/tsconfig.lib.json"
      }
    }
  }
}
""",
    "libs/platform/backend/presentation/eslint.config.mjs": """import baseConfig from '../../../../eslint.config.mjs';

export default baseConfig;
""",
    "libs/platform/backend/presentation/tsconfig.lib.json": """{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": true,
    "target": "ES2023",
    "types": ["node"],
    "useDefineForClassFields": false
  },
  "include": ["src/**/*.ts"]
}
""",
    "libs/platform/backend/presentation/src/index.ts": """export { HealthController } from './lib/health.controller';
export { ProblemDetailsFilter } from './lib/problem-details.filter';
export { StrictZodValidationPipe } from './lib/strict-zod-validation.pipe';
""",
    "libs/platform/backend/presentation/src/lib/health.controller.ts": """import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

interface HealthResponse {
  status: 'up' | 'ready';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get('live')
  @ApiOperation({ summary: 'Process liveness probe' })
  live(): HealthResponse {
    return { status: 'up' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Service readiness probe' })
  ready(): HealthResponse {
    return { status: 'ready' };
  }
}
""",
    "libs/platform/backend/presentation/src/lib/strict-zod-validation.pipe.ts": """import { createZodValidationPipe } from 'nestjs-zod';

export const StrictZodValidationPipe = createZodValidationPipe({
  strictSchemaDeclaration: true,
});
""",
    "libs/platform/backend/presentation/src/lib/problem-details.filter.ts": """import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodValidationException } from 'nestjs-zod';

interface ProblemDetailIssue {
  path: string;
  code: string;
  message: string;
}

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string;
  instance: string;
  requestId: string;
  details?: ProblemDetailIssue[];
}

function statusTitle(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'Bad Request';
    case HttpStatus.UNAUTHORIZED:
      return 'Unauthorized';
    case HttpStatus.FORBIDDEN:
      return 'Forbidden';
    case HttpStatus.NOT_FOUND:
      return 'Not Found';
    case HttpStatus.CONFLICT:
      return 'Conflict';
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'Unprocessable Entity';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'Too Many Requests';
    default:
      return status >= 500 ? 'Internal Server Error' : 'Request Failed';
  }
}

function statusCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'BAD_REQUEST';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'UNPROCESSABLE_ENTITY';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'TOO_MANY_REQUESTS';
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED';
  }
}

function detailFromResponse(response: unknown, fallback: string): string {
  if (typeof response === 'string') {
    return response;
  }

  if (typeof response === 'object' && response !== null && 'message' in response) {
    const message = Reflect.get(response, 'message');
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message) && message.every((value) => typeof value === 'string')) {
      return message.join('; ');
    }
  }

  return fallback;
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const reply = context.getResponse<FastifyReply>();
    const requestId = String(request.id ?? request.headers['x-request-id'] ?? 'unknown');
    const instance = request.url.split('?')[0] || request.url;

    if (exception instanceof ZodValidationException) {
      const details = exception.getZodError().issues.map((issue) => ({
        path: issue.path.map(String).join('.'),
        code: issue.code,
        message: issue.message,
      }));
      const problem: ProblemDetails = {
        type: 'urn:mercure:error:validation-error',
        title: 'Validation Error',
        status: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        detail: 'The request did not satisfy the API contract.',
        instance,
        requestId,
        details,
      };
      reply.status(problem.status).send(problem);
      return;
    }

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const code = statusCode(status);
    const fallbackDetail = status >= 500 ? 'An unexpected error occurred.' : statusTitle(status);
    const detail =
      exception instanceof HttpException
        ? detailFromResponse(exception.getResponse(), fallbackDetail)
        : fallbackDetail;

    if (status >= 500) {
      this.logger.error(
        'Unhandled request exception',
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const problem: ProblemDetails = {
      type: `urn:mercure:error:${code.toLowerCase().replaceAll('_', '-')}`,
      title: statusTitle(status),
      status,
      code,
      detail,
      instance,
      requestId,
    };

    reply.status(status).send(problem);
  }
}
""",
    "libs/platform/backend/feature/package.json": """{
  "name": "@mercure/platform-backend-feature",
  "version": "0.0.0",
  "private": true,
  "type": "commonjs",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@mercure/platform-backend-config": "workspace:*",
    "@mercure/platform-backend-http": "workspace:*",
    "@mercure/platform-backend-logging": "workspace:*",
    "@mercure/platform-backend-presentation": "workspace:*",
    "@nestjs/common": "11.2.5",
    "@nestjs/core": "11.2.5",
    "@nestjs/platform-fastify": "11.2.5",
    "@nestjs/swagger": "11.4.7",
    "nestjs-pino": "5.1.0",
    "nestjs-zod": "5.5.0"
  }
}
""",
    "libs/platform/backend/feature/project.json": """{
  "$schema": "../../../../node_modules/nx/schemas/project-schema.json",
  "name": "platform-backend-feature",
  "projectType": "library",
  "sourceRoot": "libs/platform/backend/feature/src",
  "tags": ["scope:platform", "side:backend", "type:feature"],
  "targets": {
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit -p libs/platform/backend/feature/tsconfig.lib.json"
      }
    }
  }
}
""",
    "libs/platform/backend/feature/eslint.config.mjs": """import baseConfig from '../../../../eslint.config.mjs';

export default baseConfig;
""",
    "libs/platform/backend/feature/tsconfig.lib.json": """{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": true,
    "target": "ES2023",
    "types": ["node"],
    "useDefineForClassFields": false
  },
  "include": ["src/**/*.ts"]
}
""",
    "libs/platform/backend/feature/src/index.ts": """export { bootstrapApi } from './lib/bootstrap-api';
export { PlatformBackendModule } from './lib/platform-backend.module';
""",
    "libs/platform/backend/feature/src/lib/platform-backend.module.ts": """import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor } from 'nestjs-zod';

import { PlatformConfigModule } from '@mercure/platform-backend-config';
import { PlatformLoggingModule } from '@mercure/platform-backend-logging';
import {
  HealthController,
  ProblemDetailsFilter,
  StrictZodValidationPipe,
} from '@mercure/platform-backend-presentation';

@Module({
  imports: [PlatformConfigModule, PlatformLoggingModule],
  controllers: [HealthController],
  providers: [
    { provide: APP_PIPE, useClass: StrictZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
  ],
})
export class PlatformBackendModule {}
""",
    "libs/platform/backend/feature/src/lib/configure-openapi.ts": """import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { cleanupOpenApiDoc } from 'nestjs-zod';

export function configureOpenApi(app: NestFastifyApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Mercure API')
    .setDescription('Mercure security platform API')
    .setVersion('1.0.0')
    .build();
  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));

  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    raw: ['json'],
    ui: true,
    jsonDocumentUrl: 'openapi.json',
    customSiteTitle: 'Mercure API',
  });
}
""",
    "libs/platform/backend/feature/src/lib/bootstrap-api.ts": """import type { Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';

import {
  parsePlatformEnvironment,
  PlatformConfig,
} from '@mercure/platform-backend-config';
import { configureApiHttp } from '@mercure/platform-backend-http';

import { configureOpenApi } from './configure-openapi';

export async function bootstrapApi(rootModule: Type<unknown>): Promise<NestFastifyApplication> {
  const environment = parsePlatformEnvironment(process.env);
  const app = await NestFactory.create<NestFastifyApplication>(
    rootModule,
    new FastifyAdapter({ bodyLimit: environment.API_BODY_LIMIT_BYTES }),
    {
      bufferLogs: true,
      abortOnError: true,
    },
  );

  const logger = app.get(Logger);
  app.useLogger(logger);

  const config = app.get(PlatformConfig);
  await configureApiHttp(app, config);

  if (config.openApiEnabled) {
    configureOpenApi(app);
  }

  await app.listen({ host: config.apiHost, port: config.apiPort });
  logger.log(
    {
      host: config.apiHost,
      port: config.apiPort,
      openApiEnabled: config.openApiEnabled,
    },
    'Mercure API listening',
  );

  return app;
}
""",
}

for relative_path, content in FILES.items():
    path = Path(relative_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
