import { randomUUID } from 'node:crypto';

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
            const requestId =
              incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
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
