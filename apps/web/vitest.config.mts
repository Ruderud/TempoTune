import { defineConfig } from 'vitest/config';
import { createRequire } from 'node:module';
import path from 'path';

const require = createRequire(import.meta.url);
const resolvePackageRoot = (packageName: string) =>
  path.dirname(require.resolve(`${packageName}/package.json`));

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: resolvePackageRoot('react'),
      'react/jsx-runtime': require.resolve('react/jsx-runtime'),
      'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
      'react-dom': resolvePackageRoot('react-dom'),
      'react-dom/client': require.resolve('react-dom/client'),
      'react-dom/test-utils': require.resolve('react-dom/test-utils'),
      '@tempo-tune/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@tempo-tune/audio': path.resolve(__dirname, '../../packages/audio/src'),
      '@tempo-tune/audio-input': path.resolve(__dirname, '../../packages/audio-input/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
