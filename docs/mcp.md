# Local MCP calculator

The optional Bordertax MCP server lets AI clients use the same TypeScript tax
engine as the web app over local stdio. The website remains client-side only.
The optional HTTP service is separate from the static website; neither transport
has a database, account, or saved scenario. Neither adapter persists or logs
salary or personal inputs. The stdio adapter writes only MCP protocol messages
to stdout. Your AI client receives the inputs
and results; its own privacy and conversation-retention policies still apply.

## Install and launch

From a clone, with Node.js 24+ and the pinned pnpm version:

```sh
pnpm install --frozen-lockfile
pnpm mcp:build
pnpm mcp:start
```

The last command waits for an MCP client on stdin; it is not an interactive
terminal interface. Rebuild after updating the clone. The ignored
`dist-mcp/server.mjs` bundles the engine and SDK without React, browser storage,
or generated translations. No network connection is needed at runtime.

Configure clients to launch Node directly, avoiding package-manager output on
the protocol stream. Use absolute paths (including the Node executable if your
GUI client does not inherit PATH). For Claude Desktop, merge this into its MCP
configuration; other stdio clients use the same command and arguments:

```json
{
  "mcpServers": {
    "bordertax": {
      "command": "node",
      "args": ["/absolute/path/to/bordertax/dist-mcp/server.mjs"]
    }
  }
}
```

For Claude Code:

```sh
claude mcp add --transport stdio bordertax -- node /absolute/path/to/bordertax/dist-mcp/server.mjs
```

See the [MCP SDK stdio documentation](https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x)
for programmatic clients. `Client` with `StdioClientTransport` is exercised in
`tests/mcp/server.test.ts`. Run `pnpm mcp:build && pnpm test` to include the built
server round-trip; CI always builds it before testing.

## Hosted endpoint

The planned public, unauthenticated endpoint is `https://bordertax.tjor.im/mcp`.
It goes live once the tjorim/apps deployment issue is completed; this document
does not mean it is live yet. It serves the same tools over stateless Streamable
HTTP, with a fresh server and transport for each POST and no sessions.

For Claude Code:

```sh
claude mcp add --transport http bordertax https://bordertax.tjor.im/mcp
```

In a generic remote-URL MCP client, select **Streamable HTTP** and enter
`https://bordertax.tjor.im/mcp` as the server URL. No token is required. SDK clients
can use `Client` with `StreamableHTTPClientTransport(new URL(url))`.

Salary and personal inputs are sent to the server in the request body. The
service does not store or log those inputs or results and has no per-request
logging. Your AI client's own privacy policies still apply. Use the local stdio
server if you do not want to send your figures to a server. Deployment must also
keep request bodies out of proxy and edge logs.

All tools are read-only: retries, duplicate requests and timeouts are safe and
leave no saved state. Bodies are limited to **64 KiB** (larger requests return
413). Rate limits at the edge may return 429. GET and DELETE on `/mcp` return
405; no SSE subscription or session deletion is needed. Requests must use the
SDK's content negotiation: `Content-Type: application/json` and an `Accept`
header accepting both `application/json` and `text/event-stream`.

To run the HTTP service locally (Node.js 24+):

```sh
pnpm mcp:build
pnpm mcp:start:http
# Or: docker build -f Dockerfile.mcp -t bordertax-mcp .
#     docker run --rm -p 8080:8080 bordertax-mcp
```

The build emits two self-contained ESM files: `dist-mcp/server.mjs` for stdio
and `dist-mcp/http.mjs` for HTTP. Neither enters the web bundle. The container
runs only the HTTP bundle as a non-root user. SIGTERM and SIGINT stop accepting
requests and allow up to five seconds for active responses to finish.

| Environment variable  | Default   | Meaning                                     |
| --------------------- | --------- | ------------------------------------------- |
| `PORT`                | `8080`    | HTTP listening port                         |
| `HOST`                | `0.0.0.0` | HTTP bind address                           |
| `MCP_ALLOWED_ORIGINS` | empty     | Comma-separated exact allowed Origin values |

Requests without an Origin header are accepted. Requests carrying an Origin
are rejected unless it exactly matches an allow-list entry; the empty default
rejects all such requests. This is Origin validation, not browser CORS support.
Headers have a 10-second timeout and requests a 30-second timeout, with a
30-second socket inactivity timeout.

`GET /healthz` returns `{"status":"ok"}`. `GET /api/mcp/capabilities` exposes the
MCP capability contract v1 manifest, derived from registered tool metadata,
with read effects, no confirmation required, and empty access requirements.

## Tools and examples

All three tools are read-only, idempotent, and closed-world. Discover the
input schema version, supported profiles, years, required fields, defaults,
source documents, units and limitations first with `get_capabilities`,
arguments `{}`. Its structured result is exactly the shared engine's
`getCapabilities()` output. Tool schemas derive from the strict tax schema, so
additions to that boundary appear automatically; each field's description
starts with the document it is read from.

