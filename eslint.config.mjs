import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'path';
import { fileURLToPath } from 'url';
import importPlugin from 'eslint-plugin-import';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  ...compat.extends('next/core-web-vitals'),
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Import ordering rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin',     // Node.js built-in modules
            'external',    // npm packages
            'internal',    // Internal modules (using @/ alias)
            'parent',      // Parent directory imports
            'sibling',     // Same directory imports
            'index',       // Index file imports
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
            {
              pattern: 'next/**',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@heroui/**',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@heroicons/**',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@/types/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/enums/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/constants/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/hooks/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/components/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/lib/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/utils/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/services/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/helpers/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/contexts/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/data/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/app/**',
              group: 'internal',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['react', 'next'],
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'off', // TypeScript handles this
      'import/named': 'off', // TypeScript handles this
      'import/default': 'off', // TypeScript handles this
      'import/namespace': 'off', // TypeScript handles this
    },
  },
];
