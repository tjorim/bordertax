# 🇧🇪🇳🇱 Grensarbeider Belastingcalculator

A standalone web app for Belgian residents working for Dutch employers (cross-border / grensarbeider scenario). Estimates Dutch Box 1 income tax and Belgian personenbelasting based on your workday split.

## Features

- **NL Box 1 income tax** — 2020–2025 brackets (under/over AOW age)
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

> **Note:** Income year 2026 is not enabled in the UI yet. A commented-out 2026 parameter block may be prepared in code, but shipped calculations currently cover 2020–2025 only. Always consult a tax advisor for your final return.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Architecture

### Backend writes & idempotency

Bordertax is currently a **client-side-only calculator**. All tax
calculations run in the browser from user-entered inputs; there is no
backend, no database, and no server-side mutation of any kind. As a
result, request idempotency (retry-safety for writes) is **not
applicable today** — there is nothing to retry, replay, or deduplicate.

This is a deliberate architectural boundary, not an oversight. Do not
add an idempotency/replay-key store, a request-log table, or a cleanup
job speculatively "for later." Build that machinery only when a
concrete write operation actually needs it (see below).

#### Checklist for any future backend write

Before adding a backend, a saved-calculation feature, a form
submission, a payment, or any other operation with an external
side effect, the proposal must address:

- **Retry behavior** — what happens if the client retries the same
  request (e.g. after a timeout or a dropped response)?
- **Duplicate-delivery behavior** — what happens if the same request
  is delivered more than once (double-click, browser retry, proxy
  retry, at-least-once message delivery, etc.)?
- **Timeout behavior** — what does the client do, and what state does
  the server end up in, if the response never arrives?

#### Choosing a retry-safety strategy

Pick the mechanism that fits the operation — don't default to a
generic replay-key cache:

- **Natural-key upsert** — when the write has a stable business key
  (e.g. "one saved calculation per user per name"), upsert on that
  key instead of tracking request IDs.
- **Client-generated IDs** — when the client can generate a UUID for
  a new resource up front, use it as the primary key so retries of
  the same create are naturally idempotent.
- **Optimistic concurrency** — when concurrent updates to the same
  resource are the risk, use a version/ETag check instead of a replay
  cache.
- **Replay keys** — only when none of the above fit (e.g. a
  non-idempotent external side effect like a payment or a
  third-party API call with no natural key). A replay-key cache is
  the exception, not the default.

#### If a replay cache is introduced

Any replay/idempotency-key storage added in the future must include,
from the start:

- **Bounded retention** — an explicit TTL for how long keys are kept.
- **Scheduled cleanup** — an automated job (not manual/ad-hoc) that
  removes expired keys, so the store doesn't grow unbounded.

A replay table without a retention and cleanup design is not
acceptable to merge.

## Caveats

- Civil status and Belgian region fields are present but not yet used in the calculation.
- Special social security contribution (BBSZ) and regional Belgian supplements are not included.
- This tool is a **simplified estimate** — it does not replace professional tax advice.
