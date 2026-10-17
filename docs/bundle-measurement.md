# Bundle measurement

`pnpm build && pnpm bundle:measure` reports, for the production build in `dist`:

- the **initial JS closure**: the entry script, its `modulepreload` links and every
  chunk they reach through static `import`/`export … from` (dynamic `import()` is
  excluded), raw and gzip;
- the initial CSS, the total shipped JS and the deferred JS.

Gzip uses `zlib` defaults, matching the figures Vite prints.

## Lazy chart and reference views (issue #295)

The WFH ratio chart and the three reference pages load on demand. The chart loads
when its tab is selected or on hover/focus of the tab; reference pages load through
the router's `defaultPreload: "intent"` links or direct navigation.

`manualChunks` used to match any `node_modules` path containing `react`, which pulled
`@tanstack/react-table`, `@tanstack/charts/react`, `lucide-react`, `@base-ui/react`
and others into `vendor-react`. Splitting components alone left that chunk eager, so
the match is now limited to the `react`, `react-dom` and `scheduler` packages.

| Build (same machine, Vite 8.3.4)         | Initial JS raw | Initial JS gzip | Total JS raw | Total JS gzip |
| ---------------------------------------- | -------------: | --------------: | -----------: | ------------: |
| Before (all views eager)                 |     1114.46 kB |       329.48 kB |   1114.46 kB |     329.48 kB |
| Lazy views, original `manualChunks`      |     1019.44 kB |       308.73 kB |   1120.52 kB |     337.29 kB |
| Lazy views, exact-package `manualChunks` |      843.21 kB |       251.72 kB |   1118.85 kB |     337.74 kB |

The initial closure shrinks by about 24 % raw and gzip (271 kB raw, 78 kB gzip).
Total shipped JS is unchanged within 0.4 %: the code moves out of the first load, it
does not disappear. The deferred chunks are `WFHRatioChart` (186 kB raw, 61 kB gzip),
`PensionReference`, `SalarySplitReference`, `ReferenceOverview` and one shared helper
chunk. `@tanstack/react-table` stays in the entry because the year-comparison tab uses
it.

No bundle budget is enforced; none was added because the project has no earlier budget
to compare against and one measurement is not a trend.
