import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
  ssr: { noExternal: true },
  build: {
    ssr: "mcp/server.ts",
    target: "node24",
    outDir: "dist-mcp",
    rolldownOptions: { output: { entryFileNames: "server.mjs", codeSplitting: false } },
  },
});
