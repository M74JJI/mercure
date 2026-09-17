import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from './app/app.module';

const API_PREFIX = 'api/v1';
const API_PORT = 3001;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  app.setGlobalPrefix(API_PREFIX);
  app.enableShutdownHooks();

  await app.listen({ host: '0.0.0.0', port: API_PORT });
}

void bootstrap();
