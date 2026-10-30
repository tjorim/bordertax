/** Maximum share of workdays outside NL for the 90% worldwide-income test.
 * Zero also represents cases where no workday split can qualify (S <= 0 or O > S/9).
 * This salary-based estimate does not establish eligibility or verify documents.
 */
export function eligibilityThreshold(salary: number, incomeOutsideNL: number): number {
  if (salary <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - (0.9 * (salary + incomeOutsideNL)) / salary));
}