Example `calculate_tax` arguments, grouped by source document:

```json
{
  "year": 2025,
  "dependentChildren": 0,
  "belowAOWAge": true,
  "communalTaxRate": 7,

  "annualStatements": [{ "taxableWage": 60000, "wageTaxWithheld": 0 }],

  "daysWorkedNL": 200,
  "daysWorkedBE": 20,
  "daysWorkedOther": 0,
  "sickDaysNL": 0,
  "sickDaysOutsideNL": 0,

  "healthInsurancePremium": 0,
  "supplementaryPension": 0,
  "serviceVouchers": 0,
  "reclaimableWithholdingTax": 0
}
```

| Source document                       | Fields                                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Profile                               | `year`, `dependentChildren`, `belowAOWAge`, `communalTaxRate`; optional `residentCountry`, `civilStatus`, `belgianRegion`, `thirtyPercentRuling` |
| Annual tax statement (jaaropgave)     | `annualStatements[]`: `taxableWage` (Loon), `wageTaxWithheld` (loonheffing); 1–10 statements                                                     |
| Workday record or workday statement   | `daysWorkedNL`, `daysWorkedBE`, `daysWorkedOther`, `sickDaysNL`, `sickDaysOutsideNL`                                                             |
| Health insurer's annual statement     | `healthInsurancePremium` (Belgian code 1257)                                                                                                     |
| December payslip or pension statement | `supplementaryPension` (code 1285)                                                                                                               |
| Service-voucher annual statement      | `serviceVouchers` (code 3364; reduces tax up to income year 2024)                                                                                |
| Bank's annual tax statement           | `reclaimableWithholdingTax` (code 1437)                                                                                                          |
| Dutch assessment (aanslag), optional  | `assessmentIncomeTaxDue`, `assessmentPremiumsDue`, together                                                                                      |
| Home, optional                        | `mortgageEnabled` and the mortgage fields                                                                                                        |

Fields with a single legal value default when left out: `residentCountry`
`"BE"`, `civilStatus` `"single"`, `belgianRegion` `"flemish"`,
`thirtyPercentRuling` `false`. Several annual statements (job change, agency
plus direct employment) are summed: the heffingskortingen, premiums and both
returns are computed on the total wage, and `result.taxableWage` and
`result.wageTaxWithheld` are the sums. A caller with one sick-day figure sends
it as `sickDaysNL` with `sickDaysOutsideNL: 0`; sick days on days scheduled in
Belgium or a third country count as days outside NL on the Dutch return. The
Belgian method leaves all sick days out.

### Input schema version 2

`get_capabilities.inputSchema.version` is `2`. Version 2 is a breaking change
for agent clients: the version 1 names below are rejected with an error that
names the replacement and lists every rename, instead of being reported as
unsupported fields. Input files saved at `schemaVersion` 1 are still imported
(the web app migrates them).

| Version 1                               | Version 2                                          |
| --------------------------------------- | -------------------------------------------------- |
| `grossSalary`                           | `annualStatements[].taxableWage`                   |
| `withheldTaxNL`                         | `annualStatements[].wageTaxWithheld`               |
| `sickDays`                              | `sickDaysNL` (with `sickDaysOutsideNL: 0`)         |
| `socialContributions`                   | `healthInsurancePremium`                           |
| `aanvullendPensioen`                    | `supplementaryPension`                             |
| `dienstencheques`                       | `serviceVouchers`                                  |
| `roerendeVoorheffing`                   | `reclaimableWithholdingTax`                        |
| `result.grossIncome`                    | `result.taxableWage`                               |
| `delta.grossIncome` (compare)           | `delta.taxableWage`                                |
| `result.be.socialContributionsDeducted` | `result.be.healthInsurancePremiumDeducted`         |
| —                                       | `result.wageTaxWithheld` (new: summed withholding) |

To migrate a version 1 request: wrap `grossSalary` and `withheldTaxNL` in
`annualStatements: [{ taxableWage, wageTaxWithheld }]`, rename `sickDays` to
`sickDaysNL` and add `sickDaysOutsideNL: 0`, rename the four Belgian items, and
optionally drop `residentCountry`, `civilStatus`, `belgianRegion` and
`thirtyPercentRuling`. The figures are unchanged for the same inputs.

