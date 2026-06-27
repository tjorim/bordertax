<analysis>
Here is my detailed review of the current `bordertax` codebase (React 19 + TypeScript, Vite, react-bootstrap, TanStack Form/Router/Table, Zod, Paraglide i18n). It is a well-built, well-tested cross-border (NL/BE) tax calculator. The tax engine is cleanly separated, year parameters are isolated to one file, and there is solid test coverage. The findings below are refinements, not rescues — most are about removing duplication, fixing display/calc reconciliation, and tightening consistency.

### 1. Code Organization & Structure
- **Strong baseline.** `src/tax/*` (pure calculation), `src/components/*` (presentation), `src/pages/*` (routes) are cleanly separated. `params.ts` is the single source of truth for yearly rates, as documented — excellent.
- **Workday-fraction logic is duplicated in three places.** The NL income fraction is computed in `tax/nl.ts:68-69`, again in `tax/index.ts:20-28`, and the denominators are recomputed a third time inside `SummaryResult.tsx` (`totalForNLMethod`/`totalForBEMethod`). `tax/be.ts:61-85` independently recomputes `beFraction` and `vrijgesteldFrac`. Four call sites, same arithmetic, each with its own `?? 0` guards — a prime candidate for a single shared helper in `tax/workdays.ts`.
- **`getTotalWorkdays` semantics are inconsistent with the engine.** `tax/workdays.ts` excludes sick days, but `tax/nl.ts` includes them in its denominator. The same helper is reused in `InputPanel` and `SummaryResult` for different conceptual totals, which is easy to misread.
- **`InputPanel.tsx` is ~600 lines** dominated by copy-pasted numeric `Form.Field`/`Form.Control` blocks (gross salary, withheld tax, 4 day fields, 4 Belgian deduction fields — ~9 near-identical ~25-line blocks). A small reusable `NumberField` form-field component would cut the file roughly in half and centralize the `valueAsNumber`/`NaN` handling that currently varies subtly between fields (`Number(e.target.value) || 0` vs `valueAsNumber` + NaN check).
- **`styles.css` is a single 2,389-line file.** Not urgent, but splitting by feature (summary, wfh-chart, reference, workday-bar) would improve navigability.

### 2. Code Quality & Best Practices
- **Magic numbers in `tax/be.ts`.** `0.25` (belastingvrije-som reduction rate, be.ts:48), `0.3` (pension reduction, :115), `0.2` (dienstencheques reduction, :116), and `0.7` (30%-ruling residual in `nl.ts`) are unnamed inline literals. These are policy rates that can change; they belong as named constants (and ideally in `params.ts` since they are year-scoped in principle).
- **Untyped error plumbing.** `fieldError()` in `InputPanel.tsx:31-40` casts through `unknown[]` with nested `as` assertions to extract messages from TanStack Form/Zod errors. It works but is fragile and untested; it should be extracted and unit-tested.
- **`TaxFormApi` uses `any`** (InputPanel.tsx:18-19, eslint-disabled). This is a known TanStack Form typing limitation; acceptable, but worth a comment pointing to the upstream issue so it isn't "fixed" naively later.
- **Theme resolution is duplicated.** The inline boot script in `index.html` re-implements the light/dark resolution that also lives in `theme.ts:applyTheme`. Two sources of truth that can silently drift (the inline script collapses `"auto"` differently). The logic that *can't* be shared (it must run pre-bundle) should at least be documented as a deliberate mirror of `theme.ts`.
- **README is out of date.** It advertises "2024/2025/**2026** brackets" and "2026 NL rates are provisional," but `VALID_YEARS` stops at 2025 and the 2026 block in `params.ts` is commented out. Users reading the README will expect a year the UI doesn't offer.
- **9 unused i18n keys** (`app_title`, `alert_2026_provisional`, `summary_title`, `wfh_threshold_{10,25,49}_hint`, `ref_nav_back_to_calculator`, `ref_ss_nav_pension_link`, `ref_pension_nav_ss_link`) exist in both `en.json` and `nl.json` with zero `src` references. (i18n parity is otherwise perfect: 585/585.) Dead translation strings drift over time; prune or wire them.
- **Test coverage is good** for the tax engine and components, but there is no test asserting that the BE result breakdown rows reconcile to the displayed total (see UI finding below), which is exactly the kind of regression that slips through.

