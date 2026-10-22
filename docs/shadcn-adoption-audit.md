# shadcn component adoption audit (issues #303, #305)

Review of `src/components/ui` and the application compositions against the
configured registry (`base-mira`, `components.json`). Sources were compared with
`pnpm dlx shadcn@latest add <component> --dry-run --view` (registry source) and the
official shadcn/Base UI documentation. Using Base UI alone does not establish
registry coverage, so each wrapper is classified as:

- **generated** – registry file with Bordertax restyling only;
- **adapted** – registry structure and variant names, with owned changes;
- **custom** – no registry equivalent, or the registry shape does not fit.

The CLI writes `import { cn } from "cn"`; every file here imports `cn` from
`@/lib/utils` (the local `createCn` with the registered Bordertax tokens).

## Decisions

| Area                 | Source                            | Class       | Decision                                         | Consumers                                             | Reason                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | --------------------------------- | ----------- | ------------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native select        | `ui/native-select.tsx`            | generated   | **Replaced** (was `NativeSelect` in `field.tsx`) | `InputPanel` (4 selects)                              | The old wrapper was a bare `<select>` with the browser arrow. The registry `native-select` adds the chevron wrapper, `size` and `NativeSelectOption`/`OptGroup` (canvas-coloured options). It reuses `inputClasses`, so borders, focus and invalid states match `Input`. Native stays: no JS popup, best mobile picker, no form-state changes. |
| Sort headings        | `results/SortHeaderButton.tsx`    | composition | **Replaced** raw `<button>`s                     | `MultiYearComparison`, `WFHRatioChart` (`RatioTable`) | Two copies of an unstyled `<button>` with no focus style. Now `Button variant="ghost" size="xs"`; one shared component owns the icons and heading type.                                                                                                                                                                                        |
| Detail-table toggle  | `WFHRatioChart`                   | adapted     | **Replaced** `.bt-wfh-table-toggle` button + CSS | `WFHRatioChart`                                       | Same look as `Button variant="outline" size="sm"`; removed the duplicate CSS rule.                                                                                                                                                                                                                                                             |
| Tip/warning callouts | `pages/reference/components.tsx`  | adapted     | **Replaced** `.ref-tip-box`/`.ref-warn-box` CSS  | `TipBox`, `WarnBox` (reference pages)                 | The `Alert` variants `info` and `warning` already carry the same tokens. `TipBox` keeps `role="note"`; `WarnBox` keeps `role="alert"`. Callouts now match the calculator's alerts (left accent bar instead of a full border).                                                                                                                  |
| Button               | `ui/button.tsx`                   | adapted     | **Extended**                                     | navbar, `LazyBoundary`, sort headings, WFH toggle     | Keeps shadcn variant names plus `outline-primary`/`outline-secondary`. Fixed two defects found in this audit: `outline-none` cancelled `focus-visible:outline-2` so no button had a keyboard focus ring; `ghost`/`link` lacked a transparent background and showed the browser button fill.                                                    |
| Tabs                 | `ui/tabs.tsx`                     | custom      | **Keep**                                         | `ResultsTabs`                                         | Registry tabs offer `default` (pill) and `line` list variants. The results UI is a folder tab joined to a bordered panel (`bt-results-panel`), `keepMounted` panels and `activateOnFocus`; neither variant fits. Base UI supplies the roles, arrow keys and `data-active`.                                                                     |
| Dropdown menu        | `ui/dropdown-menu.tsx`            | adapted     | **Keep**                                         | `AppNavbar` (reference guide menu)                    | Subset of the registry file (root, trigger, content, item); items render router `Link`s. The registry adds groups, labels, checkbox/radio items, submenus and shortcuts, which no consumer needs. Add them from the registry when a menu needs them.                                                                                           |
| Collapsible          | `ui/collapsible.tsx`              | generated   | **Keep**                                         | `AppNavbar` mobile menu                               | Same as the registry file.                                                                                                                                                                                                                                                                                                                     |
| Accordion            | `ui/accordion.tsx`                | adapted     | **Keep**                                         | `InputPanel`, reference pages                         | Same Base UI parts and `data-slot` root; chevron rotates instead of swapping icons, with the 2px inset focus ring documented in `ui-theme-migration.md`.                                                                                                                                                                                       |
| Alert                | `ui/alert.tsx`                    | adapted     | **Keep**                                         | calculator results, reference callouts                | Domain variants (`info`, `warning`, `success`, `danger`) replace the registry `default`/`destructive`. `AlertTitle`/`AlertDescription` are not needed yet.                                                                                                                                                                                     |
| Badge                | `ui/badge.tsx`                    | adapted     | **Keep**                                         | results, reference pages                              | Uses `useRender` like the registry; variants are the NL/BE and threshold palette.                                                                                                                                                                                                                                                              |
| Card                 | `ui/card.tsx`                     | adapted     | **Keep**                                         | reference pages, overview                             | Registry also has `CardAction`, `CardFooter` and sizes; unused here.                                                                                                                                                                                                                                                                           |
| Table                | `ui/table.tsx`                    | custom      | **Keep**                                         | results, filing checklist, WFH, reference             | `bordered`/`responsive`/`hover` props, a keyboard-focusable scroll container and row variants (`primary`, `nl`, `be`…) have no registry equivalent. TanStack Table supplies sorting.                                                                                                                                                           |
| Input / Checkbox     | `ui/input.tsx`, `ui/checkbox.tsx` | adapted     | **Keep**                                         | `NumberField`, `CheckboxField`                        | Registry structure with Bordertax tokens. `inputClasses` is shared with `NativeSelect`.                                                                                                                                                                                                                                                        |
| Field composition    | `ui/field.tsx`, `ui/label.tsx`    | adapted     | **Replaced** (issue #305)                        | `NumberField`, `CheckboxField`, `InputPanel`          | Registry `Field`, `FieldGroup`, `FieldLabel` (built on `Label`), `FieldDescription`, `FieldError` and `FieldContent` with Bordertax tokens. See "Field composition" below.                                                                                                                                                                     |
| Spinner              | `ui/spinner.tsx`                  | adapted     | **Keep**                                         | `LazyBoundary`                                        | The registry file with a localised accessible name.                                                                                                                                                                                                                                                                                            |
| Loading state        | `LazyBoundary`                    | custom      | **Keep**                                         | lazy WFH chart / year comparison                      | Reserves the loaded panel height (`min-h-*`); a skeleton would need per-panel layouts. Retry/reload buttons already use `Button`.                                                                                                                                                                                                              |
| Code badge           | `components/CodeBadge.tsx`        | composition | **Replaced** `title` with `Popover` (issue #305) | BE/NL result panels, `InputPanel`                     | Registry `tooltip` never opens on touch and `popover` normally adds a tab stop per code. Decision recorded in "CodeBadge touch access" below.                                                                                                                                                                                                  |
| Navigation links     | `AppNavbar`, `ReferenceOverview`  | custom      | **Keep**                                         | all routes                                            | Router `Link`s with active state. Registry `navigation-menu` targets mega-menus; the collapsible nav + menu already covers the requirement.                                                                                                                                                                                                    |
| Empty state          | –                                 | –           | **No consumer**                                  | –                                                     | The app has no empty list/result views (`RatioTable` returns `null` when it has no rows). Nothing to replace with registry `empty`.                                                                                                                                                                                                            |
| Pagination           | –                                 | –           | **No consumer**                                  | –                                                     | No paginated list.                                                                                                                                                                                                                                                                                                                             |
| Compact selection    | –                                 | –           | **No gap**                                       | –                                                     | Selection is a native select, one checkbox and tabs. No segmented/toggle-group need.                                                                                                                                                                                                                                                           |
| Distribution segment | `ui/distribution-segment.tsx`     | custom      | **Keep**                                         | workday bar, summary, year comparison                 | Chart-specific SVG whose width is an attribute (no inline styles); registry `progress` is a single-value bar.                                                                                                                                                                                                                                  |

## Field composition (issue #305)

`ui/field.tsx` is now the registry `field` structure with Bordertax tokens:

- `Field` (`role="group"`, `orientation="vertical" | "horizontal"`, `invalid`),
  `FieldGroup`, `FieldContent`, `FieldLabel` (wraps `Label`), `FieldDescription`
  (a `<p>`) and `FieldError`.
- `invalid` sets `data-invalid`, which turns the label red from one place; the
  input keeps `aria-invalid` and `aria-describedby` (hint + error ids).
- `FieldError` renders `role="alert"`, so an error is announced when it appears
  (the old `<div>` was silent).
- `CheckboxField` (`fields/CheckboxField.tsx`) is a horizontal `Field` with a
  `Checkbox` and a sentence-case `FieldLabel`; its hint stays below the row.
- `FieldGroup` carries the accordion grid (`className="grid grid-cols-12"`, the
  merge drops `flex`).
- Not adopted: `FieldSet`/`FieldLegend` (no radio/checkbox groups),
  `FieldSeparator` and `FieldTitle` (no consumer; this also removes the need for
  `separator`).
- Not adopted: a `required` indicator, as no field is required.

## CodeBadge touch access (issue #305)

Box codes used to be exposed through `title`/`aria-label` only. `title` does not
open on touch, so mobile users could not read what `[1257]` means.

| Option                                  | Touch | Extra tab stops | Verdict                                                                      |
| --------------------------------------- | ----- | --------------- | ---------------------------------------------------------------------------- |
| Keep `title`                            | no    | none            | Rejected: the gap this issue is about.                                       |
| `Tooltip` (hover/focus)                 | no    | one per code    | Rejected: Base UI tooltips do not open on touch, and focus needs a tab stop. |
| `Popover` with a normal button          | yes   | one per code    | Rejected: dozens of tab stops per result panel.                              |
| `Popover` trigger with `tabIndex={-1}`  | yes   | none            | **Chosen.**                                                                  |
| One toggle that lists every description | yes   | one             | Rejected for now: moves the text away from the value it explains.            |

Outcome: `CodeBadge` renders a `Popover` whose trigger is a button with
`tabIndex={-1}`. Tap or click opens the description, hover opens it on desktop
(`openOnHover`), Escape or an outside tap closes it. The trigger keeps the full
`aria-label` (`<prefix> <code> — <description>`), so screen readers read the same
text as before. Keyboard-only sighted users get no new way to open the popover,
which is the same as with `title`; tab order is unchanged.

Trade-offs: the `tabIndex={-1}` buttons are extra "button" elements in screen-reader
browse mode (dozens per result panel), even though they are not tab stops. Their
long accessible names also matched the substring `NL` in
`e2e/calculator.spec.ts`, which is why that locator now uses `exact: true`.
Revisit if screen-reader testing shows the extra buttons are noisy.

## Unused generated primitives

`label` and `popover` gained consumers (`Field`, `CodeBadge`). The rest had none
and were deleted rather than restyled: `alert-dialog`, `dialog`, `progress`,
`radio-group`, `select`, `separator`, `switch`, `textarea` and `tooltip`. Add them
again from the registry when a feature needs them
(`pnpm dlx shadcn@latest add <component>`).

## Verification

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm test:e2e`.
Browser evidence for this audit covered `/` (select, Home ratio detail table,
Year comparison table), `/reference/salary-split` and `/reference/pension`,
before and after, in light and dark at 1440px and 390px.

Keyboard checks: Tab reaches every `Button` with the 2px solid outline and 2px
offset (previously none); arrow keys change the native select; Enter/Space
activate the sort headings (`aria-sort` updates) and the table toggle
(`aria-expanded`). The `ref-link-card p-0` button and `ref-list-sub p-0`
element computed to 0px padding in both themes.

### Issue #305 verification

Before and after screenshots of `/` (income and situation panels, results) in
light and dark at 1440px and 390px. Checked: `Field` spacing and label wrapping
match the old layout; invalid input shows the red label, `aria-invalid` and a
`role="alert"` message; 40 Tab presses reach no `CodeBadge` trigger; a tap
(390px, touch) or hover (1440px) on `[1257]` opens the popover in both themes
and Escape closes it. `e2e/calculator.spec.ts` now matches the NL toggle with
`exact: true`, because the badge buttons carry long accessible names.

### Issue #314 calculator hierarchy

Reused the shared `Card` for the annual/monthly/daily income summary and the
shared secondary outline `Button` variant for copy/reset. Checked the configured
`base-mira` card with `pnpm dlx shadcn@latest add card --dry-run --view` and the
[official Base UI card documentation](https://ui.shadcn.com/docs/components/base/card).
No new primitive is needed. Retained the existing custom income typography and
allocation SVG: the responsive animated currency amount and proportional tax
segments are domain presentation beyond the registry Card's layout role.
The desktop input column uses standard width/flex utilities; results fill the
remaining width, and smaller screens retain the single column.

Before/after screenshots of `/` cover light/dark at 1440px and 390px, plus 900px;
all six viewport/theme combinations have document width equal to viewport width.
Evidence is saved in `/tmp/bordertax-314/`. Keyboard checks cover result tabs,
input accordion, copy button focus/activation, and the navigation menu. Copy
writes the formatted summary; changing salary updates results; reset restores
60000; locale switching still updates the page. Both themes compute zero padding
for temporary `ref-link-card p-0` and `ref-list-sub p-0` probes while the unchanged
input retains `7px 12px` padding. Probes were removed immediately.

Validation: `pnpm lint` passed with three existing warnings in the input-panel
test and locale-audit script; `pnpm typecheck`, `pnpm test` (163 passed,
15 skipped), and `pnpm build` passed. Paraglide-compiling commands ran
sequentially with the dev server stopped. Final screenshots also cover the
production preview build.
