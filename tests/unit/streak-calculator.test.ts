import { describe, expect, it } from "vitest";
import {
  calculateStreakUpdate,
  getLocalDateString,
  isStreakQualifyingAttempt,
} from "@/core/domain/streak-calculator";

describe("Streak & Timezone Engine (Domain Logic)", () => {
  describe("getLocalDateString", () => {
    it("TC-STRK-01: normalizes UTC timestamp to local date correctly across timezones", () => {
      // 2026-10-20 18:30:00 UTC is:
      // - 2026-10-21 01:30:00 in Asia/Ho_Chi_Minh (+7)
      // - 2026-10-20 14:30:00 in America/New_York (-4)
      const dateUtc = new Date("2026-10-20T18:30:00Z");

      const vnDate = getLocalDateString(dateUtc, "Asia/Ho_Chi_Minh");
      const nyDate = getLocalDateString(dateUtc, "America/New_York");
      const utcDate = getLocalDateString(dateUtc, "UTC");

      expect(vnDate).toBe("2026-10-21");
      expect(nyDate).toBe("2026-10-20");
      expect(utcDate).toBe("2026-10-20");
    });

    it("TC-STRK-02: falls back to Asia/Ho_Chi_Minh when invalid timezone is provided", () => {
      const dateUtc = new Date("2026-10-20T18:30:00Z");
      const fallbackDate = getLocalDateString(dateUtc, "Invalid/Timezone");

      expect(fallbackDate).toBe("2026-10-21");
    });
  });

  describe("isStreakQualifyingAttempt", () => {
    it("TC-STRK-03: qualifies when score >= 6000, duration >= 1000ms, and status is scored", () => {
      expect(
        isStreakQualifyingAttempt({
          status: "scored",
          overallScoreBp: 6000,
          audioDurationMs: 1000,
        }),
      ).toBe(true);

      expect(
        isStreakQualifyingAttempt({
          status: "scored",
          overallScoreBp: 8500,
          audioDurationMs: 2500,
        }),
      ).toBe(true);
    });

    it("TC-STRK-04: rejects attempts failing anti-cheat criteria", () => {
      // Score too low (< 6000 bp / 60.00%)
      expect(
        isStreakQualifyingAttempt({
          status: "scored",
          overallScoreBp: 5999,
          audioDurationMs: 2000,
        }),
      ).toBe(false);

      // Duration too short (< 1000ms)
      expect(
        isStreakQualifyingAttempt({
          status: "scored",
          overallScoreBp: 8000,
          audioDurationMs: 950,
        }),
      ).toBe(false);

      // Not scored
      expect(
        isStreakQualifyingAttempt({
          status: "pending",
          overallScoreBp: 8000,
          audioDurationMs: 2000,
        }),
      ).toBe(false);
    });
  });

  describe("calculateStreakUpdate", () => {
    it("TC-STRK-05: initializes streak to 1 for first-time learner", () => {
      const result = calculateStreakUpdate({
        lastActiveDate: null,
        currentStreakDays: 0,
        longestStreakDays: 0,
        streakFreezesAvailable: 1,
        practiceDate: "2026-10-21",
        isQualifying: true,
      });

      expect(result.currentStreakDays).toBe(1);
      expect(result.longestStreakDays).toBe(1);
      expect(result.lastActiveDate).toBe("2026-10-21");
      expect(result.streakIncreased).toBe(true);
      expect(result.usedFreeze).toBe(false);
      expect(result.streakFreezesAvailable).toBe(1);
    });

    it("TC-STRK-06: maintains streak without increment if already practiced today", () => {
      const result = calculateStreakUpdate({
        lastActiveDate: "2026-10-21",
        currentStreakDays: 5,
        longestStreakDays: 10,
        streakFreezesAvailable: 1,
        practiceDate: "2026-10-21",
        isQualifying: true,
      });

      expect(result.currentStreakDays).toBe(5);
      expect(result.longestStreakDays).toBe(10);
      expect(result.lastActiveDate).toBe("2026-10-21");
      expect(result.streakIncreased).toBe(false);
      expect(result.usedFreeze).toBe(false);
    });

    it("TC-STRK-07: increments streak when practicing on consecutive day", () => {
      const result = calculateStreakUpdate({
        lastActiveDate: "2026-10-20",
        currentStreakDays: 6,
        longestStreakDays: 6,
        streakFreezesAvailable: 1,
        practiceDate: "2026-10-21",
        isQualifying: true,
      });

      expect(result.currentStreakDays).toBe(7);
      expect(result.longestStreakDays).toBe(7);
      expect(result.lastActiveDate).toBe("2026-10-21");
      expect(result.streakIncreased).toBe(true);
      expect(result.usedFreeze).toBe(false);
      expect(result.streakBonusEligible).toBe(true); // 7-day milestone!
    });

    it("TC-STRK-08: rescues streak using available Streak Freeze when missed exactly 1 day", () => {
      // Last active: 2026-10-19. Practice today: 2026-10-21 (missed 2026-10-20)
      const result = calculateStreakUpdate({
        lastActiveDate: "2026-10-19",
        currentStreakDays: 5,
        longestStreakDays: 10,
        streakFreezesAvailable: 1,
        practiceDate: "2026-10-21",
        isQualifying: true,
      });

      expect(result.currentStreakDays).toBe(6); // Rescued and incremented
      expect(result.longestStreakDays).toBe(10);
      expect(result.lastActiveDate).toBe("2026-10-21");
      expect(result.streakIncreased).toBe(true);
      expect(result.usedFreeze).toBe(true);
      expect(result.streakFreezesAvailable).toBe(0); // 1 consumed
    });

    it("TC-STRK-09: resets streak to 1 when missed 1 day without available Streak Freeze", () => {
      const result = calculateStreakUpdate({
        lastActiveDate: "2026-10-19",
        currentStreakDays: 5,
        longestStreakDays: 10,
        streakFreezesAvailable: 0,
        practiceDate: "2026-10-21",
        isQualifying: true,
      });

      expect(result.currentStreakDays).toBe(1);
      expect(result.longestStreakDays).toBe(10);
      expect(result.lastActiveDate).toBe("2026-10-21");
      expect(result.streakIncreased).toBe(false);
      expect(result.usedFreeze).toBe(false);
    });

    it("TC-STRK-10: resets streak to 1 when gap is >= 2 days even with available freeze", () => {
      // Last active: 2026-10-18. Practice: 2026-10-21 (missed 2 days: 19th and 20th)
      const result = calculateStreakUpdate({
        lastActiveDate: "2026-10-18",
        currentStreakDays: 14,
        longestStreakDays: 20,
        streakFreezesAvailable: 2,
        practiceDate: "2026-10-21",
        isQualifying: true,
      });

      expect(result.currentStreakDays).toBe(1);
      expect(result.longestStreakDays).toBe(20);
      expect(result.lastActiveDate).toBe("2026-10-21");
      expect(result.usedFreeze).toBe(false);
      expect(result.streakFreezesAvailable).toBe(2); // Freeze not wasted on >1 day gap
    });

    it("TC-STRK-11: does not update streak if attempt is not qualifying", () => {
      const result = calculateStreakUpdate({
        lastActiveDate: "2026-10-20",
        currentStreakDays: 5,
        longestStreakDays: 10,
        streakFreezesAvailable: 1,
        practiceDate: "2026-10-21",
        isQualifying: false,
      });

      expect(result.currentStreakDays).toBe(5);
      expect(result.lastActiveDate).toBe("2026-10-20"); // Still yesterday
      expect(result.streakIncreased).toBe(false);
      expect(result.usedFreeze).toBe(false);
    });
  });
});
