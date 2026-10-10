import { URL as NodeURL } from "node:url";
import { readFile } from "node:fs/promises";
import { transformWithOxc, type Plugin } from "vite";

/** Compile the runtime source into a synchronous head script in dev and production. */
export async function themeBootScript(): Promise<string> {
  const source = await readFile(new NodeURL("../src/theme.ts", import.meta.url), "utf8");
  const { code } = await transformWithOxc(
    `(() => {\n${source.replace(/^export /gm, "")}\napplyTheme(loadTheme());\n})();`,
    "theme-init.ts",
    { lang: "ts" },
  );
  return code;
}

export function themeInitPlugin(): Plugin {
  return {
    name: "bordertax-theme-init",
    transformIndexHtml: {
      order: "pre",
      async handler(html) {
        return html.replace("<!-- theme-init -->", `<script>${await themeBootScript()}</script>`);
      },
    },
  };
}
