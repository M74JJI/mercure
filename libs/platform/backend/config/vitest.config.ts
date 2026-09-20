import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['libs/platform/backend/config/src/**/*.spec.ts'],
    passWithNoTests: false,
  },
});
