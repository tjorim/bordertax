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

- **Web:** Enable income year 2026 (Belgian assessment year 2027). All figures come from the official Belastingdienst (box 1 brackets 35.75% / 37.56% / 49.50%, algemene heffingskorting €3,115, arbeidskorting, eigenwoningforfait with the €1,350,000 threshold, mortgage deduction cap 37.56%) and FOD Financiën pages (brackets up to €16,720 / €29,510 / €51,070, belastingvrije som €11,550 with child supplements, forfait maximum €6,070); the module records the page for each table. No figure is provisional, so there is no provisional-year banner. The year also applies to the MCP server and the multi-year comparison; the default year stays 2025, and an unsupported saved year now falls back to 2026.
- **Web:** Export the inputs to a local JSON file and import them again, so a filing that takes months does not mean retyping salary and deductions. The file carries the income year, app version and a file version, holds the inputs in the same shape as the MCP `calculate_tax` input, is validated strictly on import and never leaves the browser. The Compare tab can load a saved file as situation A (for example as filed versus corrected).
- **Web:** Pin a compact result bar (net income, Dutch refund or tax, Belgian tax) below the header while editing, with a "View results" jump on small screens and a shortcut to the Filing tab.
- **Web:** Give every page its own document title, so the calculator and the reference guides can be told apart in tabs and history.
- **Web:** Give the filing checklist its own "Filing" tab, with a "Copy checklist values" action and an entry-format column that says per row whether the portal takes whole euros, cents or a yes/no answer.
- **Web:** List Belgian code 3364 (dienstencheques) for income years up to 2024, the fixed Dutch return answers (lives in Belgium, insured for volksverzekeringen, 90% test derived from the workday split) and an optional jaaropgave arbeidskorting field shown beside the app's own recalculation.

### Changed

- **Web:** Clamp long field hints to two lines with a "More" toggle, which shortens the input column.
- **Web:** Stack the filing checklist rows as field / value / source cards on narrow screens instead of scrolling the tables sideways.
- **Web:** Wrap the result tabs onto a second row on narrow screens so none are hidden off-screen, and show the app name in the collapsed header.

### Fixed

- **Web:** Apply the algemene heffingskorting to Belgian residents who are insured in the Netherlands. The Dutch refund, code 1250 and the Belgian estimate were too low by that credit for wages below the phase-out end.
- **Web:** Split the code 1250 amount into box IV O.1 and O.2 as in the FOD guideline: Dutch premiums come off before the workday fraction, and only the Dutch income tax is taken from the exempt part. The salary-split reference page states the same formula.
- Correct the 2024 over-AOW algemene heffingskorting and arbeidskorting tables to the Belastingdienst figures.
- **Web:** Show Belgian codes 1285 and 1437 outside the O.2 (Netherlands) group, under general Box IV entries and movable income, and show Dutch return amounts in whole euros.
- Remove employer and place names from the interface text: the workday hint and filing checklist now speak of "your employer's" jaaropgave and workday statement, and say what to use when the employer provides no statement (calendar, badge or access records, travel receipts).

### Removed

- **Web:** Remove the disabled 30% ruling checkbox for Belgian residents; the limitation is now stated in the page footer.

### Internal

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
