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
        ].includes(field),
    ),
    units: {
      money: "EUR per year",
      communalTaxRate: { unit: "percent", min: 0, max: 15 },
      resultRatesAndShares: "fractions (0–1)",
      workdays: "day counts; fractional days allowed; sickDays count toward the annual maximum",
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
        assumptions: "qualifying debt, income statement and other unverified conditions",
      },
    },
    limitations: [
      "Full-year occupied main home only; positive home income and Wet Hillen not modelled",
      "Single person only",
      "Flemish region only",
      "NL-resident unsupported",
      "30% ruling unsupported for Belgian residents",
      "Simplified estimate, not tax advice",
      "Special social security contribution (BBSZ) and Belgian home benefits are not modelled",
    ],
  };
}
