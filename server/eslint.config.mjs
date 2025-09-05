import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import json from '@eslint/json';
import importPlugin from 'eslint-plugin-import'; // 👈 nuevo
import eslintPluginPrettier from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    plugins: {
      js,
      import: importPlugin,
      prettier: eslintPluginPrettier,
    },
    extends: ['js/recommended'],
    rules: {
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
          singleQuote: true,
          trailingComma: 'all',
          printWidth: 120,
          semi: true,
          arrowParens: 'always',
          bracketSpacing: true,
        },
      ],
      'import/no-unresolved': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            // Permite un nivel relativo, pero bloquea dos o más niveles
            '../../*',
            '../../../*',
            '../../../../*',
          ],
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  tseslint.configs.recommended,
  {
    files: ['**/*.json'],
    plugins: {
      json,
    },
    language: 'json/json',
    extends: ['json/recommended'],
  },
]);
