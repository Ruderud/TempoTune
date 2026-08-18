import tseslint from 'typescript-eslint';
import {moduleBoundaryConfig} from '../../eslint.base.config.mjs';

export default tseslint.config(
  ...moduleBoundaryConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
  },
);
