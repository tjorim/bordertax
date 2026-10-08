# Tailwind theme migration (issue #250)

The existing Grenspost palette lives in `src/styles/tokens.css`. Dark remains the
`:root` default; `[data-theme="light"]` overrides the same variables. Tailwind's
`dark` variant matches `[data-theme="dark"]` and its descendants. No second theme
class or state is needed.

## Token mapping

`src/tailwind.css` uses `@theme inline` so utilities resolve the palette at the
styled element, including light overrides. All existing color families also have
direct tokens (`brand`, `surface-2`, `nl-light`, `be-border`, `success-dim`, etc.).
Use utilities such as `bg-background`, `text-foreground`,
`border-border`, `font-mono` and `rounded-md`.

| Semantic token                    | Existing design token                |
| --------------------------------- | ------------------------------------ |
| background / foreground           | bg / text                            |
| card / card-foreground            | surface / text                       |
| popover / popover-foreground      | surface-2 / text                     |
| primary / primary-foreground      | brand / on-solid                     |
| secondary / secondary-foreground  | surface-4 / text-muted               |
| muted / muted-foreground          | surface-2 / text-muted               |
| accent / accent-foreground        | brand-dim / brand-light              |
| destructive                       | danger                               |
| border / input / ring             | border / border-hover / brand-border |
| font-sans / font-mono             | font-body / font-mono                |
| radius-sm / radius-md / radius-lg | r-sm / r / r-lg                      |

Threshold badge colors formerly embedded in selectors now have named palette
tokens. `on-solid` and `on-warning` preserve the foregrounds for filled badges.
Badge typography uses named font-size and tracking tokens, registered with `cn`
so merging a text color does not discard the custom font size.

## One theme initializer

`src/theme.ts` owns storage validation and effective theme resolution.
`scripts/theme-init.ts` compiles that source with Vite's TypeScript
transformer, removes module exports and wraps it in an IIFE calling
`applyTheme(loadTheme())`. Vite injects this synchronous inline script at the
`index.html` head marker in development and production, before the app and
stylesheet load. There is no asynchronous script fetch or second implementation
of the theme algorithm. Keep `theme.ts` self-contained for this boot compilation.
The existing navbar still handles persisted changes and live system preference
changes when auto is selected.

## Component migration

Bootstrap, React Bootstrap and Bootstrap Icons are removed. `src/tailwind.css` is
the only stylesheet entry; `src/styles/` holds the remaining application styles
in the `components` layer, and `reset.css` is the single application reset.
Lucide icons replace the icon font (see `docs/icon-migration.md`), and oxlint
enforces strict `no-unknown-classes` with no legacy allow-list.

Focus rings keep the 2px outline, 2px offset and 4px brand halo, including
the accordion's inset offset. Numeric table cells and `bt-number` retain their
monospace and tabular-number treatment. Badge labels are spans by default and
introduce no extra focus stops or dialog/menu behavior.

## Verification

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
Theme tests execute the generated boot code against light/dark system
preferences, stored light/dark/auto, invalid or absent storage, and unavailable
storage/media APIs. They compare pre-hydration and runtime results.

Browser evidence covers `/` (Home ratio results), `/reference`,
`/reference/salary-split`, and `/reference/pension`, before and after, in both
light and dark at 1440px and 390px widths. Screenshots are visual evidence,
not automated accessibility coverage. Keyboard checks verify the theme button's
accessible name and auto → light → dark → auto cycle and the 2px focus outline,
2px offset and 4px brand halo.

Temporary `container p-0` and `tab-content p-0` probes both computed to
zero padding in both themes and widths. Legacy controls retained 12px container
horizontal padding and 20px desktop / 16px mobile tab-content padding. Probes
were removed immediately and are absent from application markup.
