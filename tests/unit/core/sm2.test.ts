import { describe, it, expect } from "vitest";
import {
  calculateSm2,
  calculateQualityFromScore,
  calculateXpFromQuality,
  SM2_DEFAULT_EASE_FACTOR_BP,
  SM2_MIN_EASE_FACTOR_BP,
} from "@/core/domain/sm2";

describe("SM-2 Spaced Repetition Domain Math", () => {
  const baseDate = new Date("2026-10-21T00:00:00Z");

  describe("calculateQualityFromScore", () => {
    it("assigns q=5 for scores >= 9000 (90%)", () => {
      expect(calculateQualityFromScore(10000)).toBe(5);
      expect(calculateQualityFromScore(9000)).toBe(5);
    });

    it("assigns q=4 for scores 8000..8999 (80-89%)", () => {
      expect(calculateQualityFromScore(8500)).toBe(4);
      expect(calculateQualityFromScore(8000)).toBe(4);
    });

    it("assigns q=2 (fail) for scores 6000..7999 (< 80% Speaking Mastery Threshold)", () => {
      expect(calculateQualityFromScore(7999)).toBe(2);
      expect(calculateQualityFromScore(6500)).toBe(2);
    });

    it("assigns q=1 for scores 4000..5999", () => {
      expect(calculateQualityFromScore(4500)).toBe(1);
    });

    it("assigns q=0 for scores < 4000", () => {
      expect(calculateQualityFromScore(2500)).toBe(0);
      expect(calculateQualityFromScore(0)).toBe(0);
    });
  });

  describe("calculateXpFromQuality", () => {
    it("awards 25 XP for excellent quality (q=5)", () => {
      expect(calculateXpFromQuality(5)).toBe(25n);
    });

    it("awards 15 XP for passing quality (q=4)", () => {
      expect(calculateXpFromQuality(4)).toBe(15n);
    });

    it("awards 0 XP for failed quality (q < 4)", () => {
      expect(calculateXpFromQuality(2)).toBe(0n);
      expect(calculateXpFromQuality(1)).toBe(0n);
      expect(calculateXpFromQuality(0)).toBe(0n);
    });
  });

  describe("calculateSm2 Algorithm Transitions", () => {
    it("resets repetition to 0 and interval to 1 day on failed quality (q < 3)", () => {
      const output = calculateSm2(
        {
          qualityGrade: 2,
          repetitionCount: 4,
          intervalDays: 15,
          easeFactorBp: 2500,
        },
        baseDate,
      );

      expect(output.isPassed).toBe(false);
      expect(output.repetitionCount).toBe(0);
      expect(output.intervalDays).toBe(1);
      // deltaEfBp for q=2: qDiff=3 -> 100 - 3 * (80 + 3 * 20) = 100 - 3 * 140 = 100 - 420 = -320
      expect(output.easeFactorBp).toBe(2500 - 320); // 2180
      expect(output.nextReviewDate.toISOString()).toBe("2026-10-22T00:00:00.000Z");
    });

    it("advances to interval=1 on first successful repetition (n=0 -> n=1)", () => {
      const output = calculateSm2(
        {
          qualityGrade: 4,
          repetitionCount: 0,
          intervalDays: 1,
          easeFactorBp: SM2_DEFAULT_EASE_FACTOR_BP,
        },
        baseDate,
      );

      expect(output.isPassed).toBe(true);
      expect(output.repetitionCount).toBe(1);
      expect(output.intervalDays).toBe(1);
      expect(output.nextReviewDate.toISOString()).toBe("2026-10-22T00:00:00.000Z");
    });

    it("advances to interval=6 on second successful repetition (n=1 -> n=2)", () => {
      const output = calculateSm2(
        {
          qualityGrade: 5,
          repetitionCount: 1,
          intervalDays: 1,
          easeFactorBp: SM2_DEFAULT_EASE_FACTOR_BP,
        },
        baseDate,
      );

      expect(output.isPassed).toBe(true);
      expect(output.repetitionCount).toBe(2);
      expect(output.intervalDays).toBe(6);
      expect(output.nextReviewDate.toISOString()).toBe("2026-10-27T00:00:00.000Z");
    });

    it("scales interval by ease factor on subsequent repetitions (n >= 2)", () => {
      const output = calculateSm2(
        {
          qualityGrade: 5,
          repetitionCount: 2,
          intervalDays: 6,
          easeFactorBp: 2500,
        },
        baseDate,
      );

      expect(output.isPassed).toBe(true);
      expect(output.repetitionCount).toBe(3);
      // q=5: deltaEf = 100. New EF = 2600.
      // Next interval = round(6 * 2600 / 1000) = 15.6 -> 16 days
      expect(output.easeFactorBp).toBe(2600);
      expect(output.intervalDays).toBe(16);
      expect(output.nextReviewDate.toISOString()).toBe("2026-11-06T00:00:00.000Z");
    });

    it("enforces minimum ease factor floor (EF >= 1300 / 1.30)", () => {
      const output = calculateSm2(
        {
          qualityGrade: 0,
          repetitionCount: 2,
          intervalDays: 6,
          easeFactorBp: 1400,
        },
        baseDate,
      );

      expect(output.isPassed).toBe(false);
      // q=0: deltaEf is large negative, but easeFactor must not drop below 1300
      expect(output.easeFactorBp).toBe(SM2_MIN_EASE_FACTOR_BP);
    });
  });
});
