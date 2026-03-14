import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      '@tempo-tune/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@tempo-tune/audio': path.resolve(__dirname, '../../packages/audio/src'),
      '@tempo-tune/audio-input': path.resolve(__dirname, '../../packages/audio-input/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    exclude: ['appium/**', 'node_modules/**'],
  },
});
