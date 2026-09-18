import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['libs/modules/rules/backend/infrastructure/src/**/*.spec.ts'],
    passWithNoTests: false,
  },
});
