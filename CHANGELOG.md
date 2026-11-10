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

### Internal

- Read the MCP server version from `package.json` so releases no longer rewrite `mcp/server.ts`.

## [2026.11.1] - 2026-11-10

### Changed

- Adopt CalVer (`YYYY.M.MICRO`) for the application and MCP server versions, replacing the placeholder `0.1.0`.
  `VERSION` is now the single source of truth and CI checks that it, `package.json`, the MCP server and the
  changelog agree. Tagging `vYYYY.M.MICRO` creates a draft GitHub release from this changelog; publishing it
  deploys to GitHub Pages.

[Unreleased]: https://github.com/tjorim/bordertax/compare/v2026.11.1...HEAD
[2026.11.1]: https://github.com/tjorim/bordertax/releases/tag/v2026.11.1
