# Adding an income year

Rates are data, so a new year is mostly a new entry in `src/tax/params.ts`. Do the steps in order and keep the sources in the code comments, as the existing years do. The method itself is described in [tax-model.md](tax-model.md).

1. **Collect official figures first.** Dutch Box 1 brackets, premium rate and ceiling, algemene heffingskorting and arbeidskorting tables (Belastingdienst) and, for Belgium, brackets, belastingvrije som with child supplements, the professional-expenses forfait, and the federal/regional rates (FOD Financiën; Belgian assessment year is the income year + 1). Do not interpolate from earlier years.
2. **Add the year to `VALID_YEARS`** in `src/tax/constants.ts`. `TaxYear`, the schema, the year selector, the year comparison and `getCapabilities()` derive from it. TypeScript will then flag every record keyed by `TaxYear`.
3. **Add a `TAX_PARAMS[year]` entry** in `src/tax/params.ts` with `nl.under`, `nl.over`, `nl.mortgageDeductionRateCap` and `be`. Express Dutch brackets as income-tax-only rates (combined rate minus the premium rate). Set `serviceVoucherReductionRate` to the value in force for that year, and `extraPerChildAbove4` to a number or `null` (`null` limits the form to the children the table covers).
4. **Add the eigenwoningforfait** for the year to `EIGENWONINGFORFAIT`, with its source, and record it in [hypotheekrenteaftrek-rules.md](hypotheekrenteaftrek-rules.md).
5. **Update year-specific text.** Messages that mention a year or a law change (for example the dienstencheques hints) live in `messages/en.json` and `messages/nl.json`; keep both locales in step (`pnpm check-message-parity`).
6. **Add tests** in `tests/tax/` for the new year: at least one bracket boundary on each side, credits at their phase-out points, the BE allowance with and without children, and the mortgage forfait. Update year lists in existing tests (`capabilities`, `strict`, `mortgage`) and the multi-year comparison test.
7. **Check against a real assessment if you can.** Compare income tax, premiums, credits, and the Belgian figures with an actual aanslag and record what matched in the verification table of [tax-model.md](tax-model.md). Say so when a year is taken only from published tables.
8. **Run** `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` sequentially (Paraglide writes generated files), then update `CHANGELOG.md` under `[Unreleased]` and the supported-years statements in `README.md` and `tax-model.md`.

The commented-out 2026 block in `params.ts` is unfinished: its arbeidskorting stages are provisional, so do not enable it without verifying them.
