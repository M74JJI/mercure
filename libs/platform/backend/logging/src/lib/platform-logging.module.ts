import { randomUUID } from 'node:crypto';

import { Module } from '@nestjs/common';
import { LoggerModule, type Params } from 'nestjs-pino';

import { PlatformConfig, PlatformConfigModule } from '@mercure/platform-backend-config';

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
