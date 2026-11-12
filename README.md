# 🇧🇪🇳🇱 Grensarbeider Belastingcalculator

Bordertax estimates the Dutch and Belgian income tax of a Belgian resident who works for a Dutch employer and splits their working days between the Netherlands, Belgium (home working) and, optionally, other countries. It runs entirely in the browser; nothing you enter is sent anywhere.

## Who it is for

One supported profile: a **single Belgian resident in the Flemish region with one Dutch employer, income years 2020–2025**. Other situations (Dutch residents, married or cohabiting taxpayers, other regions, several employers, partial years) are not modelled. Income year 2026 is not enabled yet.

## What goes in

- Income year, age category (under/over AOW age), dependent children and municipal tax rate
- Gross annual salary and, optionally, the Dutch loonheffing already withheld
- Optionally, the income tax and premiums on your actual Dutch assessment (aanslag), which replace the app's Dutch estimate in the Belgian figures
- Workdays in the Netherlands, in Belgium (home working), in other countries and sick days
- Optional Belgian items: social contributions, supplementary pension, dienstencheques, roerende voorheffing
- Optional home scenario: mortgage interest, ownership share, home value and income outside the Netherlands

Inputs are kept in your browser's local storage so they survive a reload.

## What comes out

- **Summary, Dutch and Belgian tabs** with tax, credits, net income and effective rates
- **Mortgage scenario** with the Dutch saving, the extra Belgian tax and the eligibility checks (hypotheekrenteaftrek, eigenwoningforfait)
- **Scenario comparison** of a second set of inputs, with the difference attributed to workdays, income, mortgage and other changes
- **Year comparison** across the supported income years and a **home-working ratio chart**
- **Filing checklist** with the figures to copy into the Dutch return and the Belgian return (code 1250, section O.2 and related codes)
- **Reference pages** for the salary split (FOD method, ACV example) and pensions, in Dutch and English

## How it calculates

The workday split decides how much salary the Netherlands taxes. The Dutch tax (the app's estimate, or the figures from your Dutch assessment once you enter them) is then treated as paid, code 1250 on the Belgian return is the salary less that tax, and Belgium applies the exemption with progression to the Dutch-sourced part, plus municipal tax on the exempt income. The formulas, rounding, sources and verification status are in [docs/tax-model.md](docs/tax-model.md), including the [known gaps](docs/tax-model.md#known-gaps) against the official guidelines. Treat results as estimates.

## Not modelled

- The 30%-regeling: it is not available to Belgian residents, so the option is hidden.
- The special social security contribution (BBSZ), Belgian home benefits and regional supplements beyond the Flemish opcentiemen.
- Partners, other income, partial years and several employers.
- The actual Dutch assessment: Belgian figures start from the _calculated_ Dutch tax.

This tool is a **simplified estimate** and does not replace professional tax advice.

## Data sources

- Dutch brackets and credits: [Belastingdienst](https://www.belastingdienst.nl)
- Belgian brackets and belastingvrije som: [FOD Financiën](https://fin.belgium.be)
- Salary-split method: ACV telework information session (`public/docs/`)
- Belgium–Netherlands tax treaty: official government publications

## Getting started

The project uses pnpm at the version pinned in `package.json` (see [docs/toolchain.md](docs/toolchain.md)).

```bash
pnpm install
pnpm dev        # development server
pnpm build      # production build
pnpm test       # unit tests
```

## Local AI integration

An optional, stateless [MCP server](docs/mcp.md) exposes the shared tax engine
to local AI clients over stdio. Run `pnpm mcp:build` to build it. It adds no
backend or persistence to the client-side web app.
A separate [hosted HTTP endpoint](docs/mcp.md#hosted-endpoint) is planned for remote clients, pending deployment in tjorim/apps.

## Architecture

### Interface

The interface uses Tailwind CSS v4 (unprefixed utilities), Base UI behaviour
primitives, owned shadcn `base-mira` components and Lucide SVG icons. Semantic
light/dark tokens live in `src/styles/tokens.css`; the root `data-theme`
attribute is set by shared boot-time and runtime theme logic in `src/theme.ts`.
There are no Bootstrap dependencies, global widget styles or icon fonts.

Components live in `src/components/ui`. Use `cn` from `src/lib/utils.ts` and
follow [AGENTS.md](AGENTS.md) when adding or changing UI. The complete icon
mapping and outline decisions are in [docs/archive/icon-migration.md](docs/archive/icon-migration.md).

Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` before submitting
changes. Stop the dev server and run generation/build checks sequentially;
Paraglide writes generated modules and declarations during these commands.

Browser smoke tests (Playwright, plus an axe WCAG scan of every route in both
locales, themes and at desktop/mobile widths) live in `e2e/`. Run `pnpm build`
first, then `pnpm test:e2e`; it serves the build with `vite preview`. Install
the browser once with `pnpm exec playwright install chromium`.

### Client-side only

Bordertax has no backend, database or account; every calculation runs in the browser. Before adding any operation with an external side effect (saved calculations, form submission, payments), address retry, duplicate-delivery and timeout behaviour, and choose a retry-safety strategy that fits the operation (natural-key upsert, client-generated IDs, optimistic concurrency, or replay keys only as a last resort, with bounded retention and scheduled cleanup).

## Adding an income year

See [docs/adding-an-income-year.md](docs/adding-an-income-year.md).

## UI maintenance

See [UI dependency and component maintenance](docs/ui-maintenance.md) for package updates, component provenance, upstream review commands and validation.

Toolchain versions and coordinated rollout: [Node and pnpm toolchain](docs/toolchain.md).
