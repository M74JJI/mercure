import { Module } from '@nestjs/common';
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
