/**
 * Rounds a money amount to whole cents. Used only when a result is built for display or MCP;
 * calculation steps keep full precision. No Belgian tax-rounding rule is implied.
 */
export function roundToCents(value: number): number {
  // `+ 0` turns a rounded -0 into 0.
  return Math.round(value * 100) / 100 + 0;
}
