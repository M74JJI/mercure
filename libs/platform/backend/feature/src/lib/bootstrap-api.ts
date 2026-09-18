import type { Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';

import { parsePlatformEnvironment, PlatformConfig } from '@mercure/platform-backend-config';
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
