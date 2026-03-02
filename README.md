# 🇧🇪🇳🇱 Grensarbeider Belastingcalculator

A standalone web app for Belgian residents working for Dutch employers (cross-border / grensarbeider scenario). Estimates Dutch Box 1 income tax and Belgian personenbelasting based on your workday split.

## Features

- **NL Box 1 income tax** — 2024/2025/2026 brackets (under/over AOW age)
- **Heffingskortingen** — Algemene heffingskorting + arbeidskorting (full build-up/phase-out tables)
- **30%-regeling** — Optional 30% expat ruling support
- **Belgische personenbelasting** — Exemption-with-progression (vrijstelling met progressievoorbehoud) per the BE-NL tax treaty
- **Gemeentebelasting** — Configurable communal tax rate per municipality
- **Belastingvrije som** — Includes additional allowance for dependent children
- **Werkdagensplitsing** — Workday split between NL office days and BE home-office days
- **Live results** — NL tab, BE tab, and a net income summary with progress bar

## Data Sources

- Dutch (NL) brackets and credits: [Belastingdienst](https://www.belastingdienst.nl)
- Belgian (BE) brackets and belastingvrije som: [FOD Financiën](https://fin.belgium.be)
- BE-NL tax treaty: IBFD / official government publications

> **Note:** 2026 NL rates are provisional (based on 2025) until official Belastingdienst tables are published. 2026 BE rates are draft proposals and may change. Always consult a tax advisor for your final return.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Caveats

- Civil status and Belgian region fields are present but not yet used in the calculation.
- Special social security contribution (BBSZ) and regional Belgian supplements are not included.
- This tool is a **simplified estimate** — it does not replace professional tax advice.
