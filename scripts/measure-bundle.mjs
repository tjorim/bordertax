// Reports the production build's initial static dependency closure and total
// shipped JS. Run after `pnpm build`: `node scripts/measure-bundle.mjs [dist]`.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { gzipSync } from "node:zlib";
import { parseSync } from "oxc-parser";

const dist = process.argv[2] ?? "dist";
const html = readFileSync(join(dist, "index.html"), "utf8");

const size = (file) => {
  const buf = readFileSync(join(dist, file));
  return { raw: buf.length, gzip: gzipSync(buf).length };
};
const kB = (n) => `${(n / 1000).toFixed(2)} kB`;

const entries = [...html.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+)"/g)].map((m) => m[1]);
const preloads = [...html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g)].map(
  (m) => m[1],
);
const styles = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((href) => href.startsWith("/assets/"));
const toFile = (href) => href.replace(/^\//, "");

// Static imports/re-exports only; `import()` calls are deferred and excluded.
const staticDeps = (file) => {
  const source = readFileSync(join(dist, file), "utf8");
  const { module } = parseSync(file, source);
  const requests = [
    ...module.staticImports.map((i) => i.moduleRequest.value),
    ...module.staticExports.flatMap((e) => e.entries.map((x) => x.moduleRequest?.value)),
  ].filter(Boolean);
  return requests.map((r) => posix.join(dirname(file), r));
};

const initial = new Set([...entries, ...preloads].map(toFile));
const queue = [...initial];
while (queue.length) {
  for (const dep of staticDeps(queue.pop())) {
    if (!initial.has(dep)) {
      initial.add(dep);
      queue.push(dep);
    }
  }
}

const allJs = readdirSync(join(dist, "assets/js")).map((f) => `assets/js/${f}`);
const sum = (files) =>
  files.reduce(
    (acc, f) => {
      const s = size(f);
      return { raw: acc.raw + s.raw, gzip: acc.gzip + s.gzip };
    },
    { raw: 0, gzip: 0 },
  );
const row = (label, files) => {
  const s = sum(files);
  return `${label.padEnd(34)} ${kB(s.raw).padStart(11)} ${kB(s.gzip).padStart(11)}`;
};

console.log(`${"".padEnd(34)} ${"raw".padStart(11)} ${"gzip".padStart(11)}`);
console.log(row(`initial JS (${initial.size} files)`, [...initial]));
console.log(row("initial CSS", styles.map(toFile)));
console.log(row(`total shipped JS (${allJs.length} files)`, allJs));
console.log(
  row(
    "deferred JS",
    allJs.filter((f) => !initial.has(f)),
  ),
);
console.log("\nInitial JS files:");
for (const f of [...initial].sort())
  console.log(`  ${f}  ${kB(size(f).raw)} / ${kB(size(f).gzip)} gzip`);
console.log("\nDeferred JS files:");
for (const f of allJs.filter((f) => !initial.has(f)).sort())
  console.log(`  ${f}  ${kB(size(f).raw)} / ${kB(size(f).gzip)} gzip`);
