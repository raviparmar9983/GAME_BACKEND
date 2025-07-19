module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [
    '.eslintrc.js',
    'dist/**/*',
    'node_modules/**/*',
    'migrations/**',
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        format: [
          'camelCase',
          'UPPER_CASE',
          'strictCamelCase',
          'snake_case',
          'StrictPascalCase',
          'PascalCase',
        ],
        leadingUnderscore: 'allow',
      },
    ],
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: false,
      },
    ],
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    strict: ['error', 'global'],
    eqeqeq: ['error', 'always'],
    'max-depth': ['error', 4],
    'max-len': [
      'warn',
      {
        code: 100,
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],
    'no-console': ['error', { allow: ['info', 'error'] }],
    'no-duplicate-imports': 'error',
    'no-unneeded-ternary': 'error',
    'no-unused-expressions': [
      'error',
      { allowShortCircuit: true, allowTernary: true },
    ],
    'no-useless-escape': 'error',
    'no-useless-concat': 'error',
    'no-sparse-arrays': 'error',
    'id-length': ['error', { min: 1, max: 40 }],
    'eol-last': 'error',
    'dot-notation': ['warn'],
    'object-shorthand': [
      'warn',
      'always',
      {
        avoidQuotes: true,
      },
    ],
    'quote-props': ['warn', 'as-needed'],
    quotes: [
      'warn',
      'single',
      {
        allowTemplateLiterals: true,
      },
    ],
    semi: ['warn', 'always'],
  },
};