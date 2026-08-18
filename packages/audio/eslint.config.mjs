import tseslint from 'typescript-eslint';
import {moduleBoundaryConfig} from '../../eslint.base.config.mjs';

export default tseslint.config(
  ...moduleBoundaryConfig,
  {
    files: ['src/**/*.ts'],
    ignores: ['**/*.test.ts'],
    extends: [tseslint.configs.recommended],
  },
);
