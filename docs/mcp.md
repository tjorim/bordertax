# Local MCP calculator

The optional Bordertax MCP server lets AI clients use the same TypeScript tax
engine as the web app over local stdio. The website remains client-side only.
There is no hosted HTTP transport, backend service, database, account, or saved
scenario. The adapter does not persist or log salary or personal inputs and
writes only MCP protocol messages to stdout. Your AI client receives the inputs
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

## Tools and examples

All three tools are read-only, idempotent, and closed-world. Discover the
current supported profiles, years, required fields, defaults, units and
limitations first with `get_capabilities`, arguments `{}`. Its structured result
is exactly the shared engine's `getCapabilities()` output. Tool schemas derive
from the strict tax schema, so additions to that boundary appear automatically.

Example `calculate_tax` arguments:

```json
{
  "year": 2025,
  "residentCountry": "BE",
  "civilStatus": "single",
  "dependentChildren": 0,
  "belowAOWAge": true,
  "belgianRegion": "flemish",
  "communalTaxRate": 7,
  "grossSalary": 60000,
  "daysWorkedNL": 200,
  "daysWorkedBE": 20,
  "daysWorkedOther": 0,
  "thirtyPercentRuling": false,
  "socialContributions": 0,
  "aanvullendPensioen": 0,
  "dienstencheques": 0,
  "roerendeVoorheffing": 0,
  "withheldTaxNL": 0,
  "sickDays": 0
}
```

The response contains `inputs` (effective inputs including explicit defaults),
`result` (the complete shared engine breakdown: `inputs`, `nl`, `be`, gross and
net income, total tax, rates, workday fractions, and `mortgage`), and `caveat`:
`"Simplified estimate, not tax advice. Consult a qualified tax adviser."`
The mortgage block is null when disabled. Enable it with `mortgageEnabled: true`
and consult capability metadata for optional fields, defaults, eligibility,
assumptions and missing-income handling.

For `compare_scenarios`, pass the calculation arguments above as `base` and
only changes as `overrides`, for example:

```json
{
  "base": { "...": "the complete calculation arguments above" },
  "overrides": { "grossSalary": 70000, "daysWorkedNL": 210, "daysWorkedBE": 10 }
}
```

The placeholder is illustrative; send the actual base object. Responses contain
`inputs: { base, alternative }`, both full results as `a` and `b`, `delta`
(alternative minus base), `changed` groups, `attribution` (Shapley shares of
NL tax, BE tax and net income differences), and the estimate caveat. Overrides
are merged onto effective base inputs and the alternative is strictly validated.
Defaults are not applied to omitted overrides. To disable a mortgage scenario,
start from a base without mortgage-only fields; fields supplied while disabled
are rejected by the strict boundary.

Successful tools return the same JSON object in `structuredContent` and a JSON
text content block. Invalid, missing, unknown, unsupported, or non-finite inputs
return `isError: true` with field paths and validation messages. For example,
a negative salary identifies `grossSalary` and its minimum of zero. Fix the
identified fields and retry; invalid inputs are never silently clamped.

## Units, limitations and retry safety

Money is EUR per year. `communalTaxRate` and mortgage ownership share are whole
percent units (7 means 7%). Workdays are day counts, including fractional days;
sick days count toward the annual maximum. Result rates and shares are fractions
(0.25 means 25%) except fields explicitly documented otherwise by capabilities,
such as mortgage `nlTaxedPercent`. Comparison monthly net-income delta is EUR
per month. Values retain engine precision; clients may round for display.

Currently supported income years are 2020–2025, for single Belgian residents in
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
