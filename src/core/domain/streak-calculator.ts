export function getLocalDateString(date: Date, timezone?: string): string {
  const targetTz = timezone || "Asia/Ho_Chi_Minh";

  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: targetTz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch {
    const fallbackFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fallbackFormatter.format(date);
  }
}

export interface QualifyingAttemptInput {
  status: string;
  overallScoreBp?: number | null;
  audioDurationMs?: number | null;
}

export function isStreakQualifyingAttempt(attempt: QualifyingAttemptInput): boolean {
  if (attempt.status !== "scored") return false;
  if (attempt.overallScoreBp === null || attempt.overallScoreBp === undefined) return false;
  if (attempt.audioDurationMs === null || attempt.audioDurationMs === undefined) return false;

  return attempt.overallScoreBp >= 6000 && attempt.audioDurationMs >= 1000;
}

export interface CalculateStreakInput {
  lastActiveDate: string | null;
  currentStreakDays: number;
  longestStreakDays: number;
  streakFreezesAvailable: number;
  practiceDate: string; // YYYY-MM-DD
  isQualifying: boolean;
}

export interface StreakUpdateResult {
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveDate: string;
  streakFreezesAvailable: number;
  streakIncreased: boolean;
  usedFreeze: boolean;
  streakBonusEligible?: boolean;
}

const STREAK_MILESTONES = new Set([7, 14, 30, 60, 100, 365]);

export function calculateStreakUpdate(input: CalculateStreakInput): StreakUpdateResult {
  if (!input.isQualifying) {
    return {
      currentStreakDays: input.currentStreakDays,
      longestStreakDays: input.longestStreakDays,
      lastActiveDate: input.lastActiveDate ?? input.practiceDate,
      streakFreezesAvailable: input.streakFreezesAvailable,
      streakIncreased: false,
      usedFreeze: false,
      streakBonusEligible: false,
    };
  }

  // First time ever practicing
  if (!input.lastActiveDate) {
    return {
      currentStreakDays: 1,
      longestStreakDays: Math.max(1, input.longestStreakDays),
      lastActiveDate: input.practiceDate,
      streakFreezesAvailable: input.streakFreezesAvailable,
      streakIncreased: true,
      usedFreeze: false,
      streakBonusEligible: false,
    };
  }

  // Practiced again on the same calendar day
  if (input.lastActiveDate === input.practiceDate) {
    return {
      currentStreakDays: input.currentStreakDays,
      longestStreakDays: input.longestStreakDays,
      lastActiveDate: input.practiceDate,
      streakFreezesAvailable: input.streakFreezesAvailable,
      streakIncreased: false,
      usedFreeze: false,
      streakBonusEligible: false,
    };
  }

  const lastDate = new Date(`${input.lastActiveDate}T00:00:00Z`);
  const currDate = new Date(`${input.practiceDate}T00:00:00Z`);
  const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  // Exactly consecutive calendar day (e.g. yesterday -> today)
  if (diffDays === 1) {
    const newStreak = input.currentStreakDays + 1;
    const newLongest = Math.max(newStreak, input.longestStreakDays);
    return {
      currentStreakDays: newStreak,
      longestStreakDays: newLongest,
      lastActiveDate: input.practiceDate,
      streakFreezesAvailable: input.streakFreezesAvailable,
      streakIncreased: true,
      usedFreeze: false,
      streakBonusEligible: STREAK_MILESTONES.has(newStreak),
    };
  }

  // Missed exactly 1 day (e.g. day 19 -> day 21, diff is 2)
  if (diffDays === 2) {
    if (input.streakFreezesAvailable > 0) {
      // Streak freeze rescue!
      const newStreak = input.currentStreakDays + 1;
      const newLongest = Math.max(newStreak, input.longestStreakDays);
      return {
        currentStreakDays: newStreak,
        longestStreakDays: newLongest,
        lastActiveDate: input.practiceDate,
        streakFreezesAvailable: input.streakFreezesAvailable - 1,
        streakIncreased: true,
        usedFreeze: true,
        streakBonusEligible: STREAK_MILESTONES.has(newStreak),
      };
    }

    // Broken streak
    return {
      currentStreakDays: 1,
      longestStreakDays: input.longestStreakDays,
      lastActiveDate: input.practiceDate,
      streakFreezesAvailable: 0,
      streakIncreased: false,
      usedFreeze: false,
      streakBonusEligible: false,
    };
  }

  // Missed 2 or more days (diff > 2)
  return {
    currentStreakDays: 1,
    longestStreakDays: input.longestStreakDays,
    lastActiveDate: input.practiceDate,
    streakFreezesAvailable: input.streakFreezesAvailable,
    streakIncreased: false,
    usedFreeze: false,
    streakBonusEligible: false,
  };
}
