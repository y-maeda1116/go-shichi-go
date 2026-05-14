const tseslint = require('typescript-eslint')
const security = require('eslint-plugin-security')
const js = require('@eslint/js')

const tsPlugin = tseslint.plugin
const tsParser = tseslint.parser

module.exports = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    plugins: {
      security,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        crypto: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        URLSearchParams: 'readonly',
        File: 'readonly',
        FormData: 'readonly',
      },
    },
    rules: {
      ...security.configs.recommended.rules,
    },
  },
  {
    ignores: ['node_modules/', 'dist/', '.wrangler/', 'drizzle/'],
  },
)