### 3. UI/UX
- **BE result breakdown does not sum to the total (correctness-of-display bug).** `BEResult.tsx` "Final calculation" shows `Federal tax` (`saldoFederaal`) + `Municipal tax` (`communalTax`) then `Tax payable` (`netTaxBE`). But `netTaxBE = saldoFederaal + saldoGewestelijk + communalTax + communalTaxOnVrijgesteld` (be.ts:135). The **regional** portion (`saldoGewestelijk`) and the communal-on-exempt portion are silently omitted, so the visible rows do not add up to the bold total. This undermines trust in a tax tool.
- **Misleading "× BE fraction" row.** `BEResult.tsx` renders a row labelled `× {belgian_fraction} ({beFraction}%)` whose value is `totaleBelasting`, implying `totaleBelasting = omTeSlane × beFraction`. The actual derivation runs through `vrijstellingReduction → hoofdsom → federal/regional split → reductions`, so the displayed multiplication does not reconcile numerically. The label should describe the real step or be split into the actual intermediate rows.
- **Social-security warning uses a different fraction than the engine.** `InputPanel.tsx:48` computes `beFraction = daysWorkedBE / totalWorkdays` (BE only) and drives the >50% / 25–49% kaderakkoord alerts off it, while the tax engine (`be.ts:61`) and the WFH chart use `(daysWorkedBE + daysWorkedOther) / total`. A user with "other-country" days can see the alert state disagree with the WFH-chart zone for the same inputs.
- **WFH SVG chart accessibility.** The chart carries only a static `aria-label`; the live readout bar (net/NL/BE figures on hover/scrub) is not exposed to assistive tech. Adding `aria-live="polite"` to the readout and a concise text summary would help. The data table fallback is a good mitigation already.
- **Persisted inputs intentionally exclude salary/day counts** (only the `PersistedInputs` subset is stored — sensible for privacy), but this is undocumented, so users may be surprised that income resets on reload. A one-line note or tooltip would close the expectation gap.
- **Consistency:** result tables mix `fmtExact`/`pctExact` (NL/BE detail) with `fmt`/`pct` (summary/comparison). This is defensible (detail vs overview) but should be a documented convention so it stays intentional.
</analysis>

# Optimization Plan

> Scope rules: every step preserves current behaviour (except where a step explicitly fixes an incorrect display), touches a small number of files, and is independently shippable with green `pnpm typecheck && pnpm lint && pnpm test`. Steps are ordered so later steps can build on earlier shared helpers, but each is atomic.

## Code Structure & Organization

- [x] **Step 1: Centralize workday-fraction math in `tax/workdays.ts`**
  - **Task**: Add pure helpers `getWorkdayTotals(inputs)` and `getNLFractions(inputs)` returning `{ nlFractionDutchMethod, nlFractionBelgianMethod, beFraction, vrijgesteldFrac, totalWithSick, totalNoSick }`, encapsulating every `?? 0` guard and divide-by-zero check currently inlined. Keep `getTotalWorkdays`/`getMaxDaysInYear` but document that `getTotalWorkdays` excludes sick days. Do not change any numeric output.
  - **Files**:
    - `src/tax/workdays.ts`: add the two helper functions + JSDoc.
    - `tests/tax/workdays.test.ts`: add cases covering zero-days, sick-day inclusion/exclusion, and other-country days.
  - **Step Dependencies**: None.
  - **User Instructions**: None.
  - **Success Criteria**: New helpers return values identical to the existing inline calculations; `pnpm test` green.

- [x] **Step 2: Consume the shared fraction helpers in the engine**
  - **Task**: Replace the inline fraction arithmetic in `tax/nl.ts`, `tax/index.ts`, and `tax/be.ts` with calls to the Step 1 helpers. Output of `calculate()` must be byte-for-byte unchanged (assert via existing tests).
  - **Files**:
    - `src/tax/nl.ts`: use `getNLFractions` for `nlFraction`.
    - `src/tax/index.ts`: use helpers for `nlFractionDutchMethod`/`nlFractionBelgianMethod`.
    - `src/tax/be.ts`: use helpers for `beFraction`/`vrijgesteldFrac`.
  - **Step Dependencies**: Step 1.
  - **Success Criteria**: `tests/tax/*` all pass unchanged; no duplicated fraction expressions remain (grep for `daysWorkedNL +` returns only `workdays.ts`).

- [x] **Step 3: Reuse the shared helper in `SummaryResult` sourcing table**
  - **Task**: Replace the locally recomputed `totalForNLMethod`/`totalForBEMethod` IIFE denominators in `SummaryResult.tsx` with the Step 1 helper so the "—" empty-state logic and percentages share one source of truth.
  - **Files**:
    - `src/components/SummaryResult.tsx`: swap inline math for helper call.
  - **Step Dependencies**: Step 1.
  - **Success Criteria**: `tests/components/SummaryResult.test.tsx` passes; sourcing percentages unchanged on screen.

