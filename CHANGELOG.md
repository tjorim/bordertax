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

- **Web:** Give the filing checklist its own "Filing" tab, with a "Copy checklist values" action and an entry-format column that says per row whether the portal takes whole euros, cents or a yes/no answer.
- **Web:** List Belgian code 3364 (dienstencheques) for income years up to 2024, the fixed Dutch return answers (lives in Belgium, insured for volksverzekeringen, 90% test derived from the workday split) and an optional jaaropgave arbeidskorting field shown beside the app's own recalculation.

### Fixed

- **Web:** Show Belgian codes 1285 and 1437 outside the O.2 (Netherlands) group, under general Box IV entries and movable income, and show Dutch return amounts in whole euros.
- Remove employer and place names from the interface text: the workday hint and filing checklist now speak of "your employer's" jaaropgave and workday statement, and say what to use when the employer provides no statement (calendar, badge or access records, travel receipts).

### Internal

- Rewrite the README around the supported profile, inputs, outputs and limits; document the tax model, known gaps and the income-year procedure in `docs/`; move finished migration records to `docs/archive/`.
- Add a locale-audit check that fails on employer and place names in message files.
- Rename the release workflow to `release.yml` and give it the shared job graph used by every app: `validate` → `draft`, with a read-only default token that only the draft job can write with.
- Report the built source commit alongside the app version in the health response; VPS builds receive the full commit from the shared deployment tooling (tjorim/apps#345).
- Read the MCP server version from `package.json` so releases no longer rewrite `mcp/server.ts`.

## [2026.11.1] - 2026-11-10

### Changed

- Adopt CalVer (`YYYY.M.MICRO`) for the application and MCP server versions, replacing the placeholder `0.1.0`.
  `VERSION` is now the single source of truth and CI checks that it, `package.json`, the MCP server and the
  changelog agree. Tagging `vYYYY.M.MICRO` creates a draft GitHub release from this changelog; publishing it
  deploys to GitHub Pages.

[Unreleased]: https://github.com/tjorim/bordertax/compare/v2026.11.1...HEAD
[2026.11.1]: https://github.com/tjorim/bordertax/releases/tag/v2026.11.1
