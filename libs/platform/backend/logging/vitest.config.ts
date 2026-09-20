import { defineConfig } from 'vitest/config';

// Test configuration may import workspace tooling outside the owning Nx project.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { legacyDecoratorsPlugin } from '../../../../tools/vitest/legacy-decorators';

export default defineConfig({
  plugins: [legacyDecoratorsPlugin()],
  test: {
    environment: 'node',
    env: {
      DATABASE_URL: 'postgresql://mercure:mercure-test@127.0.0.1:5432/mercure',
    },
    include: ['libs/platform/backend/logging/src/**/*.spec.ts'],
    passWithNoTests: false,
  },
});
