import {
  MORTGAGE_QUALIFYING_MIN_NL_PERCENT,
  VALID_BELGIAN_REGIONS,
  VALID_CIVIL_STATUSES,
  VALID_RESIDENT_COUNTRIES,
  VALID_YEARS,
} from "./constants";
import { INPUT_FILE_SCHEMA_VERSION } from "./inputFile";
import { INPUT_SCHEMA_VERSION, V1_FIELD_RENAMES, V1_RESULT_RENAMES } from "./migrations";
import {
  BELGIAN_CODES,
  INPUT_GROUPS,
  MAX_ANNUAL_STATEMENTS,
  SINGLE_VALUE_DEFAULTS,
} from "./schema";
import { getMaxDependentChildren, StrictTaxInputSchema } from "./strict";
import { getMaxDaysInYear } from "./workdays";

const strictShape = StrictTaxInputSchema.in.shape;
type StrictField = keyof typeof strictShape;

/** Fields a caller must send: neither optional nor defaulted. */
const requiredInputs = (Object.keys(strictShape) as StrictField[]).filter(
  (field) => !strictShape[field].safeParse(undefined).success,
);

/** Machine-readable scope of the calculator; no browser or translation dependencies. */
export function getCapabilities() {
  return {
    inputSchema: {
      version: INPUT_SCHEMA_VERSION,
      inputFileSchemaVersion: INPUT_FILE_SCHEMA_VERSION,
      breakingChange:
        "Version 2 renamed the version 1 fields and rejects the old names; an input file saved with version 1 is migrated on import",
      renamedFromVersion1: { ...V1_FIELD_RENAMES },
      resultRenamedFromVersion1: { ...V1_RESULT_RENAMES },
      addedInVersion2: ["result.wageTaxWithheld"],
    },
    supportedYears: [...VALID_YEARS],
    residentCountries: [...VALID_RESIDENT_COUNTRIES],
    civilStatuses: [...VALID_CIVIL_STATUSES],
    belgianRegions: [...VALID_BELGIAN_REGIONS],
    perYear: VALID_YEARS.map((year) => ({
      year,
      maxDependentChildren: getMaxDependentChildren(year),
      maxWorkdaysIncludingSickDays: getMaxDaysInYear(year),
    })),
    requiredInputs,
    defaults: { ...SINGLE_VALUE_DEFAULTS, mortgageEnabled: false },
    /** Inputs by the document they are read from; `profile` and `home` are not documents. */
    sourceDocuments: {
      ...INPUT_GROUPS,
      annualTaxStatement: ["annualStatements[].taxableWage", "annualStatements[].wageTaxWithheld"],
    },
    belgianCodes: { ...BELGIAN_CODES },
    annualStatements: {
      min: 1,
      max: MAX_ANNUAL_STATEMENTS,
      fields: {
        taxableWage:
          "EUR per year, Taxable wage (Loon) on the annual tax statement (jaaropgave); not the gross salary",
        wageTaxWithheld: "EUR per year, Dutch wage tax withheld (loonheffing) on the statement",
      },
      combination:
        "Wages and withheld tax are summed; the heffingskortingen, premiums and both returns are computed on the total wage. result.taxableWage and result.wageTaxWithheld are the sums",
    },
    sickDays: {
      sickDaysNL:
        "sick days on days scheduled to be worked in the Netherlands; Dutch method counts them as NL workdays",
      sickDaysOutsideNL:
        "sick days on days scheduled in Belgium or a third country; Dutch method counts them as days outside NL (deel niet in NL belast)",
      belgianMethod:
        "the Belgian method leaves all sick days out of numerator and denominator (ACV/FOD material), so the Belgian-taxable share of the wage and the Dutch deel niet in NL belast differ when there are sick days",
      singleFieldDefault:
        "a caller with one sick-day figure sends it as sickDaysNL and sickDaysOutsideNL: 0",
    },
    units: {
      money: "EUR per year",
      communalTaxRate: { unit: "percent", min: 0, max: 15 },
      resultRatesAndShares: "fractions (0–1)",
      workdays:
        "day counts; fractional days allowed; sickDaysNL and sickDaysOutsideNL count toward the annual maximum",
    },
    resultShape: {
      belgianRounding:
        "Belgian money figures in result.be are rounded to whole cents when the result is built, for display; full precision is kept between calculation steps and no Belgian tax-rounding rule is claimed. Fractions (beFraction, effectiveRateBE) are not rounded. Dutch figures follow the Belastingdienst rounding",
      brackets:
        "result.nl.brackets lists { from, to, rate, taxableAmount, tax } in euros; to is null for the open-ended top bracket. There is no formatted label",
      noWorkdays:
        "result.noWorkdays is true when NL, Belgian, other and sick days add up to zero. The wage is then not sourced to either country: the Dutch and Belgian figures are all zero (no taxable income, premiums, credits or Belgian tax), total tax is only an entered assessment and net income equals the taxable wage. The figures mean something once workdays are entered",
      federalReductionsUnused:
        "result.be.federalReductionsUnused is the part of supplementaryPension × 30% plus reclaimableWithholdingTax (code 1437) that exceeds the reduced federal portion; the federal saldo is clamped at zero and the excess is not used or carried over. 0 when fully used",
    },
    dutchAssessment: {
      inputs: {
        assessmentIncomeTaxDue: {
          unit: "EUR per year, income tax due on the Dutch assessment after the heffingskortingen",
          optional: true,
          omittedMeaning: "the Dutch income tax is the engine's estimate",
        },
        assessmentPremiumsDue: {
          unit: "EUR per year, premies volksverzekeringen due on the Dutch assessment after the heffingskortingen",
          optional: true,
          omittedMeaning: "the Dutch premiums are the engine's estimate",
        },
      },
      mustBeGivenTogether: true,
      effect:
        "When both are given, code 1250, the FOD O.1/O.2 split, total tax and net income use them in place of the estimated Dutch charge; result.nl stays the estimate and result.nlCharge reports the source and the difference",
    },
    mortgage: {
      inputs: {
        mortgageEnabled: { default: false },
        mortgageHomeValue: {
          unit: "EUR, whole-home market value (WOZ-equivalent) at 1 January of the preceding year",
          optional: true,
          omittedMeaning: "interest-only upper estimate",
        },
        mortgageInterest: { unit: "EUR per year, whole qualifying loan", defaultWhenEnabled: 0 },
        mortgageOwnershipShare: { unit: "percent", min: 0, max: 100, defaultWhenEnabled: 100 },
        incomeOutsideNL: {
          unit: "EUR per year, worldwide income not taxed in NL (partner included)",
          optional: true,
          omittedMeaning: "unknown; never assumed zero",
        },
      },
      fieldsRequireEnabled: true,
      qualifyingMinNLPercent: MORTGAGE_QUALIFYING_MIN_NL_PERCENT,
      result: {
        disabled: null,
        statuses: {
          eligible: "NL income threshold met; other qualifying-debt conditions remain assumptions",
          ineligible: "NL income threshold not met or no NL income",
          unknown: "Income outside NL missing; salary alone meets the threshold",
        },
        nlTaxedPercent: "whole percent, rounded down; may be an upper bound",
        deductibleInterest: "EUR per year; interest multiplied by ownership share",
        eigenwoningforfait: "EUR per year; whole-home forfait multiplied by ownership share",
        netDeduction: "max(0, deductibleInterest minus eigenwoningforfait)",
        benefitIsUpperBound: "true when home value is missing",
        applied: "true only when eligible and net deduction is positive",
        potential: "EUR per year: nlTaxSaving, beTaxIncrease, netBenefit if eligible",
        realised: "EUR per year: actual effect in totals; zero when not applied",
        reasons: "machine-readable explanations for eligibility and missing interest",
        assumptions:
          "qualifying debt, income statement (income years up to 2025; only on request from 2026) and other unverified conditions",
      },
    },
    limitations: [
      "Full-year occupied main home only; a positive foreign-home balance is not Dutch income for a qualifying non-resident (zero deduction); its small premium and algemene heffingskorting effect is not modelled",
      "Single person only",
      "Flemish region only",
      "NL-resident unsupported",
      "30% ruling unsupported for Belgian residents",
      "Simplified estimate, not tax advice",
      "Special social security contribution (BBSZ) and Belgian home benefits are not modelled",
      "The employee share of a Dutch pension premium is not added back to code 1250; supplementaryPension only drives the 30% federal reduction (code 1285). Check the treatment with FOD Financiën or a tax adviser",
      "An untaxed commuting allowance (codes 1254/1255), a company car (Dutch versus Belgian addition) and gross wage exchanged for tax-free benefits are not modelled",
    ],
  };
}
