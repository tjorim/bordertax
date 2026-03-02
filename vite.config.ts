import reactPlugin from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/bordertax/',
  plugins: [reactPlugin()],
  css: {
    transformer: 'lightningcss',
  },
  build: {
    cssMinify: 'lightningcss',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('react-bootstrap') || id.includes('bootstrap')) {
              return 'vendor-ui';
            }
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
