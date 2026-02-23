import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@tempo-tune/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@tempo-tune/audio': path.resolve(__dirname, '../../packages/audio/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
