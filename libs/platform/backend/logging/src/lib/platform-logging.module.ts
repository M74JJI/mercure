import { randomUUID } from 'node:crypto';

import { Module } from '@nestjs/common';
import { LoggerModule, type Params } from 'nestjs-pino';

import { PlatformConfig, PlatformConfigModule } from '@mercure/platform-backend-config';

export const PLATFORM_LOG_REDACTION_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers.set-cookie',
  'req.body.password',
  'req.body.token',
  'req.body.accessToken',
  'req.body.refreshToken',
  'req.body.secret',
  'req.body.apiKey',
  'req.body.content',
  'req.body.xml',
  'req.body.rawXml',
] as const;

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
          genReqId: (_request, response) => {
            const requestId = randomUUID();
            response.setHeader('x-request-id', requestId);
            return requestId;
          },
          redact: {
            paths: [...PLATFORM_LOG_REDACTION_PATHS],
            remove: true,
          },
        },
      }),
    }),
  ],
})
export class PlatformLoggingModule {}
