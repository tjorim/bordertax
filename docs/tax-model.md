# Tax model: how Bordertax calculates

How the shared engine in `src/tax/` turns a workday split into a Dutch and a Belgian result, what each step is based on, and what has (and has not) been checked against real assessments. The web app and the [MCP server](mcp.md) use the same code. For the home-ownership scenario see [hypotheekrenteaftrek-rules.md](hypotheekrenteaftrek-rules.md).

This documents what the engine does today. Where that differs from official guidance it is listed under [Known gaps](#known-gaps), not described as correct. This is a simplified estimate, not tax advice.

## Scope

| Item           | Supported                                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resident       | Belgium only (`VALID_RESIDENT_COUNTRIES` in `src/tax/constants.ts`)                                                                                                    |
| Civil status   | Single only                                                                                                                                                            |
| Belgian region | Flemish only (`communalTaxRate` is the only local input)                                                                                                               |
| Employer       | One Dutch employer: a single gross salary and one set of workday counts                                                                                                |
| Income years   | 2020–2025. 2026 is not enabled and has no year module yet                                                                                                              |
| 30%-regeling   | Not available: `isThirtyPercentRulingSupportedResident` is true only for NL residents                                                                                  |
| Not modelled   | BBSZ (special social security contribution), regional Belgian supplements beyond the Flemish opcentiemen, Belgian home benefits, partners, partial years, other income |

`getCapabilities()` in `src/tax/capabilities.ts` exposes the same scope in machine-readable form.

## 1. Workday split

`getNLFractions` in `src/tax/workdays.ts`. Inputs are NL days, Belgian (home-working) days, third-country days and sick days; negative values count as zero.

| Fraction       | Formula                                     | Used for                                  |
| -------------- | ------------------------------------------- | ----------------------------------------- |
| Dutch method   | (NL + sick) ÷ (NL + Belgian + other + sick) | Dutch taxable income                      |
| Belgian method | NL ÷ (NL + Belgian + other)                 | Reported alongside the Dutch fraction     |
| `beFraction`   | (Belgian + other) ÷ (NL + Belgian + other)  | Belgian-taxable share of wage (section 3) |

Sick days count as Dutch workdays under the Dutch method and are left out entirely under the Belgian method. All fractions are 0 when the denominator is 0. Fractional day counts are allowed. Total days (including sick days) may not exceed the days in the year (`StrictTaxInputSchema`).

## 2. Dutch result (`src/tax/nl.ts`)

1. **Taxable income** = `round(grossSalary × Dutch fraction)`. The rest, `grossSalary − taxable income`, is the "Deel niet in NL belast" field of the Dutch return.
2. **Mortgage deduction** (optional, see the mortgage rules) is subtracted from taxable income, floored at zero, and a rate-cap surcharge (aftrekbeperking) is added back.
3. **Income tax** per bracket on that taxable income, using income-tax-only rates (combined rate minus the 27.65% premium rate, or 9.75% over AOW age). Each bracket's tax is rounded **down** to whole euros.
4. **Volksverzekeringen (premiums)** = `floor(min(grossSalary − mortgage deduction, ceiling) × premium rate)`. The base is worldwide income approximated by the full gross salary, not the Dutch fraction.
5. **Credits.** Arbeidskorting and algemene heffingskorting are both computed on the **full** gross salary (staged tables, rounded **up**). A Belgian resident who is insured in the Netherlands receives both: the Belastingdienst lists the algemene heffingskorting under "Heffingskortingen" for residents of Belgium ([source](https://www.belastingdienst.nl/wps/wcm/connect/nl/buitenland/content/ik-woon-niet-in-nederland-welke-aftrekposten-en-kortingen-heb-ik)). Credits are capped at income tax plus premiums.
6. **Net Dutch tax** = income tax + surcharge + premiums − credits, never below zero.
7. **Income tax due and premiums due.** Every credit has a tax part and a premium part in proportion to the first-bracket rates (2025: 8.17/35.82 tax, 27.65/35.82 premiums; [Belastingdienst, Heffingskortingen](https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2025/heffingskortingen)). The tax part reduces income tax and the premium part reduces the premiums; a part that exceeds what it is set against is used against the other charge. The two results, `incomeTaxDue` and `premiumsDue`, add up to the net Dutch tax.

Under-AOW and over-AOW age use separate premium rates and credit tables. All per-year numbers live in one module per income year (`src/tax/years/<year>.ts`); `TAX_PARAMS` and `EIGENWONINGFORFAIT` in `src/tax/params.ts` are assembled from them, and values that never changed (premium rates, Belgian forfait and federal/regional rates, the eigenwoningforfait bands) are declared once in `src/tax/years/shared.ts`. Each module records its sources and what was verified. `tests/tax/params.test.ts` checks that brackets, credit curves and tables are internally consistent.

## 3. Belgian result (`src/tax/be.ts`)

Method: exemption with progression (vrijstelling met progressievoorbehoud) under the Belgium–Netherlands treaty. Dutch-sourced income is exempt in Belgium but raises the rate on the rest.

1. **Code 1250 (declared income)** = `grossSalary − netTaxNL` = Y + Z (step 3). The Dutch tax and premiums are treated as already paid, so the Belgian return starts from what remains.
2. **Social contributions** entered by the user (code 1257) are deducted. The **professional-expenses forfait** is `min(forfaitRate × (1250 − social contributions), forfaitMax)`, giving **net professional income**.
3. **O.1 and O.2 (FOD guideline).** `W = grossSalary − premiumsDue`; `Y = W × beFraction` is taxable in Belgium (box IV O.1); `Z = W − Y − incomeTaxDue` is exempt (O.2), which equals `1250 − Y`, floored at zero. Premiums come off before the day fraction is applied; only the Dutch income tax is taken from the exempt side. The exempt fraction of code 1250 is applied to net professional income to get the exempt (`vrijgesteld`) and taxable (`volTarief`) parts.
4. **Progressive tax** (`basisbelasting`) is computed on the **whole** net professional income, then reduced by the belastingvrije som (25% of the base allowance plus the child supplements; more than 4 children uses `extraPerChildAbove4` where defined, otherwise it is rejected). This is `omTeSlane`.
5. **Exemption with progression.** The share of `omTeSlane` that corresponds to the exempt part (`vrijstellingReduction`) is removed, leaving `hoofdsom`.
6. **Federal/regional split.** `gereduceerde = hoofdsom × gereduceerdRate` (1 ÷ 1.33257 ≈ 0.75043, the Flemish opcentiemen are 33.257%); `gewestelijke = gereduceerde × gewestelijkeRate`.
7. **Optional reductions.** Supplementary pension: 30% credit against the federal part. Roerende voorheffing: credited against the federal part. Dienstencheques: reduce the regional part (20% up to income year 2024, abolished from 2025). Each saldo is floored at zero.
8. **Communal tax** = `communalTaxRate × totaleBelasting` plus `communalTaxRate × vrijstellingReduction`: municipal tax is levied on the exempt income too.
9. **Net Belgian tax** = federal saldo + regional saldo + communal tax (both parts).

Total tax is net Dutch tax plus net Belgian tax; net income is gross salary minus total tax.

## 4. Filing checklist

The checklist (`src/components/results/FilingChecklist.tsx`) does not run its own calculation. It shows inputs the user copies from their jaaropgave and statements, plus values from the engine: code 1250 (`be.declaredIncome`), the Dutch "Deel niet in NL belast", and the exempt amount `max(0, 1250 − beIncome)` under section O.2. It states that the Dutch figure should be replaced by the actual assessment when it arrives.

## 5. Rounding

Rounding follows how the Belastingdienst computes the Dutch side and is applied only there: taxable income `round`, each bracket `floor`, premiums `floor`, the credit tables `ceil`, the rate-cap surcharge `round`. The Belgian side keeps full precision and is only formatted for display.

## 6. Sources and verification status

| Area                                          | Source                                                                            | Status                                                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Dutch brackets, premiums, credits (2020–2025) | Belastingdienst yearly tables                                                     | Taken from published tables. 2024 checked against an actual Dutch assessment (per `years/2024.ts`)                                     |
| Arbeidskorting                                | Belastingdienst                                                                   | Matches filed Dutch returns (see [#430](https://github.com/tjorim/bordertax/issues/430))                                               |
| Algemene heffingskorting                      | Belastingdienst                                                                   | Applied to Belgian residents; the total credit reproduces the ACV example refund (see below)                                           |
| Belgian brackets, belastingvrije som, forfait | FOD Financiën                                                                     | Taken from published tables; not individually checked against assessments                                                              |
| `gereduceerdRate`, `gewestelijkeRate`         | Belgian aanslagbiljet                                                             | Verified from the official aanslagbiljet for income year 2024 only (per `years/2024.ts`); the same values are used for the other years |
| Eigenwoningforfait and mortgage rules         | Belastingdienst, Wet IB 2001                                                      | Verified per year in [hypotheekrenteaftrek-rules.md](hypotheekrenteaftrek-rules.md)                                                    |
| Salary-split method and worked example        | ACV telework info session, [PDF](../public/docs/ACV-Telewerk-Infosessie-2026.pdf) | Engine **differs** from the guideline ([Known gaps](#known-gaps))                                                                      | Engine follows the FOD guideline from the ACV session; the ACV premium/tax split differs ([Known gaps](#known-gaps)) | Whole calculator | —   | Not certified. "Checked" means a specific figure was compared, not that a full return was reproduced |

Income year 2026 is not enabled and has no module; its figures must come from the official tables ([#144](https://github.com/tjorim/bordertax/issues/144)).

## Known gaps

- **Premium base.** Premiums use the full gross salary (less any mortgage deduction) as worldwide income, with no other income, partial-year insurance or partner effects.
- **Dutch tax is an estimate, not the assessment.** The Belgian side starts from the _calculated_ Dutch tax. The app does not take the actual assessment as input.

- **ACV's premium/tax split differs from the Belastingdienst split.** The ACV worked example (wage €53,299, 2025) gives premiums due €5,874.66 and income tax due €2,713.34. The official 2025 split of the credits gives about €5,668 and €2,900. The difference (about €206) equals a 9.32/35.82 tax share, which is the 2024 tax-part rate mixed into the 2025 denominator. The engine follows the Belastingdienst split; ACV's figures can be reproduced by entering them as the actual assessment ([#432](https://github.com/tjorim/bordertax/issues/432)). The ACV refund itself (€4,314) is reproduced to within €20, the effect of the 181/231 day fraction ACV uses on the slide instead of 180/230.

Golden tests for the ACV examples are tracked in [#436](https://github.com/tjorim/bordertax/issues/436).
