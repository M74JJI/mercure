import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['libs/modules/rules/frontend/feature/src/**/*.spec.ts'],
    passWithNoTests: false,
  },
});
