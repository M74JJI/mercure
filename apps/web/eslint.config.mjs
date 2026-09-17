import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';

import baseConfig from '../../eslint.config.mjs';

const webFiles = ['src/**/*.{js,jsx,ts,tsx}'];

export default [
  ...baseConfig,
  {
    files: webFiles,
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
    },
    settings: {
      next: {
        rootDir: '.',
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactHooks.configs.flat.recommended.rules,
    },
  },
];