- [x] **Step 4: Extract a reusable numeric form field for `InputPanel`**
  - **Task**: Create a `NumberField` (and thin `CurrencyField` wrapper) component encapsulating the repeated `Form.Label`/`Form.Control[type=number]`/`Form.Text` hint/`Form.Control.Feedback` pattern, with one consistent value parser (`valueAsNumber` + NaN→0). Refactor the ~9 duplicated numeric blocks in `InputPanel.tsx` to use it. No visual or behavioural change.
  - **Files**:
    - `src/components/fields/NumberField.tsx`: new component (+ `fieldError` moved here from InputPanel).
    - `src/components/InputPanel.tsx`: replace duplicated blocks.
    - `tests/components/InputPanel.test.tsx`: adjust queries if needed; add a `fieldError` unit test.
  - **Step Dependencies**: None.
  - **Success Criteria**: `InputPanel.tsx` shrinks materially; all existing InputPanel tests pass; identical DOM ids/labels preserved.

## Code Quality & Best Practices

- [x] **Step 5: Name the Belgian policy-rate magic numbers**
  - **Task**: Introduce named constants for the belastingvrije-som reduction rate (`0.25`), pension reduction (`0.3`), dienstencheques reduction (`0.2`), and the 30%-ruling taxable residual (`0.7`). Place them in `tax/constants.ts` (or extend `BEYearParams` if you prefer them year-scoped) and reference from `be.ts`/`nl.ts`. No numeric change.
  - **Files**:
    - `src/tax/constants.ts`: add constants with source comments.
    - `src/tax/be.ts`: replace `0.25`/`0.3`/`0.2`.
    - `src/tax/nl.ts`: replace `0.7`.
  - **Step Dependencies**: None.
  - **Success Criteria**: No bare policy-rate literals remain in `be.ts`/`nl.ts`; all tax tests pass.

- [x] **Step 6: Prune (or wire up) the 9 unused i18n keys**
  - **Task**: Remove the 9 keys with zero `src` references from both locale files — `app_title`, `summary_title`, `wfh_threshold_{10,25,49}_hint`, `ref_nav_back_to_calculator`, `ref_ss_nav_pension_link`, `ref_pension_nav_ss_link`. For `alert_2026_provisional`, prefer to **keep but wire it up** in Step 9 (so leave it if doing Step 9, otherwise remove). Keep `en.json`/`nl.json` at perfect parity.
  - **Files**:
    - `messages/en.json`: delete unused keys.
    - `messages/nl.json`: delete the same keys.
  - **Step Dependencies**: None (coordinate with Step 9 re `alert_2026_provisional`).
  - **Success Criteria**: `pnpm paraglide:compile` succeeds; key counts still equal; no runtime references break.

- [x] **Step 7: Document the theme-resolution mirror**
  - **Task**: The inline `index.html` boot script must stay (it runs before the bundle to avoid a flash), but add a comment in both `index.html` and `theme.ts:applyTheme` noting they implement the same resolution and must be kept in sync, and align the `"auto"` handling so they cannot diverge.
  - **Files**:
    - `index.html`: comment + align auto/stored handling with `theme.ts`.
    - `src/theme.ts`: cross-reference comment.
  - **Step Dependencies**: None.
  - **Success Criteria**: Theme on first paint matches post-hydration theme for stored `light`/`dark`/`auto`; no FOUC regression.

- [x] **Step 8: Refresh the README to match shipped years**
  - **Task**: Update the README feature list and note to reflect the actually-enabled `VALID_YEARS` (2020–2025) instead of "2024/2025/2026", and move the 2026 line into a clearly-marked "planned / commented-out" note so it matches `params.ts`.
  - **Files**:
    - `README.md`: correct year coverage and the provisional-2026 note.
  - **Step Dependencies**: None (align with Step 9 if 2026 gets enabled).
  - **Success Criteria**: README year claims match `VALID_YEARS` and the UI year dropdown.

## UI/UX & Correctness-of-Display

- [ ] **Step 9 (optional, decision-gated): Enable income year 2026**
  - **Task**: If the maintainer wants 2026 live, uncomment the 2026 block in `params.ts`, add `2026` to `VALID_YEARS`, and surface `alert_2026_provisional` in the UI when `year === 2026`. Otherwise skip and ensure Steps 6/8 treat 2026 as not-shipped.
  - **Files**:
    - `src/tax/constants.ts`: add `2026` to `VALID_YEARS`.
    - `src/tax/params.ts`: uncomment 2026 entry.
    - `src/App.tsx` (or `InputPanel.tsx`): render `m.alert_2026_provisional()` when 2026 selected.
    - `tests/tax/*`: extend year-parametrized cases to include 2026.
  - **Step Dependencies**: Coordinate with Steps 6 and 8.
  - **User Instructions**: Confirm whether 2026 figures are final enough to publish before enabling.
  - **Success Criteria**: Year 2026 selectable, calculates, and shows the provisional banner; tests cover it.

