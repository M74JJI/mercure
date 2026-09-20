import { defineConfig } from 'vitest/config';

// Test configuration may import workspace tooling outside the owning Nx project.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { legacyDecoratorsPlugin } from '../../../../tools/vitest/legacy-decorators';

export default defineConfig({
  plugins: [legacyDecoratorsPlugin()],
  test: {
    environment: 'node',
    include: ['libs/platform/backend/presentation/src/**/*.spec.ts'],
    passWithNoTests: false,
  },
});
