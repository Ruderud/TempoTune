import { defineConfig } from 'eslint/config';
import nextConfig from 'eslint-config-next';
import {moduleBoundaryConfig} from '../../eslint.base.config.mjs';

const config = defineConfig([
  ...moduleBoundaryConfig,
  {
    ignores: [
      '.next/**',
      '.open-next/**',
      'playwright-report/**',
      'test-results/**',
      'blob-report/**',
    ],
  },
  ...nextConfig,
]);

export default config;
