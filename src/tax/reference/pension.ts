/**
 * Pension reference figures. Source: ACV information session (`ACV_SESSION`), figures as at
 * 1 January 2026 unless noted. None of them is a calculator parameter, so they are typed here
 * once; the only tax parameter the page needs (the premium ceiling) comes from `nlReferenceRates`.
 * Shares are fractions (0.02 = 2%), money is euros.
 */

export interface AgeYearsMonths {
  years: number;
  /** A single number of months, or an inclusive range for years that depend on the birth month. */
  months?: number | readonly [number, number];
}

export interface PeriodRow {
  from?: number;
  to?: number;
}

export const AOW = {
  accrualPerYear: 0.02,
  /** AOW premium share within the combined volksverzekeringen rate (ACV; the calculator holds the sum). */
  premiumRate: 0.179,
  single: { share: 0.7, monthly: 1637.57, holidayMonthly: 106.55 },
  couple: { share: 0.5, monthly: 1122.12, holidayMonthly: 76.1 },
  exampleInsuredYears: 30,
  /** AOW age from 2024 to 2027 and from 2028 to 2031, then the coalition agreement (years only). */
  ageNow: { years: 67 },
  ageFrom2028: { years: 67, months: 3 },
  ageFuture: 70,
  history: [
    { period: { from: 2012 }, age: { years: 65 } },
    { period: { from: 2013 }, age: { years: 65, months: 1 } },
    { period: { from: 2014, to: 2015 }, age: { years: 65, months: [2, 3] } },
    { period: { from: 2016 }, age: { years: 65, months: 6 } },
    { period: { from: 2017 }, age: { years: 65, months: 9 } },
    { period: { from: 2018 }, age: { years: 66 } },
    { period: { from: 2019, to: 2021 }, age: { years: 66, months: 4 } },
    { period: { from: 2022 }, age: { years: 66, months: 7 } },
    { period: { from: 2023 }, age: { years: 66, months: 10 } },
    { period: { from: 2024, to: 2027 }, age: { years: 67 } },
    { period: { from: 2028, to: 2031 }, age: { years: 67, months: 3 } },
  ] as readonly { period: PeriodRow; age: AgeYearsMonths }[],
} as const;

export const ANW = {
  monthly: 1668.49,
  /** Benefit as a share of the net minimum wage. */
  netMinimumWageShare: 0.7,
  holidayMonthly: 128.18,
  maxChildAge: 18,
  minDisability: 0.45,
  orphanMaxAge: 21,
  exemptMonthly: 1147,
  maxIncomeMonthly: 3617,
  maxBenefitsMonthly: 1646,
} as const;

export const SUPPLEMENTARY = {
  /** Total pension pot in billions of euros. */
  potBillions: 1300,
  industryFunds: 200,
  cashOutBelowYearly: 632,
  partnerShare: 0.7,
} as const;

export const RVU = {
  maxMonthly: 2357,
  monthsBeforeAowAge: 36,
} as const;

export const DEDUCTIONS = {
  treatyFactor: 0.8165,
  zvwRate: 0.0485,
  zvwMaxIncome: 79409,
  nominalMonthly: 128.19,
  wlzRate: 0.0965,
} as const;

export interface CareerRow {
  age: number | readonly [number, number];
  careerYears: number;
  /** From 2027: required effective working days for a shorter career (e.g. 42 years + 234 days). */
  extraDays?: number;
}

export const BE_PENSION = {
  statutoryAge: 66,
  statutoryAgeFrom2030: 67,
  fullCareerDays: 14040,
  daysPerCareerYear: 104,
  earliestAge: 60,
  earliestCareerYears: 44,
  wageCeilingYearly: 82608,
  maxFamilyMonthly: 4077,
  maxSingleMonthly: 3262,
  applicationMonthsAhead: 12,
  earliest2026: [
    { age: 60, careerYears: 44 },
    { age: [61, 62], careerYears: 43 },
    { age: [63, 64], careerYears: 42 },
  ] as readonly CareerRow[],
  /** Rules from 2027: 156 effective working days per career year. */
  from2027: {
    daysPerCareerYear: 156,
    rows: [
      { age: 60, careerYears: 44 },
      { age: 60, careerYears: 42, extraDays: 234 },
      { age: 61, careerYears: 43 },
      { age: 62, careerYears: 43 },
      { age: 63, careerYears: 42 },
      { age: 64, careerYears: 42 },
      { age: 65, careerYears: 42 },
    ] as readonly CareerRow[],
  },
  /** Penalty / bonus per year, by birth-year group (2027 rules). */
  malusMinYears: 35,
  malusMinDays: 7020,
  malus: [
    { birth: { from: 1961, to: 1965 }, rate: 0.02 },
    { birth: { from: 1966, to: 1974 }, rate: 0.04 },
    { birth: { from: 1975 }, rate: 0.05 },
  ] as readonly { birth: PeriodRow; rate: number }[],
  bonus: [
    { birth: { to: 1962 }, rate: 0.02 },
    { birth: { from: 1963, to: 1972 }, rate: 0.04 },
    { birth: { from: 1973 }, rate: 0.05 },
  ] as readonly { birth: PeriodRow; rate: number }[],
  /** Health-insurance (ZIV) deduction on the Belgian pension. */
  ziv: {
    rate: 0.0355,
    single: { lowerMonthly: 2078.46, upperMonthly: 2154.94, subtract: 2078.45 },
    family: { lowerMonthly: 2463.25, upperMonthly: 2553.89, subtract: 2463.24 },
    solidarityRateFrom: 0.005,
    solidarityRateTo: 0.02,
    solidarityAboveSingleMonthly: 3682,
    solidarityAboveFamilyMonthly: 4212,
  },
} as const;

/** The "30 years of border work" example: accrual and the resulting monthly amounts (truncated, as in the ACV slides). */
export function aowExample() {
  const accrued = AOW.exampleInsuredYears * AOW.accrualPerYear;
  return {
    insuredYears: AOW.exampleInsuredYears,
    accrued,
    single: Math.floor(accrued * AOW.single.monthly),
    couple: Math.floor(accrued * AOW.couple.monthly),
  };
}
