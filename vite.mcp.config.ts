import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  // Imported entry guards must not become guards for the HTTP bundle itself.
  plugins:
    mode === "http"
      ? [
          {
            name: "mcp-stdio-import-guard",
            transform(code, id) {
              if (id === resolve(import.meta.dirname, "mcp/server.ts"))
                return code.replace("if (import.meta.main)", "if (false)");
            },
          },
        ]
      : [],
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
  ssr: { noExternal: true },
  build: {
    ssr: mode === "http" ? "mcp/http.ts" : "mcp/server.ts",
    emptyOutDir: mode !== "http",
    target: "node24",
    outDir: "dist-mcp",
    rolldownOptions: {
      output: { entryFileNames: mode === "http" ? "http.mjs" : "server.mjs", codeSplitting: false },
    },
  },
}));
