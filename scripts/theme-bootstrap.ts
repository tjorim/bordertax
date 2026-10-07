import { URL as NodeURL } from "node:url";
import { readFile } from "node:fs/promises";
import { transformWithOxc, type Plugin } from "vite";

/** Compile the runtime source into a synchronous head script in dev and production. */
export async function themeBootScript(): Promise<string> {
  const source = await readFile(new NodeURL("../src/theme.ts", import.meta.url), "utf8");
  const { code } = await transformWithOxc(
    `(() => {\n${source.replace(/^export /gm, "")}\napplyTheme(loadTheme());\n})();`,
    "theme-bootstrap.ts",
    { lang: "ts" },
  );
  return code;
}

export function themeBootstrapPlugin(): Plugin {
  return {
    name: "bordertax-theme-bootstrap",
    transformIndexHtml: {
      order: "pre",
      async handler(html) {
        return html.replace(
          "<!-- theme-bootstrap -->",
          `<script>${await themeBootScript()}</script>`,
        );
      },
    },
  };
}
