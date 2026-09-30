import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['libs/platform/frontend/design-system/src/**/*.spec.{ts,tsx}'],
  },
});
