import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor } from 'nestjs-zod';

import { PlatformConfigModule } from '@mercure/platform-backend-config';
import { PlatformDatabaseModule, PrismaService } from '@mercure/platform-backend-database';
import { READINESS_SERVICE, ReadinessService } from '@mercure/platform-backend-health';
import { PlatformLoggingModule } from '@mercure/platform-backend-logging';
import {
  HealthController,
  ProblemDetailsFilter,
  StrictZodValidationPipe,
} from '@mercure/platform-backend-presentation';

@Module({
  imports: [PlatformConfigModule, PlatformDatabaseModule, PlatformLoggingModule],
  controllers: [HealthController],
  providers: [
    {
      provide: READINESS_SERVICE,
      useFactory: (database: PrismaService) => new ReadinessService([database]),
      inject: [PrismaService],
    },
    { provide: APP_PIPE, useClass: StrictZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
  ],
})
export class PlatformBackendModule {}
