import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { cleanupOpenApiDoc } from 'nestjs-zod';

export function configureOpenApi(app: NestFastifyApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Mercure API')
    .setDescription('Mercure security platform API')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'keycloak',
    )
    .build();
  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));

  SwaggerModule.setup('api/docs', app, document, {
    useGlobalPrefix: false,
    raw: ['json'],
    ui: true,
    jsonDocumentUrl: 'api/openapi.json',
    customSiteTitle: 'Mercure API',
  });
}
