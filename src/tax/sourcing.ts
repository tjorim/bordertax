/**
 * The two returns split the wage with different workday fractions when there are sick days. The
 * Dutch return counts a sick day for the country it was scheduled in; the Belgian return (ACV/FOD
 * material) leaves every sick day out of both counts. This compares the two splits on the same
 * base, the taxable wage, so the part taxed twice (or by neither country) can be shown.
 */
import { roundToCents } from "./rounding";
import type { TaxResult } from "./types";
import { getNLFractions } from "./workdays";

export interface SourcingComparison {
  /** True when sick days make the two fractions (can) differ; otherwise both splits agree. */
  applies: boolean;
  /** Dutch method: share of the wage outside the Netherlands. */
  dutchShareOutsideNL: number;
  /** Dutch return: deel niet in NL belast, the wage the Netherlands leaves untaxed. */
  notTaxedInNL: number;
  /** Belgian method: share of the wage outside the Netherlands (the O.1 fraction). */
  belgianShareOutsideNL: number;
  /** Belgian method applied to the whole taxable wage. */
  belgianTaxableShareOfWage: number;
  /** Box IV O.1: the Belgian share applied to the wage after the Dutch premiums. */
  o1: number;
  /** Box IV O.2 code 1250: code 1250 minus O.1. */
  o2: number;
  /** Wage the Netherlands taxes that the Belgian split also treats as Belgian-taxable. */
  doubleTaxationRisk: number;
  /** Wage the Netherlands leaves untaxed that the Belgian split treats as exempt. */
  taxedByNeither: number;
}

export function compareSourcing(result: TaxResult): SourcingComparison {
  const { sickDays, beFraction } = getNLFractions(result.inputs);
  const notTaxedInNL = result.nl.deelNietInNLBelast;
  const belgianTaxableShareOfWage = roundToCents(result.taxableWage * beFraction);
  const difference = roundToCents(belgianTaxableShareOfWage - notTaxedInNL);
  const o1 = result.be?.beIncome ?? 0;
  return {
    applies: sickDays > 0 && !result.noWorkdays && result.be !== null,
    dutchShareOutsideNL: 1 - result.nlFractionDutchMethod,
    notTaxedInNL,
    belgianShareOutsideNL: beFraction,
    belgianTaxableShareOfWage,
    o1,
    o2: roundToCents(Math.max(0, (result.be?.declaredIncome ?? 0) - o1)),
    doubleTaxationRisk: Math.max(0, difference),
    taxedByNeither: Math.max(0, -difference),
  };
}
