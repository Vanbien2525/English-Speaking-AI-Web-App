/**
 * Formats a basis points score (0..10000) into a percentage string (e.g. 8500 -> '85.00%').
 * Inputs are clamped between 0 and 10000.
 *
 * @param score - Basis points score (0 to 10000)
 * @returns Formatted percentage string
 */
export function formatScoreBasisPoints(score: number): string {
  const clamped = Math.max(0, Math.min(10000, score));
  const percentage = clamped / 100;
  return `${percentage.toFixed(2)}%`;
}
