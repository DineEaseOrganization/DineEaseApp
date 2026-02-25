const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const react = require('eslint-plugin-react');

module.exports = [
  {
    ignores: [
      'node_modules',
      'dist',
      'build',
      'android',
      'ios',
      'web-build',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        __DEV__: 'readonly',
        fetch: 'readonly',
        URLSearchParams: 'readonly',
        XMLHttpRequest: 'readonly',
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        __DEV__: 'readonly',
        require: 'readonly',
        process: 'readonly',
        fetch: 'readonly',
        URLSearchParams: 'readonly',
        XMLHttpRequest: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            "Property[key.name=/^(padding|paddingTop|paddingBottom|paddingLeft|paddingRight|paddingHorizontal|paddingVertical|margin|marginTop|marginBottom|marginLeft|marginRight|marginHorizontal|marginVertical|gap|rowGap|columnGap|borderRadius|fontSize|width|height|top|left|right|bottom)$/] > Literal[value=/^[0-9]+$/]",
          message:
            'Use responsive tokens (Spacing/Radius/FontSize) or r()/rf() for numeric sizes.',
        },
        {
          selector:
            "Property[key.name=/^(padding|paddingTop|paddingBottom|paddingLeft|paddingRight|paddingHorizontal|paddingVertical|margin|marginTop|marginBottom|marginLeft|marginRight|marginHorizontal|marginVertical|gap|rowGap|columnGap|borderRadius|fontSize|width|height|top|left|right|bottom)$/] > Literal[value=/^[0-9]+\\.[0-9]+$/]",
          message:
            'Use responsive tokens (Spacing/Radius/FontSize) or r()/rf() for numeric sizes.',
        },
      ],
    },
  },
];
