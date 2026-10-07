# UI migration

The app lives at the repository root. New UI components belong in
`src/components/ui`, use Base UI (`@base-ui/react`) and Lucide icons, and use
`cn` from `@/lib/utils` for conditional/merged class names. `components.json`
pins shadcn to `base-nova`. Generate primitives on demand with
`pnpm dlx shadcn@latest add <component>`, then own and restyle the copied source.
Keep the Base UI style explicit; do not reinitialize the app or accept a CLI
reset/theme replacement during coexistence.

Tailwind v4 utilities have the `tw:` prefix (e.g. `tw:flex`, `tw:md:p-4`,
`tw:dark:hidden`). This prevents Bootstrap class names such as `p-4` and
`border` from silently acquiring Tailwind styles. Use theme tokens and standard
utilities rather than arbitrary values, raw colors or inline styles. Full
semantic theme tokens will be introduced by the theme migration.

`src/main.tsx` imports `src/tailwind.css` once for all routes. That stylesheet
orders `theme, legacy, components, utilities` and imports Bootstrap, its icons
and `styles.css` into the **same legacy layer**, in their original order.
Keeping them together preserves specificity and source order even for the many
existing `!important` overrides; separate legacy layers would reverse important
precedence. Bootstrap reboot remains the reset: do not import Tailwind preflight.
Normal Tailwind utilities beat normal legacy declarations. Legacy `!important`
rules still beat normal utilities: remove the legacy selector as its component
migrates rather than adding more important overrides.

Oxlint loads the four shadcn rules. `scripts/legacy-classes.mjs` derives the
legacy class allow-list from Bootstrap, Bootstrap Icons and app CSS every run;
do not add broad class-name patterns or hand-maintained lists. Existing inline
style properties have explicit per-file exceptions in `oxlint.config.ts`.
Remove those exceptions as each file migrates; do not extend them for new UI.
Generated Paraglide output is excluded from lint.

## Migration verification

For every migration PR, run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and
`pnpm build`. The current safety net is Vitest plus browser screenshots; no
axe/Playwright suite is introduced in this tooling-only change. Attach before
and after screenshots of the affected routes in both light and dark themes at
desktop (1440px) and mobile (390px) widths. Check keyboard focus, accessible
names, and dialog/menu keyboard behavior when introducing Base UI components.
Do not claim automated accessibility coverage from screenshots.

For a cascade smoke check, temporarily append a `container tw:p-0` button and a
`tab-content tw:p-0` element in the browser and check computed padding in
both themes. Use a class defined in `styles.css` with normal padding if that
selector changes. Both should have zero padding, whereas legacy-only controls
retain their original padding. Keep probes out of application markup.