- [x] **Step 10: Make the BE final breakdown reconcile to the total**
  - **Task**: In `BEResult.tsx` "Final calculation", show the full composition of `netTaxBE`: federal saldo, **regional saldo** (`saldoGewestelijk`), municipal tax on taxable income, and municipal tax on the exempt portion (`communalTaxOnVrijgesteld`) — so the rows visibly sum to `Tax payable`. Add new i18n keys for any missing labels (both locales).
  - **Files**:
    - `src/components/BEResult.tsx`: add the missing rows.
    - `messages/en.json` / `messages/nl.json`: add `be_regional_tax`, `be_municipal_tax_on_exempt` (or similar) in parity.
    - `tests/components/BEResult.test.tsx`: assert displayed rows sum to `netTaxBE`.
  - **Step Dependencies**: None.
  - **Success Criteria**: Federal + regional + municipal(+exempt) rows equal the bold total for representative inputs; new test passes.

- [x] **Step 11: Fix the misleading "× BE fraction" row**
  - **Task**: Replace the `× {belgian_fraction} ({beFraction}%)` → `totaleBelasting` row in `BEResult.tsx` with rows that reflect the real derivation (`omTeSlane` → `vrijstellingReduction` → `hoofdsom` → federal/regional split), or relabel it accurately so the displayed value reconciles with the arithmetic. Coordinate visually with Step 10.
  - **Files**:
    - `src/components/BEResult.tsx`: relabel/restructure the progression row.
    - `messages/en.json` / `messages/nl.json`: adjust/add labels in parity.
  - **Step Dependencies**: Step 10 (do together to avoid double-editing the same table).
  - **Success Criteria**: No row implies an arithmetic relationship the numbers don't satisfy; BE tests pass.

- [x] **Step 12: Align the social-security warning fraction with the engine**
  - **Task**: In `InputPanel.tsx`, drive the >50% and 25–49% kaderakkoord alerts off `(daysWorkedBE + daysWorkedOther) / total` (the engine/WFH-chart definition) instead of `daysWorkedBE / total`, using the Step 1 helper. This removes the disagreement between the input alert and the WFH-chart zone.
  - **Files**:
    - `src/components/InputPanel.tsx`: use shared `beFraction`.
    - `tests/components/InputPanel.test.tsx`: add a case with `daysWorkedOther` that crosses the 50% threshold.
  - **Step Dependencies**: Step 1.
  - **Success Criteria**: Alert state matches the WFH-chart zone for identical inputs including other-country days.

- [x] **Step 13: Improve WFH-chart accessibility**
  - **Task**: Add `aria-live="polite"` (and `role="status"`) to the `bt-wfh-readout` bar so screen readers announce the net/NL/BE figures as the user scrubs, and add a concise `<title>`/`aria-describedby` summary to the SVG. Keep the existing data-table fallback.
  - **Files**:
    - `src/components/WFHRatioChart.tsx`: add ARIA attributes + SVG `<title>`.
  - **Step Dependencies**: None.
  - **Success Criteria**: Readout updates are announced; no visual change; lint/tests pass.

- [x] **Step 14: Surface the "income not persisted" expectation**
  - **Task**: Add a short hint (tooltip or `Form.Text`) near the income section, and a code comment on `PersistedInputsSchema`, clarifying that salary/day counts are intentionally not stored (privacy) and reset to defaults on reload.
  - **Files**:
    - `src/components/InputPanel.tsx`: hint text (new i18n key in both locales).
    - `src/tax/schema.ts`: comment on `PersistedInputsSchema`.
    - `messages/en.json` / `messages/nl.json`: add the hint key in parity.
  - **Step Dependencies**: None.
  - **Success Criteria**: Users see why income resets; key parity maintained.

## Next Logical Step
After Steps 1–8 (zero-risk refactors + doc fixes) land and CI is green, tackle the display-correctness cluster (Steps 10–12) together in a single focused PR since they all touch `BEResult.tsx`/`InputPanel.tsx` and the message files — this keeps i18n edits atomic and lets reviewers verify the "rows sum to total" invariant in one place. Decide Step 9 (2026) with the maintainer before the README/i18n steps finalize. A follow-up beyond this plan would be splitting `styles.css` by feature and adding a lightweight visual/interaction test for the WFH chart.
