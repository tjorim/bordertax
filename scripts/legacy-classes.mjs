import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";

const require = createRequire(import.meta.url);
const files = [
  require.resolve("bootstrap/dist/css/bootstrap.min.css"),
  require.resolve("bootstrap-icons/font/bootstrap-icons.css"),
  new URL("../src/styles.css", import.meta.url),
  ...readdirSync(new URL("../src/styles/", import.meta.url))
    .filter((file) => file.endsWith(".css"))
    .map((file) => new URL(`../src/styles/${file}`, import.meta.url)),
];
const classes = new Set();
for (const file of files) {
  postcss.parse(readFileSync(file, "utf8")).walkRules((rule) => {
    selectorParser((selectors) => {
      selectors.walkClasses((node) => classes.add(node.value));
    }).processSync(rule.selector);
  });
}
export const legacyClasses = [...classes].sort();
