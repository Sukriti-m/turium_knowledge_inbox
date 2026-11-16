import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist'] },
  {
    ...js.configs.recommended,
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 2022, globals: globals.node },
  },
];
