import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['libs/platform/backend/identity/infrastructure/src/**/*.spec.ts'],
    passWithNoTests: false,
  },
});
