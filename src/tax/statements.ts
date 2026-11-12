import type { AnnualStatement } from "./schema";

export interface StatementTotals {
  /** Sum of the taxable wages on all annual statements. */
  taxableWage: number;
  /** Sum of the Dutch wage tax withheld on all annual statements. */
  wageTaxWithheld: number;
}

/**
 * Totals over the annual statements (jaaropgaven). The engine taxes the summed wage: the
 * heffingskortingen and the premiums are computed on it as for a single statement.
 */
export function sumAnnualStatements(statements: readonly AnnualStatement[]): StatementTotals {
  let taxableWage = 0;
  let wageTaxWithheld = 0;
  for (const statement of statements) {
    taxableWage += Math.max(0, statement.taxableWage);
    wageTaxWithheld += Math.max(0, statement.wageTaxWithheld);
  }
  return { taxableWage, wageTaxWithheld };
}
