import {
  MORTGAGE_QUALIFYING_MIN_NL_PERCENT,
  VALID_BELGIAN_REGIONS,
  VALID_CIVIL_STATUSES,
  VALID_RESIDENT_COUNTRIES,
  VALID_YEARS,
} from "./constants";
import { TaxInputFields } from "./schema";
import { getMaxDependentChildren } from "./strict";
import { getMaxDaysInYear } from "./workdays";

/** Machine-readable scope of the calculator; no browser or translation dependencies. */
export function getCapabilities() {
  return {
    supportedYears: [...VALID_YEARS],
    residentCountries: [...VALID_RESIDENT_COUNTRIES],
    civilStatuses: [...VALID_CIVIL_STATUSES],
    belgianRegions: [...VALID_BELGIAN_REGIONS],
    perYear: VALID_YEARS.map((year) => ({
      year,
      maxDependentChildren: getMaxDependentChildren(year),
      maxWorkdaysIncludingSickDays: getMaxDaysInYear(year),
    })),
    requiredInputs: Object.keys(TaxInputFields).filter(
      (field) =>
        ![
          "mortgageEnabled",
          "mortgageInterest",
          "mortgageOwnershipShare",
          "mortgageHomeValue",
          "incomeOutsideNL",
          "assessmentIncomeTaxDue",
          "assessmentPremiumsDue",
        ].includes(field),
    ),
    units: {
      money: "EUR per year",
      communalTaxRate: { unit: "percent", min: 0, max: 15 },
      resultRatesAndShares: "fractions (0–1)",
      workdays: "day counts; fractional days allowed; sickDays count toward the annual maximum",
    },
    resultShape: {
      belgianRounding:
        "Belgian money figures in result.be are rounded to whole cents when the result is built, for display; full precision is kept between calculation steps and no Belgian tax-rounding rule is claimed. Fractions (beFraction, effectiveRateBE) are not rounded. Dutch figures follow the Belastingdienst rounding",
      brackets:
        "result.nl.brackets lists { from, to, rate, taxableAmount, tax } in euros; to is null for the open-ended top bracket. There is no formatted label",
      noWorkdays:
        "result.noWorkdays is true when NL, Belgian, other and sick days add up to zero. The wage is then not sourced to either country: the Dutch and Belgian figures are all zero (no taxable income, premiums, credits or Belgian tax), total tax is only an entered assessment and net income equals gross salary. The figures mean something once workdays are entered",
      federalReductionsUnused:
        "result.be.federalReductionsUnused is the part of aanvullendPensioen × 30% plus roerendeVoorheffing (code 1437) that exceeds the reduced federal portion; the federal saldo is clamped at zero and the excess is not used or carried over. 0 when fully used",
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
    ],
  };
}
