import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
