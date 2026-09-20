import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor } from 'nestjs-zod';

import { PlatformConfigModule } from '@mercure/platform-backend-config';
import { PlatformDatabaseModule, PrismaService } from '@mercure/platform-backend-database';
import { READINESS_SERVICE, ReadinessService } from '@mercure/platform-backend-health';
import { ACCESS_TOKEN_VERIFIER } from '@mercure/platform-backend-identity-application';
import { KeycloakAccessTokenVerifier } from '@mercure/platform-backend-identity-infrastructure';
import { PlatformLoggingModule } from '@mercure/platform-backend-logging';
import {
  AuthenticationGuard,
  AuthorizationGuard,
  HealthController,
  ProblemDetailsFilter,
  StrictZodValidationPipe,
} from '@mercure/platform-backend-presentation';

@Module({
  imports: [PlatformConfigModule, PlatformDatabaseModule, PlatformLoggingModule],
  controllers: [HealthController],
  providers: [
    {
      provide: KeycloakAccessTokenVerifier,
      useFactory: (config: PlatformConfig) =>
        new KeycloakAccessTokenVerifier({
          issuer: config.oidcIssuerUrl,
          jwksUrl: config.oidcJwksUrl,
          audience: config.oidcAudience,
          clientId: config.oidcClientId,
          authorityMapping: {
            admin: config.oidcAdminAuthorities,
            user: config.oidcUserAuthorities,
          },
          jwksTimeoutMs: config.oidcJwksTimeoutMs,
          jwksCooldownMs: config.oidcJwksCooldownMs,
          jwksCacheMaxAgeMs: config.oidcJwksCacheMaxAgeMs,
        }),
      inject: [PlatformConfig],
    },
    {
      provide: ACCESS_TOKEN_VERIFIER,
      useExisting: KeycloakAccessTokenVerifier,
    },
    {
      provide: READINESS_SERVICE,
      useFactory: (database: PrismaService) => new ReadinessService([database]),
      inject: [PrismaService],
    },
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    { provide: APP_GUARD, useClass: AuthorizationGuard },
    { provide: APP_PIPE, useClass: StrictZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
  ],
})
export class PlatformBackendModule {}
