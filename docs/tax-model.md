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
| Income years   | 2020–2025. 2026 is not enabled; a commented-out block in `params.ts` is not shipped                                                                                    |
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
5. **Credits.** Arbeidskorting is computed on the **full** gross salary (staged table, rounded **up**). The algemene heffingskorting is set to **0** for Belgian residents (see [Known gaps](#known-gaps)). Credits are capped at income tax plus premiums.
6. **Net Dutch tax** = income tax + surcharge + premiums − credits, never below zero.

Under-AOW and over-AOW age use separate premium rates and credit tables. All per-year numbers live in `TAX_PARAMS` (`src/tax/params.ts`).

## 3. Belgian result (`src/tax/be.ts`)

Method: exemption with progression (vrijstelling met progressievoorbehoud) under the Belgium–Netherlands treaty. Dutch-sourced income is exempt in Belgium but raises the rate on the rest.

1. **Code 1250 (declared income)** = `grossSalary − netTaxNL`. The Dutch tax and premiums are treated as already paid, so the Belgian return starts from what remains.
2. **Social contributions** entered by the user (code 1257) are deducted. The **professional-expenses forfait** is `min(forfaitRate × (1250 − social contributions), forfaitMax)`, giving **net professional income**.
3. **Exempt (O.2) share.** Belgian-taxable income is `grossSalary × beFraction`; the exempt part of code 1250 is `1250 − that amount`, floored at zero, so the whole Dutch charge is taken from the exempt side rather than spread over both sides. The exempt fraction of code 1250 is applied to net professional income to get the exempt (`vrijgesteld`) and taxable (`volTarief`) parts.
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

| Area                                          | Source                                                                            | Status                                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Dutch brackets, premiums, credits (2020–2025) | Belastingdienst yearly tables                                                     | Taken from published tables. 2024 checked against an actual Dutch assessment (per `params.ts`)       |
| Arbeidskorting                                | Belastingdienst                                                                   | Matches filed Dutch returns (see [#430](https://github.com/tjorim/bordertax/issues/430))             |
| Algemene heffingskorting                      | Belastingdienst                                                                   | Tables exist but are **not applied** to Belgian residents ([Known gaps](#known-gaps))                |
| Belgian brackets, belastingvrije som, forfait | FOD Financiën                                                                     | Taken from published tables; not individually checked against assessments                            |
| `gereduceerdRate`, `gewestelijkeRate`         | Belgian aanslagbiljet                                                             | Verified from official aanslagbiljet values (see the comments in `params.ts`)                        |
| Eigenwoningforfait and mortgage rules         | Belastingdienst, Wet IB 2001                                                      | Verified per year in [hypotheekrenteaftrek-rules.md](hypotheekrenteaftrek-rules.md)                  |
| Salary-split method and worked example        | ACV telework info session, [PDF](../public/docs/ACV-Telewerk-Infosessie-2026.pdf) | Engine **differs** from the guideline ([Known gaps](#known-gaps))                                    |
| Whole calculator                              | —                                                                                 | Not certified. "Checked" means a specific figure was compared, not that a full return was reproduced |

Income year 2026 is not enabled; its parameters are unfinished and the Dutch arbeidskorting stages are provisional.

## Known gaps

- **Code 1250 split (O.1/O.2) differs from the FOD guideline ([#442](https://github.com/tjorim/bordertax/issues/442)).** The guideline in the ACV session is `W = wage − social contributions due in the work state`, `Y = W × days fraction` (taxable in Belgium), `Z = W − Y − income tax due in the work state` (exempt). The engine takes Y from the full wage and deducts the whole Dutch charge, premiums included, from the exempt side, so the Belgian-taxable amount is too high by `beFraction × premiums due`. In the ACV example (2025, wage €53,299, 50 home days of 230, 6% municipal tax) the engine gives O.1 €11,586.74 and O.2 €31,653.26 against ACV's €10,309.64 and €34,401.36. The text of the FOD formula on the `/reference/salary-split` page mirrors the engine rather than the source for the same reason.
- **Algemene heffingskorting is zero for Belgian residents ([#430](https://github.com/tjorim/bordertax/issues/430)).** A Belgian resident who is insured in the Netherlands receives it, subject to the income phase-out. The Dutch refund, code 1250 and the Belgian estimate are consequently off by that credit for wages below the phase-out end.
- **Premium base.** Premiums use the full gross salary (less any mortgage deduction) as worldwide income, with no other income, partial-year insurance or partner effects.
- **Dutch tax is an estimate, not the assessment.** The Belgian side starts from the _calculated_ Dutch tax. The app does not take the actual assessment as input.

Golden tests for the ACV examples are tracked in [#436](https://github.com/tjorim/bordertax/issues/436).
