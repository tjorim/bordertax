import { paraglideVitePlugin } from '@inlang/paraglide-js';
import reactPlugin from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      strategy: ['localStorage', 'preferredLanguage', 'baseLocale'],
    }),
    reactPlugin() as ReturnType<typeof reactPlugin>,
  ],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/test-setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: [
        'src/paraglide/**',
        'src/main.tsx',
        'src/assets/**',
        'src/tax/types.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
