import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['libs/platform/frontend/api-client/src/**/*.spec.ts'],
    passWithNoTests: false,
  },
});
