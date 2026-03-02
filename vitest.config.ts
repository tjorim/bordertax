import reactPlugin from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [reactPlugin() as ReturnType<typeof reactPlugin>],
  test: {
    environment: 'happy-dom',
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
