import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      'react': resolve(import.meta.dirname, 'node_modules/react'),
      'react-dom': resolve(import.meta.dirname, 'node_modules/react-dom'),
    },
  },
});
