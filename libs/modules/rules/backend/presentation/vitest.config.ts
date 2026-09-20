import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['libs/modules/rules/backend/presentation/src/**/*.spec.ts'],
    passWithNoTests: false,
  },
});
