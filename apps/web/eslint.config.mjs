import { defineConfig } from 'eslint/config';
import nextConfig from 'eslint-config-next';

const config = defineConfig([
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
