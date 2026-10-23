# UI development

The app lives at the repository root. UI components belong in
`src/components/ui`, use Base UI (`@base-ui/react`) and Lucide icons, and use
`cn` from `@/lib/utils` for conditional/merged class names. `components.json`
pins shadcn to `base-mira` and Lucide. Generate primitives on demand with
`pnpm exec shadcn add <component>`, then own and restyle the copied source.
Keep the Base UI style explicit; do not reinitialize the app or accept a CLI
reset/theme replacement. Verify generated paths and imports: components belong
in `src/components/ui`, and `cn` comes from the local utility, not another package.

Before building custom UI, check in this order: the shared controls already in
`src/components/ui` (and their compositions, such as `SortHeaderButton`), the
configured registry (`pnpm exec shadcn add <component> --dry-run --view`),
and the official shadcn/Base UI documentation for built-in variants and
behaviour. Prefer an existing variant or a restyled generated component over new
markup or CSS; keep a custom implementation only for a real requirement, and
record it in `docs/shadcn-adoption-audit.md` with the reason. Using Base UI alone
does not establish registry coverage. The CLI writes `import { cn } from "cn"`;
change it to `@/lib/utils` and restyle with Bordertax tokens.

Tailwind v4 utilities are unprefixed (e.g. `flex`, `md:p-4`,
`dark:hidden`); application classes live in `src/styles` and must not reuse
Tailwind utility names. Use semantic theme tokens and standard utilities rather than
arbitrary values, raw colors or inline styles. Register custom typography tokens
in `src/lib/utils.ts` so merging preserves both font size and text colour.

`src/main.tsx` imports `src/tailwind.css` once for all routes. The stylesheet
orders `theme, base, components, utilities`: tokens, a small application reset,
application styles, then Tailwind utilities. Do not add another global reset.
Theme selection uses `data-theme="light"` or `data-theme="dark"` on the root;
the synchronous head script is compiled from `src/theme.ts`.

Oxlint enforces the four shadcn rules, including strict `no-unknown-classes`,
with no class allow-list or inline-style exceptions. Keep framework classes
and icon fonts out of the app. Dynamic chart proportions use SVG attributes.
Generated Paraglide output is excluded from lint.

## Verification

For UI changes, run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
Run commands that compile Paraglide sequentially, with the dev server stopped,
to avoid competing writes to generated declarations.
Capture before and after screenshots of affected routes in light and dark
at desktop (1440px) and mobile (390px) widths. Check focus, accessible names,
and accordion/menu keyboard behaviour. Screenshots are visual verification,
not automated accessibility coverage; no permanent browser suite is required.

For a cascade smoke check, temporarily append a `ref-link-card p-0` button and
`ref-list-sub p-0` element in the browser and check zero computed padding in
both themes. Unmodified application controls should retain their padding. Keep
probes out of application markup.

## UI dependency maintenance

Follow [docs/ui-maintenance.md](docs/ui-maintenance.md) for Base UI/runtime updates and the pinned shadcn CLI, registry comparisons and review records. Run `pnpm ui:check` from the repository root after changing shared UI. Dependabot does not update owned component source; preserve the documented customisations and validate interactions and bundle budgets.
