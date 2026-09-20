import { defineConfig } from 'vitest/config';

import { legacyDecoratorsPlugin } from '../../../../../tools/vitest/legacy-decorators';

export default defineConfig({
  plugins: [legacyDecoratorsPlugin()],
  test: {
    environment: 'node',
    include: ['libs/modules/rules/backend/presentation/src/**/*.spec.ts'],
    passWithNoTests: false,
  },
});
