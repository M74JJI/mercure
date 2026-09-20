import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import type { PlatformConfig } from '@mercure/platform-backend-config';

export async function configureApiHttp(
  app: NestFastifyApplication,
  config: PlatformConfig,
): Promise<void> {
  const transportSecurity =
    config.nodeEnvironment === 'production' ? {} : { strictTransportSecurity: false };

  if (config.openApiEnabled) {
    await app.register(helmet, {
      ...transportSecurity,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
        },
      },
    });
  } else {
    await app.register(helmet, transportSecurity);
  }

  await app.register(cors, {
    origin: config.corsOrigins,
    credentials: false,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type'],
    exposedHeaders: ['x-request-id'],
    strictPreflight: true,
  });

  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
}
