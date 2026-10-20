/**
 * Pronunciation scoring primitives.
 *
 * All scores are integers expressed in basis points (0..10000) to stay aligned
 * with the PostgreSQL schema (integer-only numerics, no floating-point drift).
 * UI layers convert to percentages only at render time.
 */

export const SCORE_BP_MIN = 0;
export const SCORE_BP_MAX = 10_000;

/** Severity buckets mapped 1:1 to Design DNA status colors (green / yellow / red). */
export type FeedbackSeverity = "good" | "minor" | "major";

export interface SeverityThresholds {
  /** Inclusive lower bound for "good" (green). */
  readonly goodMinBp: number;
  /** Inclusive lower bound for "minor" (yellow). Below this is "major" (red). */
  readonly minorMinBp: number;
}

export const DEFAULT_SEVERITY_THRESHOLDS: SeverityThresholds = {
  goodMinBp: 8_000,
  minorMinBp: 6_000,
};

export class InvalidScoreError extends Error {
  constructor(readonly value: number) {
    super(`Score must be an integer between ${SCORE_BP_MIN} and ${SCORE_BP_MAX} basis points, received: ${value}`);
    this.name = "InvalidScoreError";
  }
}

export function assertScoreBp(value: number): void {
  if (!Number.isInteger(value) || value < SCORE_BP_MIN || value > SCORE_BP_MAX) {
    throw new InvalidScoreError(value);
  }
}

export function classifySeverity(
  scoreBp: number,
  thresholds: SeverityThresholds = DEFAULT_SEVERITY_THRESHOLDS,
): FeedbackSeverity {
  assertScoreBp(scoreBp);
  if (scoreBp >= thresholds.goodMinBp) return "good";
  if (scoreBp >= thresholds.minorMinBp) return "minor";
  return "major";
}

/** Converts basis points to a whole-number percentage for display (e.g. 8750 -> 88). */
export function toDisplayPercent(scoreBp: number): number {
  assertScoreBp(scoreBp);
  return Math.round(scoreBp / 100);
}
