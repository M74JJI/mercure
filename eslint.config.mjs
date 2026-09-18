import nx from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';

const sourceFiles = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];

export default [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.nx/**',
      '**/node_modules/**',
      '**/next-env.d.ts',
      '**/src/generated/**',
    ],
  },
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    files: sourceFiles,
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports',
          prefer: 'type-imports',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-extraneous-class': [
        'error',
        {
          allowWithDecorator: true,
        },
      ],
      '@nx/enforce-module-boundaries': [
        'error',
        {
          allow: [],
          depConstraints: [
            {
              sourceTag: 'side:frontend',
              onlyDependOnLibsWithTags: ['side:frontend', 'side:neutral'],
              bannedExternalImports: ['@nestjs/*', '@prisma/*', 'fastify', 'pg'],
            },
            {
              sourceTag: 'side:backend',
              onlyDependOnLibsWithTags: ['side:backend', 'side:neutral'],
              bannedExternalImports: ['next', 'react', 'react-dom'],
            },
            {
              sourceTag: 'side:neutral',
              onlyDependOnLibsWithTags: ['side:neutral'],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              sourceTag: 'scope:platform',
              onlyDependOnLibsWithTags: ['scope:platform', 'scope:shared'],
            },
            {
              sourceTag: 'scope:rules',
              onlyDependOnLibsWithTags: ['scope:rules', 'scope:platform', 'scope:shared'],
            },
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:feature'],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:presentation',
                'type:application',
                'type:domain',
                'type:infrastructure',
                'type:data-access',
                'type:ui',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:presentation',
              onlyDependOnLibsWithTags: ['type:application', 'type:domain', 'type:util'],
            },
            {
              sourceTag: 'type:application',
              onlyDependOnLibsWithTags: ['type:application', 'type:domain', 'type:util'],
            },
            {
              sourceTag: 'type:domain',
              onlyDependOnLibsWithTags: ['type:domain', 'type:util'],
              allowedExternalImports: [],
            },
            {
              sourceTag: 'type:infrastructure',
              onlyDependOnLibsWithTags: [
                'type:infrastructure',
                'type:application',
                'type:domain',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:data-access', 'type:util'],
              bannedExternalImports: ['@nestjs/*', '@prisma/*', 'fastify', 'pg'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util'],
              bannedExternalImports: ['@nestjs/*', '@prisma/*', 'fastify', 'pg'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util'],
              allowedExternalImports: [],
            },
          ],
        },
      ],
    },
  },
];
