# Tailwind theme migration (issue #250)

The existing Grenspost palette lives in `src/styles/tokens.css`. Dark remains the
`:root` default; `[data-bs-theme="light"]` overrides the same variables. Tailwind's
`dark` variant matches `[data-bs-theme="dark"]` and its descendants. Keep this
attribute during Bootstrap coexistence: no second theme class or state is needed.

## Token mapping

`src/tailwind.css` uses `@theme inline` so utilities resolve the palette at the
styled element, including light overrides. All existing color families also have
direct tokens (`brand`, `surface-2`, `nl-light`, `be-border`, `success-dim`, etc.).
Use prefixed utilities such as `tw:bg-background`, `tw:text-foreground`,
`tw:border-border`, `tw:font-mono` and `tw:rounded-md`.

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
`scripts/theme-bootstrap.ts` compiles that source with Vite's TypeScript
transformer, removes module exports and wraps it in an IIFE calling
`applyTheme(loadTheme())`. Vite injects this synchronous inline script at the
`index.html` head marker in development and production, before the app and
stylesheet load. There is no asynchronous script fetch or second implementation
of the theme algorithm. Keep `theme.ts` self-contained for this boot compilation.
The existing navbar still handles persisted changes and live system preference
changes when auto is selected.

## Component migration and progress

`src/styles.css` is now an ordered import manifest. Remaining Bootstrap rules
are grouped under `src/styles/` by component; they stay in the same legacy layer
and source order as Bootstrap and Bootstrap Icons. `bootstrap-theme.css` is the
temporary variable bridge. Bootstrap reboot remains the only reset.

All React Bootstrap Badge consumers now use the copied and restyled Base UI
badge in `src/components/ui/badge.tsx`: input labels, year comparison, NL ruling,
WFH thresholds and country labels on reference pages. The badge section and its
form-label, threshold, ruling and country overrides have been deleted. Other
Bootstrap component restyles remain until their corresponding migration.
The legacy class inventory reads the split CSS files dynamically.

The original stylesheet was 2,394 lines. The import manifest is 29 lines; the
remaining legacy sections total 2,187 lines, with 112 shared palette lines moved
to `tokens.css`. Moving rules alone is not migration progress: track the sum of
the legacy section files (excluding shared tokens), and delete rules as their
components migrate. Ten badge rule blocks were removed in this change.

The existing focus rules are preserved in `unified-focus-ring.css`, including
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

Temporary `container tw:p-0` and `tab-content tw:p-0` probes both computed to
zero padding in both themes and widths. Legacy controls retained 12px container
horizontal padding and 20px desktop / 16px mobile tab-content padding. Probes
were removed immediately and are absent from application markup.
