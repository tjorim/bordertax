# Tax model: how Bordertax calculates

How the shared engine in `src/tax/` turns a workday split into a Dutch and a Belgian result, what each step is based on, and what has (and has not) been checked against real assessments. The web app and the [MCP server](mcp.md) use the same code. For the home-ownership scenario see [hypotheekrenteaftrek-rules.md](hypotheekrenteaftrek-rules.md).

This documents what the engine does today. Where that differs from official guidance it is listed under [Known gaps](#known-gaps), not described as correct. This is a simplified estimate, not tax advice.

## Scope

| Item           | Supported                                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resident       | Belgium only (`VALID_RESIDENT_COUNTRIES` in `src/tax/constants.ts`)                                                                                                    |
| Civil status   | Single only                                                                                                                                                            |
| Belgian region | Flemish only (`communalTaxRate` is the only local input)                                                                                                               |
| Employer       | Dutch employment: one or more annual statements (jaaropgaven), summed into one taxable wage, and one set of workday counts                                             |
| Income years   | 2020–2026                                                                                                                                                              |
| 30%-regeling   | Not available: `isThirtyPercentRulingSupportedResident` is true only for NL residents                                                                                  |
| Not modelled   | BBSZ (special social security contribution), regional Belgian supplements beyond the Flemish opcentiemen, Belgian home benefits, partners, partial years, other income |

`getCapabilities()` in `src/tax/capabilities.ts` exposes the same scope in machine-readable form.

## Inputs by source document

Inputs are grouped by the document a user reads them from (`INPUT_GROUPS` in `src/tax/schema.ts`). The form, the filing checklist's document list and the MCP schema descriptions use the same groups. Belgian return codes are metadata (`BELGIAN_CODES`), not part of a field name.

| Document                              | Inputs                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Profile (no document)                 | `year`, `dependentChildren`, `belowAOWAge`, `communalTaxRate`; four single-value fields                 |
| Annual tax statement (jaaropgave)     | `annualStatements[]`: `taxableWage` (Loon), `wageTaxWithheld` (loonheffing)                             |
| Workday record or workday statement   | `daysWorkedNL`, `daysWorkedBE`, `daysWorkedOther`, `sickDaysNL`, `sickDaysOutsideNL`                    |
| Health insurer's annual statement     | `healthInsurancePremium` (code 1257)                                                                    |
| December payslip or pension statement | `supplementaryPension` (code 1285), `exchangedGrossWage`, `commutingAllowance` (code 1254)              |
| Service-voucher annual statement      | `serviceVouchers` (code 3364)                                                                           |
| Bank's annual tax statement           | `reclaimableWithholdingTax` (code 1437)                                                                 |
| Dutch assessment (aanslag)            | `assessmentIncomeTaxDue`, `assessmentPremiumsDue`                                                       |
| Home (no document)                    | `mortgageEnabled`, `mortgageInterest`, `mortgageHomeValue`, `mortgageOwnershipShare`, `incomeOutsideNL` |

`residentCountry` (`BE`), `civilStatus` (`single`), `belgianRegion` (`flemish`) and `thirtyPercentRuling` (`false`) have one legal value. They stay in `TaxInputs` so the engine can branch on them later, but the strict schema defaults them, the input file leaves them out and the browser no longer stores them.

**Several annual statements.** A job change or agency plus direct employment gives more than one jaaropgave. `sumAnnualStatements` (`src/tax/statements.ts`) adds the taxable wages and the withheld tax; everything below works on the summed wage, so the arbeidskorting, algemene heffingskorting and premiums are computed once on the total, as for one statement with that wage. `TaxResult.taxableWage` and `TaxResult.wageTaxWithheld` are the sums. The filing checklist lists Loon and Loonheffing per statement, because the Dutch return has them per employer.

## 1. Workday split

`getNLFractions` in `src/tax/workdays.ts`. Inputs are NL days, Belgian (home-working) days, third-country days, sick days on days scheduled in the Netherlands (`sickDaysNL`) and sick days on days scheduled in Belgium or a third country (`sickDaysOutsideNL`); negative values count as zero.

| Fraction       | Formula                                                    | Used for                                  |
| -------------- | ---------------------------------------------------------- | ----------------------------------------- |
| Dutch method   | (NL + sick in NL) ÷ (NL + Belgian + other + all sick days) | Dutch taxable income                      |
| Belgian method | NL ÷ (NL + Belgian + other)                                | Reported alongside the Dutch fraction     |
| `beFraction`   | (Belgian + other) ÷ (NL + Belgian + other)                 | Belgian-taxable share of wage (section 3) |

For the Dutch return a sick day belongs to the country where it was scheduled to be worked: `sickDaysNL` are Dutch workdays, `sickDaysOutsideNL` are days outside the Netherlands and so part of "Deel niet in NL belast". The Belgian method follows the ACV session material (`ACV-Telewerk-Infosessie-2026.pdf`, slide "aangifte doen in 2 landen: verdeling": "België: idem, maar minus de ziektedagen") and leaves every sick day out of both numerator and denominator, wherever it was scheduled. The form keeps one "Sick days" field for the simple case, which is `sickDaysNL`; an expander splits off the days scheduled outside the Netherlands. Input schema version 1 had a single `sickDays`, counted as Dutch days, which is exactly `sickDaysNL` with `sickDaysOutsideNL: 0`.

**The two splits differ on purpose.** With sick days the Dutch "Deel niet in NL belast" (wage × Dutch share outside NL) and the Belgian-taxable share of the wage (wage × `beFraction`) are different amounts. `compareSourcing` in `src/tax/sourcing.ts` puts them on the same base: when the Belgian share is larger, the difference is wage taxed in the Netherlands that Belgium also treats as taxable (double-taxation risk); when the Dutch amount is larger, the difference is left untaxed by the Netherlands and exempt in Belgium. Example (#431): 180 NL, 20 BE and 30 sick days in NL on an €80,000 wage leave €6,957 untaxed in NL against €8,000 Belgian-taxable, a €1,043 overlap. The filing checklist shows both amounts side by side with that difference, and warns against computing O.2 as code 1250 minus "Deel niet in NL belast", which mixes the two splits. All fractions are 0 when the denominator is 0, and `noWorkdays` is true when the total including sick days is 0 (see the "No workdays" note in section 2). Fractional day counts are allowed. Total days (including sick days) may not exceed the days in the year (`StrictTaxInputSchema`).

## 2. Dutch result (`src/tax/nl.ts`)

1. **Taxable income** = `round(taxable wage × Dutch fraction)`. The rest, `taxable wage − taxable income`, is the "Deel niet in NL belast" field of the Dutch return.
2. **Mortgage deduction** (optional, see the mortgage rules) is subtracted from taxable income, floored at zero, and a rate-cap surcharge (aftrekbeperking) is added back.
3. **Income tax** per bracket on that taxable income, using income-tax-only rates (combined rate minus the 27.65% premium rate, or 9.75% over AOW age). Each bracket's tax is rounded **down** to whole euros.
4. **Volksverzekeringen (premiums)** = `floor(min(taxable wage − mortgage deduction, ceiling) × premium rate)`. The base is worldwide income approximated by the full taxable wage, not the Dutch fraction.
5. **Credits.** Arbeidskorting and algemene heffingskorting are each split into a tax part and a premium part in proportion to the first-bracket rates (2025: 8.17 / 35.82 and 27.65 / 35.82). The **tax part** is computed on the full taxable wage (worldwide income of a qualifying non-resident); the **premium part** is computed on the income taxed in the Netherlands (the workday fraction). Each part is rounded up. When nothing is untaxed in the Netherlands both parts share one basis and the table value stands. A Belgian resident who is insured in the Netherlands receives both credits: the Belastingdienst lists the algemene heffingskorting under "Heffingskortingen" for residents of Belgium ([source](https://www.belastingdienst.nl/wps/wcm/connect/nl/buitenland/content/ik-woon-niet-in-nederland-welke-aftrekposten-en-kortingen-heb-ik)). Credits are capped at income tax plus premiums. This split reproduces the arbeidskorting on a definitieve aanslag 2024 and the algemene heffingskorting on a 2023 one to the euro; see Known gaps for what it does not explain.
6. **Net Dutch tax** = income tax + surcharge + premiums − credits, never below zero.
7. **Income tax due and premiums due.** The tax parts of the credits (step 5) reduce income tax and the premium parts reduce the premiums ([Belastingdienst, Heffingskortingen](https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2025/heffingskortingen)); a part that exceeds what it is set against is used against the other charge. The two results, `incomeTaxDue` and `premiumsDue`, add up to the net Dutch tax.

Under-AOW and over-AOW age use separate premium rates and credit tables. All per-year numbers live in one module per income year (`src/tax/years/<year>.ts`); `TAX_PARAMS` and `EIGENWONINGFORFAIT` in `src/tax/params.ts` are assembled from them, and values that never changed (premium rates, Belgian forfait and federal/regional rates, the eigenwoningforfait bands) are declared once in `src/tax/years/shared.ts`. Each module records its sources and what was verified. `tests/tax/params.test.ts` checks that brackets, credit curves and tables are internally consistent.

### No workdays

When NL, Belgian, other and sick days are all zero there is nothing to source the wage to. `getNLFractions` reports `noWorkdays` and `TaxResult.noWorkdays` carries it. The previous behaviour (taxable income 0 but full premiums and credits) charged premiums and applied the arbeidskorting on income that is not there, so the state is explicit instead:

- `calculateNLTax` returns zero for taxable income, brackets (empty), mortgage deduction and surcharge, premiums, both credits, income tax due, premiums due and net Dutch tax. `deelNietInNLBelast` equals the taxable wage (nothing is taxed in NL).
- `calculateBETax` returns a result with every figure zero (`beFraction` 0): the whole wage would otherwise count as exempt Dutch income and still carry communal tax. Total tax is then only an entered assessment, if any (an assessment is the user's own figure and is still honoured), and net income equals the taxable wage.
- The zeros mean "not calculated", not "no tax is due". The results show a note (an `Alert`) above the tabs asking for workdays. With only sick days the state does not apply: sick days count as workdays (Dutch or outside NL, by schedule).
- The strict schema is unchanged; zero workdays remain valid input.

### The Dutch assessment replaces the estimate

The Belgian return is filed after the Dutch one, and code 1250 depends on the Dutch tax actually charged. Two optional inputs, `assessmentIncomeTaxDue` and `assessmentPremiumsDue` (euros: income tax and premies volksverzekeringen due on the aanslag, after the heffingskortingen; both are on the assessment), take the place of the estimate.

- They must be given **together**. The strict schema (MCP, input file import) rejects exactly one; the lenient form schema keeps a lone value but the engine ignores it.
- `resolveDutchCharge` in `src/tax/nl.ts` is the only place where the substitution happens. It returns `TaxResult.nlCharge`: the source (`estimate` or `assessment`), income tax, premiums and their sum, plus the difference from the estimate (zero for the estimate). `calculateCore` in `src/tax/index.ts` passes that charge, not `nl`, to the Belgian calculation and uses its `netTaxNL` for total tax, net income and the effective rate.
- `TaxResult.nl` always stays the app's own estimate, so the two can be compared. Nothing changes when the fields are absent.
- The mortgage saving and the extra Belgian tax are measured on the estimate: an assessment already fixes the Dutch charge, so it cannot show what the deduction changes.
- The values are not persisted across reloads (like salary and workdays) and are written to and read from the input file only when both are present; files without them stay valid at `schemaVersion` 2.

## 3. Belgian result (`src/tax/be.ts`)

Method: exemption with progression (vrijstelling met progressievoorbehoud) under the Belgium–Netherlands treaty. Dutch-sourced income is exempt in Belgium but raises the rate on the rest.

1. **Code 1250 (declared income)** = `wage base − (income tax due + premiums due)` = Y + Z (step 4), where the **wage base** is the taxable wage plus the employee pension premium (`supplementaryPension`, also entered at code 1285) plus gross wage exchanged for tax-free benefits (`exchangedGrossWage`). The Dutch fiscal wage is after both, and Belgium allows neither reduction (ACV telework session, "bepaling Belgisch belastbaar loon"). It uses the Dutch charge in use: the estimate (`netTaxNL`) or, when entered, the assessment. The Dutch tax and premiums are treated as already paid, so the Belgian return starts from what remains.
2. **Commuting allowance.** An untaxed employer allowance for commuting by own car (`commutingAllowance`) is declared at code 1254; the exemption at code 1255 is the allowance up to the year's own-car maximum (490 for income year 2025, 500 for 2026, FOD Financiën; no exemption is assumed for years not checked). The allowance is assumed to be paid for days worked in the Netherlands, so it is entered in box IV O.2 as well: the taxable rest (allowance − exemption) raises the net income and counts on the exempt side.
3. **The Dutch health-insurance premium** entered by the user (`healthInsurancePremium`, code 1257) is deducted. The **professional-expenses forfait** is `min(forfaitRate × (1250 − health-insurance premium), forfaitMax)`, giving **net professional income**.
4. **O.1 and O.2 (FOD guideline).** `W = wage base − premiumsDue` (assessed premiums when entered); `Y = W × beFraction` is taxable in Belgium (box IV O.1); `Z = W − Y − incomeTaxDue` is exempt (O.2), which equals `1250 − Y`, floored at zero. Premiums come off before the day fraction is applied; only the Dutch income tax is taken from the exempt side. The exempt fraction of code 1250 is applied to net professional income to get the exempt (`vrijgesteld`) and taxable (`volTarief`) parts.
5. **Progressive tax** (`basisbelasting`) is computed on the **whole** net professional income, then reduced by the belastingvrije som (25% of the base allowance plus the child supplements; more than 4 children uses `extraPerChildAbove4` where defined, otherwise it is rejected). This is `omTeSlane`.
6. **Exemption with progression.** The share of `omTeSlane` that corresponds to the exempt part (`vrijstellingReduction`) is removed, leaving `hoofdsom`.
7. **Federal/regional split.** `gereduceerde = hoofdsom × gereduceerdRate` (1 ÷ 1.33257 ≈ 0.75043, the Flemish opcentiemen are 33.257%); `gewestelijke = gereduceerde × gewestelijkeRate`.
8. **Optional reductions.** Supplementary pension (`supplementaryPension`, code 1285): 30% credit against the federal part. Reclaimable withholding tax (`reclaimableWithholdingTax`, roerende voorheffing, code 1437): credited against the federal part. Service vouchers (`serviceVouchers`, dienstencheques, code 3364): reduce the regional part (20% up to income year 2024, abolished from 2025). Each saldo is floored at zero. What the federal reductions (pension × 30% plus code 1437) exceed the federal part by is returned as `federalReductionsUnused`; the estimate neither uses nor carries it over, and the Belgian result and the filing checklist show a short note when it is above zero. How the excess is treated in the real return is not modelled.
9. **Communal tax** = `communalTaxRate × totaleBelasting` plus `communalTaxRate × vrijstellingReduction`: municipal tax is levied on the exempt income too.
10. **Net Belgian tax** = federal saldo + regional saldo + communal tax (both parts).

Total tax is the Dutch charge in use (estimate or assessment) plus net Belgian tax; net income is the taxable wage minus total tax.

## 4. Filing checklist

The checklist (`src/components/results/FilingChecklist.tsx`) does not run its own calculation. It shows inputs the user copies from their jaaropgave and statements, plus values from the engine: code 1250 (`be.declaredIncome`), the Dutch "Deel niet in NL belast", and the exempt amount `max(0, 1250 − beIncome)` under section O.2. The Belgian group carries a note (an `Alert`) saying the figures are provisional until both assessment figures are entered, and that they use the assessment once they are. The Dutch tab shows which source is in use and the difference from the estimate for income tax and premiums.

The documents list follows the source documents of the inputs (annual tax statements, workday record, health insurer, pension or payslip, service vouchers up to income year 2024, bank, Dutch assessment). With several annual statements the Dutch rows list Loon and Loonheffing per statement. When there are sick days a "Two workday splits of the same wage" section shows the Dutch "Deel niet in NL belast" next to the Belgian-taxable share of the wage, the O.1 and O.2 amounts built on the Belgian share, and the difference from `compareSourcing` (section 1).

## Input schema versions and migration

The input shape is versioned (`INPUT_SCHEMA_VERSION` in `src/tax/migrations.ts`, reported by `get_capabilities`). Version 2 renamed the version 1 fields (`V1_FIELD_RENAMES`; the table is in [mcp.md](mcp.md#input-schema-version-2)):

- The strict schema (MCP) rejects version 1 names with the rename map rather than calling them unknown.
- An input file saved at `schemaVersion` 1 is migrated by `migrateV1Inputs` on import and then strictly validated; files are written at `schemaVersion` 2.
- The browser key moved from `bt-inputs-v1` to `bt-inputs-v2` (`src/lib/inputStorage.ts`). The first load copies a version 1 value (or the pre-Bordertax key) once, without the single-value fields, and removes the old key.
- `tests/tax/migration.test.ts` runs version 1 inputs for every income year (sick days, deductions, mortgage, assessment, zero workdays) through the migration and checks the headline results against the version 1 engine to the cent (`tests/tax/fixtures/v1-inputs-results.json`). When the change was made the complete results were also compared field by field and differed only in the renamed fields.

## 5. Rounding

Tax rounding follows how the Belastingdienst computes the Dutch side and is applied only there: taxable income `round`, each bracket `floor`, premiums `floor`, the credit tables `ceil`, the rate-cap surcharge `round`. The Belgian side keeps full precision between calculation steps.

**Belgian figures are trimmed to cents at the engine boundary.** `calculateBETax` rounds every money figure of `BETaxResult` to two decimals once, when it builds the returned result (`roundToCents` in `src/tax/rounding.ts`), so the UI, the filing checklist and MCP clients see the same numbers and no longer get thirteen decimals. This is a presentation boundary, **not** a tax-rounding rule: the Belgian rounding rules could not be verified, so none is claimed, and intermediate steps are never rounded (communal tax, for example, is computed from the unrounded federal and regional saldi). Fractions (`beFraction`, `effectiveRateBE`) are not money and are not rounded. `TaxResult.totalTax`, `netIncome`, the mortgage effects and the comparison deltas are cleaned to cents so sums of integers and cents carry no floating-point noise. The golden tests still reproduce the ACV figures to the cent.

**Bracket bounds are data, not text.** `BracketLine` carries `from` and `to` (`to` is `null` for the open top bracket, since JSON has no Infinity) and no label. The UI formats the bounds per locale with `fmtBracket` in `src/components/format.ts`; MCP clients get the numbers.

## 6. Sources and verification status

| Area                                          | Source                                                                            | Status                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dutch brackets, premiums, credits (2020–2026) | Belastingdienst yearly tables                                                     | Taken from published tables. 2026 checked against the Belastingdienst pages (per `years/2026.ts`); 2024 checked against an actual Dutch assessment (per `years/2024.ts`) |
| Arbeidskorting                                | Belastingdienst                                                                   | Matches filed Dutch returns (see [#430](https://github.com/tjorim/bordertax/issues/430))                                                                                 |
| Algemene heffingskorting                      | Belastingdienst                                                                   | Applied to Belgian residents; the total credit reproduces the ACV example refund (see below)                                                                             |
| Belgian brackets, belastingvrije som, forfait | FOD Financiën                                                                     | Taken from published tables (2026 checked against the FOD Financiën pages, per `years/2026.ts`); not checked against assessments                                         |
| `gereduceerdRate`, `gewestelijkeRate`         | Belgian aanslagbiljet                                                             | Verified from the official aanslagbiljet for income year 2024 only (per `years/2024.ts`); the same values are used for the other years                                   |
| Eigenwoningforfait and mortgage rules         | Belastingdienst, Wet IB 2001                                                      | Verified per year in [hypotheekrenteaftrek-rules.md](hypotheekrenteaftrek-rules.md)                                                                                      |
| Salary-split method and worked example        | ACV telework info session, [PDF](../public/docs/ACV-Telewerk-Infosessie-2026.pdf) | Engine **differs** from the guideline ([Known gaps](#known-gaps))                                                                                                        | Engine follows the FOD guideline from the ACV session; the ACV premium/tax split differs ([Known gaps](#known-gaps)) | Whole calculator | —   | Not certified. "Checked" means a specific figure was compared, not that a full return was reproduced |

Income year 2026 (Belgian assessment year 2027) is enabled ([#144](https://github.com/tjorim/bordertax/issues/144)): every figure was taken from the official Belastingdienst and FOD Financiën pages listed in `years/2026.ts`, none is marked provisional there, and no 2026 assessment exists yet to compare against. The 2026 Dutch and Belgian results are therefore published-table results, not checked against a real aanslag.

## Known gaps

- **Premium base.** Premiums use the full gross salary (less any mortgage deduction) as worldwide income, with no other income, partial-year insurance or partner effects.
- **Dutch tax is an estimate until the assessment is entered.** Without `assessmentIncomeTaxDue` and `assessmentPremiumsDue` the Belgian side starts from the _calculated_ Dutch tax and the checklist marks the Belgian figures as provisional. With them, code 1250, O.1/O.2, total tax and net income are final, but the Dutch result itself (`nl`) is still the estimate, shown next to the assessment ([#432](https://github.com/tjorim/bordertax/issues/432)).

- **Credit bases are fitted on a few assessments.** The split in step 5 reproduces the arbeidskorting of one definitieve aanslag 2024 and the algemene heffingskorting of one 2023 assessment exactly. The arbeidskorting on that 2023 assessment (issued July 2026) instead equals the full-wage value for both parts, so assessments issued before the Belastingdienst changed its treatment (after the Hoge Raad rulings on heffingskortingen for non-residents) can be lower than the estimate. The estimate is therefore the more optimistic of the two readings; enter the assessed figures when they exist. The ACV worked example below uses the full-wage basis and lands about 1,100 euro under the engine's refund. More real assessments with part of the wage untaxed in the Netherlands would settle the rule ([#473](https://github.com/tjorim/bordertax/issues/473)).
- **Wage-base additions are not confirmed by an official text.** Adding the employee pension premium and exchanged gross wage to code 1250, and entering the commuting allowance at 1254/1255 and in O.2, follow the ACV formula and the Benelux brochure ("gross wage minus foreign tax and social contributions"); no FOD text names them. The own-car exemption is only known for income years 2025 and 2026, and a company car is not modelled ([#443](https://github.com/tjorim/bordertax/issues/443)).
- **ACV's premium/tax split differs from the Belastingdienst split.** The ACV worked example (wage €53,299, 2025) gives premiums due €5,874.66 and income tax due €2,713.34. The official 2025 split of the credits gives about €5,668 and €2,900. The difference (about €206) equals a 9.32/35.82 tax share, which is the 2024 tax-part rate mixed into the 2025 denominator. The engine follows the Belastingdienst split; ACV's figures are reproduced by entering them as the actual assessment ([#432](https://github.com/tjorim/bordertax/issues/432), `tests/tax/golden/acv.test.ts`). The ACV refund itself (€4,314) is no longer reproduced by the estimate (see the credit-bases gap above); it is reproduced when the assessed figures are entered.

`tests/tax/golden/acv.test.ts` asserts both ACV scenarios (no sick days; 25 sick days, fraction 50/205) to the cent with the assessment entered, and that the estimate alone now lands about 1,100 euro above ACV's refund. Further golden tests are tracked in [#436](https://github.com/tjorim/bordertax/issues/436).
