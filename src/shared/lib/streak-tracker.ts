/**
 * Real Calendar-Day Streak Calculator.
 * Tracks authentic consecutive daily visits without mock data.
 * If user skips a day, streak resets to 1 day.
 */

const STREAK_KEY = "ast3d_real_daily_streak";

interface StoredStreakData {
  streak: number;
  lastDate: string; // "YYYY-MM-DD"
}

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

export function getRealDailyStreak(): number {
  if (typeof window === "undefined") return 1;

  try {
    const today = getLocalDateString();
    const yesterday = getYesterdayDateString();

    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) {
      // First visit: initialize with 1 day
      const initial: StoredStreakData = { streak: 1, lastDate: today };
      localStorage.setItem(STREAK_KEY, JSON.stringify(initial));
      return 1;
    }

    const data: StoredStreakData = JSON.parse(raw);

    if (data.lastDate === today) {
      // Already recorded today, maintain current streak count
      return Math.max(1, data.streak);
    }

    if (data.lastDate === yesterday) {
      // Consecutive day! Advance streak by +1
      const updated: StoredStreakData = {
        streak: data.streak + 1,
        lastDate: today,
      };
      localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
      return updated.streak;
    }

    // Missed at least 1 day: Streak broken, reset back to 1
    const resetData: StoredStreakData = {
      streak: 1,
      lastDate: today,
    };
    localStorage.setItem(STREAK_KEY, JSON.stringify(resetData));
    return 1;
  } catch {
    return 1;
  }
}
