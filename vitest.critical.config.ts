import { defineConfig } from 'vitest/config';

// Coverage spans multiple backend libraries, including decorator-heavy NestJS
// presentation code, so use the same transform as the owning test projects.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { legacyDecoratorsPlugin } from './tools/vitest/legacy-decorators';

export default defineConfig({
  plugins: [legacyDecoratorsPlugin()],
  test: {
    environment: 'node',
    env: {
      DATABASE_URL: 'postgresql://mercure:mercure-test@127.0.0.1:5432/mercure',
    },
    include: [
      'libs/platform/backend/identity/infrastructure/src/**/*.spec.ts',
      'libs/platform/backend/logging/src/**/*.spec.ts',
      'libs/platform/backend/presentation/src/**/*.spec.ts',
      'libs/modules/rules/backend/presentation/src/**/*.spec.ts',
    ],
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      reportOnFailure: true,
      reportsDirectory: 'coverage/critical',
      include: [
        'libs/platform/backend/identity/infrastructure/src/lib/**/*.ts',
        'libs/platform/backend/logging/src/lib/**/*.ts',
        'libs/platform/backend/presentation/src/lib/**/*.ts',
        'libs/modules/rules/backend/presentation/src/lib/**/*.ts',
      ],
      exclude: ['**/*.spec.ts', '**/authenticated-request.ts'],
      thresholds: {
        statements: 64,
        branches: 57,
        functions: 43,
        lines: 64,
        'libs/platform/backend/identity/infrastructure/src/lib/keycloak-access-token-verifier.ts': {
          statements: 90,
          branches: 90,
          functions: 100,
          lines: 90,
        },
        'libs/platform/backend/logging/src/lib/platform-logging.module.ts': {
          100: true,
        },
        'libs/platform/backend/presentation/src/lib/authentication.guard.ts': {
          statements: 90,
          branches: 85,
          functions: 100,
          lines: 90,
        },
        'libs/platform/backend/presentation/src/lib/authorization.guard.ts': {
          statements: 90,
          branches: 75,
          functions: 100,
          lines: 90,
        },
        'libs/platform/backend/presentation/src/lib/health.controller.ts': {
          statements: 80,
          branches: 70,
          functions: 60,
          lines: 95,
        },
        'libs/platform/backend/presentation/src/lib/problem-details.filter.ts': {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85,
        },
        'libs/modules/rules/backend/presentation/src/lib/rules-intelligence-rate-limit.guard.ts': {
          statements: 90,
          branches: 75,
          functions: 100,
          lines: 90,
        },
      },
    },
  },
});
