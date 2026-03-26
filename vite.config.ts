import { paraglideVitePlugin } from "@inlang/paraglide-js";
import reactPlugin from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  plugins: [
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      strategy: ["localStorage", "preferredLanguage", "baseLocale"],
      routeStrategies: [
        {
          match: "/reference/:path(.*)?",
          strategy: ["url", "localStorage", "preferredLanguage", "baseLocale"],
        },
        {
          match: "/naslagwerk/:path(.*)?",
          strategy: ["url", "localStorage", "preferredLanguage", "baseLocale"],
        },
      ],
      urlPatterns: [
        {
          pattern: "/",
          localized: [
            ["en", "/"],
            ["nl", "/"],
          ],
        },
        {
          pattern: "/reference/salary-split",
          localized: [
            ["en", "/reference/salary-split"],
            ["nl", "/naslagwerk/salary-split"],
          ],
        },
        {
          pattern: "/reference/pension",
          localized: [
            ["en", "/reference/pension"],
            ["nl", "/naslagwerk/pensioen"],
          ],
        },
        {
          pattern: "/reference",
          localized: [
            ["en", "/reference"],
            ["nl", "/naslagwerk"],
          ],
        },
        {
          pattern: "/:path(.*)?",
          localized: [
            ["en", "/:path(.*)?"],
            ["nl", "/:path(.*)?"],
          ],
        },
      ],
    }),
    reactPlugin(),
  ],
  css: {
    transformer: "lightningcss",
  },
  build: {
    cssMinify: "lightningcss",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }
            if (id.includes("react-bootstrap") || id.includes("bootstrap")) {
              return "vendor-ui";
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
