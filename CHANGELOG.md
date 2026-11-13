# Changelog

All notable changes to Bordertax are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and releases use CalVer
(`YYYY.M.MICRO`). `VERSION` is the single source of truth: `node scripts/release.mjs bump` writes it
everywhere and turns `[Unreleased]` into the next release, and `node scripts/release.mjs check` (run by CI
and before a release tag) verifies the two agree.

Entries under `### Internal` (backend, infrastructure, CI, dependencies) are left out of what the apps
show their users. Start a bullet with a scope such as `**Web:**` to limit it to one client or area; the
allowed scopes are listed in `release.config.json`, and `check` validates `[Unreleased]`.

## [Unreleased]

### Added

- **Web:** Enter gross wage exchanged for tax-free benefits (added to the Belgian wage base) and the untaxed commuting allowance. The allowance is declared at code 1254 with the own-car exemption at 1255 (490 for income year 2025, 500 for 2026) and also in box IV O.2; the filing checklist lists both codes and a new box IV O.1 entry for the Belgian-taxable wage (#443).
- **Web:** Add another annual tax statement (jaaropgave) when you had more than one employer or payroll in the year, for example after a job change or with agency and direct employment. The wages and the withheld wage tax are added up; the credits and premiums are worked out on the total, and the filing checklist lists Loon and Loonheffing per statement. One statement stays the default.
- **Web:** Split sick days by the country they were scheduled in. One "Sick days" field still covers the simple case (days you would have worked in the Netherlands); an optional expander takes the sick days on days scheduled in Belgium or elsewhere, which the Dutch return counts as days outside the Netherlands ("deel niet in NL belast"). The Belgian return still leaves all sick days out, following the ACV session material (#431).
- **Web:** Show the two workday splits side by side in the filing checklist when there are sick days: the Dutch "deel niet in NL belast" next to the Belgian-taxable share of the wage used for O.1 and O.2, why they differ, and the amount at risk of being taxed twice (or by neither country). It also warns against working out O.2 as code 1250 minus "deel niet in NL belast" (#431).
- **Web:** Enter the income tax and premiums from your actual Dutch assessment (aanslag) in its own section of the form. They replace the app's Dutch estimate in the Belgian figures, so code 1250, the O.1/O.2 split, the Belgian tax, total tax and net income are final. Both amounts are needed; the Dutch tab shows whether the estimate or your assessment is in use and the difference per item, and the filing checklist marks the Belgian figures as provisional until the assessment is entered.
- **Web:** Enable income year 2026 (Belgian assessment year 2027). All figures come from the official Belastingdienst (box 1 brackets 35.75% / 37.56% / 49.50%, algemene heffingskorting €3,115, arbeidskorting, eigenwoningforfait with the €1,350,000 threshold, mortgage deduction cap 37.56%) and FOD Financiën pages (brackets up to €16,720 / €29,510 / €51,070, belastingvrije som €11,550 with child supplements, forfait maximum €6,070); the module records the page for each table. No figure is provisional, so there is no provisional-year banner. The year also applies to the MCP server and the multi-year comparison; the default year stays 2025, and an unsupported saved year now falls back to 2026.
- **Web:** Export the inputs to a local JSON file and import them again, so a filing that takes months does not mean retyping salary and deductions. The file carries the income year, app version and a file version, holds the inputs in the same shape as the MCP `calculate_tax` input, is validated strictly on import and never leaves the browser. The Compare tab can load a saved file as situation A (for example as filed versus corrected).
- **Web:** Pin a compact result bar (net income, Dutch refund or tax, Belgian tax) below the header while editing, with a "View results" jump on small screens and a shortcut to the Filing tab.
- **Web:** Give every page its own document title, so the calculator and the reference guides can be told apart in tabs and history.
- **Web:** Give the filing checklist its own "Filing" tab, with a "Copy checklist values" action and an entry-format column that says per row whether the portal takes whole euros, cents or a yes/no answer.
- **Web:** List Belgian code 3364 (dienstencheques) for income years up to 2024, the fixed Dutch return answers (lives in Belgium, insured for volksverzekeringen, 90% test derived from the workday split) and an optional jaaropgave arbeidskorting field shown beside the app's own recalculation.

### Changed

- **Web:** Work out the arbeidskorting and algemene heffingskorting in a tax part on the full wage and a premium part on the income taxed in the Netherlands, each rounded up, as a Dutch assessment for a Belgian resident with part of the wage untaxed in the Netherlands showed. The Dutch tax drops and the Belgian code 1250 rises when part of the wage is untaxed in the Netherlands; fully Dutch cases are unchanged. This is fitted on few assessments (#473), so treat the estimate as the optimistic reading and enter the assessed figures when you have them.
- **Web:** Add the employee pension premium (code 1285) to the Belgian wage base, because the Dutch fiscal wage is after it; code 1250, the O.1/O.2 split and the Belgian tax follow (#443).
- **Web:** Say what the Belgian wage (code 1250) leaves out: a company car (the difference between the Dutch and the Belgian addition). The filing checklist lists it and the MCP `get_capabilities` limitations name it too (#443).
- **MCP:** Input schema version 2, a breaking change for agent clients (#434). Fields are named for what they are, in English, with the Belgian code kept as metadata: `grossSalary` and `withheldTaxNL` move into `annualStatements: [{ taxableWage, wageTaxWithheld }]` (one or more statements, summed), `sickDays` becomes `sickDaysNL` plus `sickDaysOutsideNL`, `socialContributions` → `healthInsurancePremium` (code 1257), `aanvullendPensioen` → `supplementaryPension` (1285), `dienstencheques` → `serviceVouchers` (3364), `roerendeVoorheffing` → `reclaimableWithholdingTax` (1437). In the results `grossIncome` → `taxableWage` (also in the comparison `delta`) and `be.socialContributionsDeducted` → `be.healthInsurancePremiumDeducted`; `result.wageTaxWithheld` is new. `residentCountry`, `civilStatus`, `belgianRegion` and `thirtyPercentRuling` are now optional with their only value as default. **Migration:** wrap the wage and withheld tax in `annualStatements`, send `sickDays` as `sickDaysNL` with `sickDaysOutsideNL: 0`, and rename the four Belgian items; the figures are unchanged for the same inputs. Old names are rejected with an error that lists every rename, `get_capabilities` reports `inputSchema.version: 2`, the renames, the defaults and the inputs per source document, and each schema field description starts with its source document. The full table is in `docs/mcp.md`.
- **Web:** Group the inputs by the document you read them from: annual tax statement, workday record, other documents (health insurer, pension or payslip, service vouchers, bank, each under its own heading), the Dutch assessment and the home. "Gross annual salary" is now "Taxable wage", and "Withholding tax already paid" is now "Reclaimable withholding tax" so it is not mistaken for the Dutch wage tax. The filing checklist's document list follows the same documents.
- **Web:** Save input files at file version 2 with the new names. Files saved at version 1 still import and are converted on the way in.
- **Web:** Store the saved settings under a new browser key, `bt-inputs-v2`. Settings saved under `bt-inputs-v1` (or the older `grensarbeider-tax-inputs-v1`) are moved over once on the next visit; the fixed resident-country, civil-status, region and 30% ruling values are no longer stored.
- **Web:** An emptied taxable-wage field now counts as zero instead of falling back to €60,000.
- **Web:** The salary-split reference page explains that a sick day counts for the country it was scheduled in on the Dutch return, and that its worked example has every sick day on a day scheduled in the Netherlands.
- **Web:** Name the Belgian assessment year (aanslagjaar, the income year plus one) wherever an income year is shown: the year selector and its hint, the year comparison, the Filing tab headings and copied checklist, the Belgian result heading, the copied summary, the reference pages and the file-import messages. "Tax year" / "Belastingjaar" is now "Income year" / "Inkomstenjaar" throughout. The Belgian tables for 2026 record that the Flemish opcentiemen of 33.257% are stated in the present tense by Vlaanderen but no official source names assessment year 2027 explicitly (no figure changed).
- **Web:** The note shown when the eigenwoningforfait exceeds the mortgage interest now says the deduction is zero and that a positive balance on a foreign main home is not added to Dutch taxable income for a qualifying non-resident (art. 7.8 lid 1 Wet IB 2001). A small effect through premium income and the algemene heffingskorting is not modelled.
- Change the shape of the calculation output (MCP `calculate_tax` and `compare_scenarios`, and the engine result): `result.nl.brackets` entries now carry numeric `from` and `to` bounds (`to` is `null` for the open top bracket) instead of a Dutch-formatted `label`, and Belgian money figures in `result.be` (plus `totalTax`, `netIncome`, the mortgage effects and the comparison deltas) are rounded to whole cents instead of carrying thirteen decimals. The cent rounding is applied once to the returned result; no Belgian tax-rounding rule is claimed. `federalTax` and `nlExemptIncome` stay for compatibility.
- **Web:** Format the Dutch bracket ranges in the active language (English and Dutch number formats) instead of always in Dutch.
- Accept the optional `assessmentIncomeTaxDue` and `assessmentPremiumsDue` inputs (together, or neither) in the strict schema, the MCP `calculate_tax` and `compare_scenarios` tools, `get_capabilities` and the input file (file version unchanged; files without them stay valid). `result.nl` stays the estimate; the new `result.nlCharge` reports the source and the difference from it.
- **Web:** Clamp long field hints to two lines with a "More" toggle, which shortens the input column.
- **Web:** Stack the filing checklist rows as field / value / source cards on narrow screens instead of scrolling the tables sideways.
- **Web:** Wrap the result tabs onto a second row on narrow screens so none are hidden off-screen, and show the app name in the collapsed header.
- **Web:** Show the income year, the ACV session date and the Belastingdienst source in one fixed line under the title of both reference pages. The Dutch rate table, the algemene heffingskorting and arbeidskorting maxima and the premium ceiling on the salary-split page are now taken from the same income year 2026 parameters as the calculator, and every figure is formatted for the selected language. The arbeidskorting now reads "zero at income ≥ €132,920", as in the 2026 parameters (the page had €132,290).
- **Web:** Keep the reference figures (pension amounts, AOW ages, ZIV bands, the worked example) out of the translation files: they are typed once in `src/tax/reference`, marked as coming from the ACV session, and the messages only hold prose with parameters.

### Fixed

- **Web:** Wrap the section headers in the filing checklist on narrow screens instead of cutting off the Box IV O.2 title.
- **Web:** With no workdays entered the Dutch result no longer charges full premiums and applies the arbeidskorting and algemene heffingskorting on income that is not there: the Dutch and Belgian figures are all zero, the result carries `noWorkdays: true` and the results show a note asking for workdays. Zero workdays stay valid input.
- **Web:** Show a short note in the Belgian result and the filing checklist when the supplementary pension and withholding tax reductions (code 1437) exceed the federal tax, instead of clamping at zero silently; the unused part is returned as `result.be.federalReductionsUnused`.
- **Web:** The note under the home-working chart no longer says an income statement from the Belgian tax authority is required for income year 2026; it now follows the selected year, like the mortgage result (#336).
- **Web:** The mortgage interest deduction no longer lists an income statement from the Belgian tax authority as a requirement for income year 2026. The Belastingdienst abolished that condition from 2026 (the tax authority can still ask for proof), so the assumptions list now says so; income years up to 2025 are unchanged. Re-checked against the official sources: the deduction rate caps, the eigenwoningforfait tables and the 90% test for 2020–2026 needed no correction.
- **Web:** Apply the algemene heffingskorting to Belgian residents who are insured in the Netherlands. The Dutch refund, code 1250 and the Belgian estimate were too low by that credit for wages below the phase-out end.
- **Web:** Split the code 1250 amount into box IV O.1 and O.2 as in the FOD guideline: Dutch premiums come off before the workday fraction, and only the Dutch income tax is taken from the exempt part. The salary-split reference page states the same formula.
- Correct the 2024 over-AOW algemene heffingskorting and arbeidskorting tables to the Belastingdienst figures.
- **Web:** Show Belgian codes 1285 and 1437 outside the O.2 (Netherlands) group, under general Box IV entries and movable income, and show Dutch return amounts in whole euros.
- Remove employer and place names from the interface text: the workday hint and filing checklist now speak of "your employer's" jaaropgave and workday statement, and say what to use when the employer provides no statement (calendar, badge or access records, travel receipts).

### Removed

- **Web:** Remove the disabled 30% ruling checkbox for Belgian residents; the limitation is now stated in the page footer.

### Internal

- Prove that input schema version 2 changes no figure: `tests/tax/migration.test.ts` migrates version 1 inputs for every income year (sick days, deductions, mortgage, assessment figures, zero workdays) and checks the headline results against the version 1 engine to the cent; when the change was made the complete results of 91 calculations and 7 comparisons were also compared field by field and differed only in the renamed fields. The ACV golden tests pass to the cent with only the input names changed.
- Adopt `FieldSet` and `FieldLegend` from the registry `field` component to group inputs per source document (recorded in `docs/shadcn-adoption-audit.md`).
- Add golden tests for the ACV telework-session worked examples (income year 2025, with and without sick days) and document that ACV's premium/tax split differs from the Belastingdienst split by about €206.
- Report `incomeTaxDue` and `premiumsDue` in the Dutch result (the credits are split into a tax part and a premium part in proportion to the first-bracket rates); `beIncome` is now the O.1 amount per the FOD guideline.
- Rewrite the README around the supported profile, inputs, outputs and limits; document the tax model, known gaps and the income-year procedure in `docs/`; move finished migration records to `docs/archive/`.
- Add a locale-audit check that fails on employer and place names in message files.
- Rename the release workflow to `release.yml` and give it the shared job graph used by every app: `validate` → `draft`, with a read-only default token that only the draft job can write with.
- Report the built source commit alongside the app version in the health response; VPS builds receive the full commit from the shared deployment tooling (tjorim/apps#345).
- Read the MCP server version from `package.json` so releases no longer rewrite `mcp/server.ts`.
- Restructure the yearly tax parameters into one module per income year under `src/tax/years/` (#435): repeated values (over-AOW brackets, premium ceiling and rates, unchanged Belgian rates, the eigenwoningforfait bands) are declared once, every table records its sources and what was verified, and `VALID_YEARS` and `TaxYear` derive from the year registry. No tax figure changes; a snapshot test pins every existing value and new integrity tests check brackets, credit curves and tables. The unfinished commented-out 2026 block is removed.
- Clean up leftovers in the tax engine without changing any result (#440): derive the comparison's input keys from the schema, drop `?? 0` guards on required fields, remove the `vrijgesteldFrac` duplicate of `nlFractionBelgianMethod` and the unused `premium_base_unchanged` mortgage assumption (and its message keys), make the Dutch engine throw for an unsupported income year like the Belgian one instead of falling back to 2025, and correct stale header comments. Verified against a before/after snapshot of results across 2020–2025, Belgian and Dutch residents, with and without the mortgage scenario.
- **Web:** Store the saved inputs under a new browser key, `bt-inputs-v1`; inputs saved under the old `grensarbeider-tax-inputs-v1` key are moved over once on the next visit.
- **Web:** Remove the unreachable resident-country, civil-status and region selectors from the input panel (their constants still allow only one value), along with their message keys.

## [2026.11.1] - 2026-11-10

### Changed

- Adopt CalVer (`YYYY.M.MICRO`) for the application and MCP server versions, replacing the placeholder `0.1.0`.
  `VERSION` is now the single source of truth and CI checks that it, `package.json`, the MCP server and the
  changelog agree. Tagging `vYYYY.M.MICRO` creates a draft GitHub release from this changelog; publishing it
  deploys to GitHub Pages.

[Unreleased]: https://github.com/tjorim/bordertax/compare/v2026.11.1...HEAD
[2026.11.1]: https://github.com/tjorim/bordertax/releases/tag/v2026.11.1
