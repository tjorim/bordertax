/**
 * Figures of the salary-split reference page that come from the ACV information session slides
 * (a fixed document), as opposed to the Dutch rates, which are derived from the tax parameters
 * (`nlReferenceRates`). Source: ACV information session, see `ACV_SESSION`.
 * Shares are fractions (0.49 = 49%), money is whole euros.
 */

/** Social-security framework agreement for telework (ACV slides). */
export const TELEWORK_AGREEMENT = {
  /** Maximum share of telework in the country of residence. */
  maxTeleworkShare: 0.49,
  effectiveDate: "2023-07-01",
  a1ValidityYears: 3,
  retroactivityFrom: "2024-07-01",
  retroactivityMaxMonths: 3,
} as const;

/** Combinatiekorting maximum quoted by ACV; not a calculator parameter. */
export const COMBINATIEKORTING_MAX = 3032;

export interface Fraction {
  days: number;
  base: number;
}

/**
 * Worked example, source: ACV session. Typed once; `salarySplitExample` derives what follows from
 * these figures (base W, BE share, net benefit, fractions) so the page cannot disagree with itself.
 */
export const SALARY_SPLIT_EXAMPLE_INPUT = {
  incomeYear: 2025,
  publicHolidays: 6,
  vacationDays: 25,
  teleworkDays: 50,
  sickDays: 25,
  fiscalWage: 53299,
  withheldWageTax: 12902,
  travelAllowance: 3889,
  healthPremium: 1560,
  /** NL taxable fraction used for the Dutch return. */
  nlFraction: { days: 181, base: 231 },
  /** BE fraction without sick days. */
  beFraction: { days: 180, base: 230 },
  /** Municipal tax (example municipality) on the NL net wage, and its rate. */
  officeOnly: { beTax: 600, municipalTaxRate: 0.06 },
  scenarioA: { nlTaxable: 41763, nlRefund: 4314, y: 10310, z: 34401, beTax: 3277 },
  scenarioB: { nlRefund: 4314, y: 11561, z: 33150, beTax: 3600 },
} as const;

const input = SALARY_SPLIT_EXAMPLE_INPUT;

export interface SalarySplitExample {
  input: typeof SALARY_SPLIT_EXAMPLE_INPUT;
  /** Base W: fiscal wage minus the Dutch tax actually due (withheld − refund). */
  baseW: number;
  /** Gross share taxable in Belgium (fiscal wage − NL taxable). */
  beShareGross: number;
  /** BE fraction with the sick days removed from both days and base. */
  sickFraction: Fraction;
  /** Belgian share of the days without / with sick days (telework days ÷ base). */
  beShareNoSick: number;
  beShareSick: number;
  netBenefitA: number;
  netBenefitB: number;
}

export function salarySplitExample(): SalarySplitExample {
  const a = input.scenarioA;
  const b = input.scenarioB;
  const sickFraction = {
    days: input.beFraction.days - input.sickDays,
    base: input.beFraction.base - input.sickDays,
  };
  return {
    input,
    baseW: input.fiscalWage - (input.withheldWageTax - a.nlRefund),
    beShareGross: input.fiscalWage - a.nlTaxable,
    sickFraction,
    beShareNoSick: input.teleworkDays / input.beFraction.base,
    beShareSick: input.teleworkDays / sickFraction.base,
    netBenefitA: a.nlRefund - a.beTax,
    netBenefitB: b.nlRefund - b.beTax,
  };
}
