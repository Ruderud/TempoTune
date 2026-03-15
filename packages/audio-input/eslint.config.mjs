import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['src/**/*.ts'],
  ignores: ['**/*.test.ts'],
  extends: [tseslint.configs.recommended],
});
