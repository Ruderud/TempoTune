import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react-dom/client': path.resolve(__dirname, 'node_modules/react-dom/client.js'),
      'react-dom/test-utils': path.resolve(__dirname, 'node_modules/react-dom/test-utils.js'),
      '@tempo-tune/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@tempo-tune/audio': path.resolve(__dirname, '../../packages/audio/src'),
      '@tempo-tune/audio-input': path.resolve(__dirname, '../../packages/audio-input/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
