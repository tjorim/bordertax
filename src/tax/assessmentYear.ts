/**
 * The Belgian assessment year (aanslagjaar) of an income year (inkomstenjaar): the year in which
 * the return for that income is filed, always one more. Belgian portals only use this number, so
 * every place that names an income year derives the aanslagjaar from here.
 */
export function assessmentYear(incomeYear: number): number {
  return incomeYear + 1;
}

/** Message parameters for an income year: `{ year, assessmentYear }`. */
export function yearParams(incomeYear: number): { year: number; assessmentYear: number } {
  return { year: incomeYear, assessmentYear: assessmentYear(incomeYear) };
}