The response contains `inputs` (effective inputs including explicit defaults),
`result` (the complete shared engine breakdown: `inputs`, `nl`, `be`, taxable
wage, withheld wage tax and net income, total tax, rates, workday fractions, and `mortgage`), and `caveat`:
`"Simplified estimate, not tax advice. Consult a qualified tax adviser."`
`result.nl` is always the app's estimate of the Dutch tax. To use the figures from the
actual Dutch assessment, add `assessmentIncomeTaxDue` and `assessmentPremiumsDue`
(euros, after the heffingskortingen, from the aanslag). They must be given together; one
alone is rejected. When present they replace the estimate in the Belgian calculation
(code 1250, O.1/O.2), total tax and net income, and `result.nlCharge` reports the source
(`estimate` or `assessment`) and the difference from the estimate.
Belgian money figures in `result.be` are rounded to whole cents when the result is built (full
precision is kept between calculation steps; no Belgian tax-rounding rule is claimed), and
`totalTax`, `netIncome` and the mortgage effects are cleaned to cents to match. Fractions are not
rounded. `result.nl.brackets` lists `{ from, to, rate, taxableAmount, tax }` in euros with `to: null`
for the open top bracket; there is no formatted label, so clients format the bounds themselves.
`result.noWorkdays` is `true` when all workday inputs are zero: the Dutch and Belgian figures are
then zero and net income equals the taxable wage (an entered assessment still counts as the Dutch
charge). `result.be.federalReductionsUnused` is the part of `supplementaryPension × 30%` plus
`reclaimableWithholdingTax` that exceeds the federal tax; it is clamped to the federal saldo and not
carried over.
The mortgage block is null when disabled. Enable it with `mortgageEnabled: true`
and consult capability metadata for optional fields, defaults, eligibility,
assumptions and missing-income handling.

For `compare_scenarios`, pass the calculation arguments above as `base` and
only changes as `overrides`, for example:

```json
{
  "base": { "...": "the complete calculation arguments above" },
  "overrides": {
    "annualStatements": [{ "taxableWage": 70000, "wageTaxWithheld": 0 }],
    "daysWorkedNL": 210,
    "daysWorkedBE": 10
  }
}
```

The placeholder is illustrative; send the actual base object. Responses contain
`inputs: { base, alternative }`, both full results as `a` and `b`, `delta`
(alternative minus base), `changed` groups, `attribution` (Shapley shares of
NL tax, BE tax and net income differences), and the estimate caveat. Overrides
are merged onto effective base inputs and the alternative is strictly validated.
Defaults are not applied to omitted overrides. An `annualStatements` override
replaces the whole list. To disable a mortgage scenario,
start from a base without mortgage-only fields; fields supplied while disabled
are rejected by the strict boundary.

Successful tools return the same JSON object in `structuredContent` and a JSON
text content block. Invalid, missing, unknown, unsupported, or non-finite inputs
return `isError: true` with field paths and validation messages. For example,
a negative wage identifies `annualStatements.0.taxableWage` and its minimum of zero. Fix the
identified fields and retry; invalid inputs are never silently clamped.

## Units, limitations and retry safety

Money is EUR per year. `communalTaxRate` and mortgage ownership share are whole
percent units (7 means 7%). Workdays are day counts, including fractional days;
both sick-day fields count toward the annual maximum. Result rates and shares are fractions
(0.25 means 25%) except fields explicitly documented otherwise by capabilities,
such as mortgage `nlTaxedPercent`. Comparison monthly net-income delta is EUR
per month. Belgian money figures are in whole cents; other values retain engine precision
and clients may round for display.

Currently supported income years are 2020–2026, for single Belgian residents in
Flanders working for Dutch employers. Discovery is authoritative as coverage
changes. The Belgian-resident profile does not support the 30% ruling. BBSZ and
Belgian home benefits are not modelled. Mortgage eligibility and debt conditions
include assumptions; inspect the returned reasons and assumptions. This is a
simplified estimate, not tax advice. Consult the web app's source references and
a qualified adviser before filing a return.

Requests have no external side effects. Duplicate calls and retries repeat the
calculation; a timeout leaves no stored scenario or partial write. Clients may
retry or restart the process safely. There is no replay-key store or cleanup
job. No input history is retained between calls.

### HTTP request rate limit

The HTTP server defaults to 60 requests/minute per client for `/mcp` and its
computed `/api/mcp/capabilities` manifest together. HTTP methods, query strings
and trailing slashes share that bucket. `/healthz` is exempt; local stdio is
unaffected. A rejected request gets 429, `Retry-After`, `X-RateLimit-*`, and
`Cache-Control: no-store` before parsing a body or creating an MCP server.

Configure `MCP_RATE_LIMIT_PER_MINUTE` as a positive integer. Set
`MCP_RATE_LIMIT_ENABLED=false` only for a deliberate staged rollout. Invalid
settings fail startup. Counters are process-local fixed windows, reset on
restart, and retain at most 10,000 active client buckets. Capacity rejects new
clients rather than evicting active ones. Add shared storage before multiple
workers/replicas. The private Docker peer is trusted to replace `X-Real-IP`;
public peers cannot select a key and malformed headers fall back to the peer.
IPv4-mapped addresses normalize to IPv4 and IPv6 subscribers share a /64.
Keep the service private behind Caddy. The approved Cloudflare edge limit
remains useful as an outer backstop, not a replacement for this app limit.

Existing body-size and request-time limits remain in force. All tools are
read-only, so clients may retry a rejected request after its Retry-After delay.
Monitor 429s and shared-NAT traffic when deploying; no production settings or
Cloudflare rules are changed by this implementation.
