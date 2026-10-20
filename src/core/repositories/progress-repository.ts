import crypto from "node:crypto";
import type { XpSource } from "@/core/dto/progress.dto";
import { calculateStreakUpdate } from "@/core/domain/streak-calculator";

export interface UserStatsRecord {
  userId: string;
  totalXp: bigint;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveDate: string | null;
  lessonsCompleted: number;
  streakFreezesAvailable: number;
  version: number;
  updatedAt: Date;
}

export interface XpLedgerRecord {
  id: string;
  userId: string;
  amount: bigint;
  balanceAfter: bigint;
  source: XpSource;
  referenceId: string | null;
  idempotencyKey: string;
  createdAt: Date;
}

export interface PhonemeMasteryRecord {
  userId: string;
  ipa: string;
  manner: string;
  attemptsCount: number;
  scoreSumBp: bigint;
}

export interface AttemptHistoryRecord {
  date: string;
  averageScoreBp: number;
  attemptsCount: number;
}

export interface UserProfileRecord {
  id: string;
  displayName: string;
  email: string;
}

export interface AwardXpInput {
  userId: string;
  amount: bigint;
  source: XpSource;
  referenceId: string | null;
  idempotencyKey: string;
  practiceDate: string; // YYYY-MM-DD
  isQualifyingForStreak: boolean;
}

export interface LeaderboardRow {
  userId: string;
  displayName: string;
  score: bigint;
  streakDays?: number;
  rank: number;
}

export interface ProgressRepository {
  getUser(userId: string): Promise<UserProfileRecord | null>;
  getUserStats(userId: string): Promise<UserStatsRecord | null>;
  getXpLedger(userId: string, limit?: number): Promise<XpLedgerRecord[]>;
  getPhonemeMastery(userId: string): Promise<PhonemeMasteryRecord[]>;
  getAttemptHistory(userId: string, days?: number): Promise<AttemptHistoryRecord[]>;
  awardXp(input: AwardXpInput): Promise<{
    userStats: UserStatsRecord;
    ledgerEntry: XpLedgerRecord;
    newTotalXp: bigint;
  }>;
  getAllTimeLeaderboard(limit?: number): Promise<LeaderboardRow[]>;
  getWeeklyLeaderboard(limit?: number): Promise<LeaderboardRow[]>;
}

export class InMemoryProgressRepository implements ProgressRepository {
  private users: Map<string, UserProfileRecord> = new Map();
  private userStats: Map<string, UserStatsRecord> = new Map();
  private xpLedger: Map<string, XpLedgerRecord[]> = new Map();
  private phonemeMastery: Map<string, PhonemeMasteryRecord[]> = new Map(); // userId -> list
  private attemptHistory: Map<string, AttemptHistoryRecord[]> = new Map(); // userId -> list
  private idempotencyIndex: Map<string, XpLedgerRecord> = new Map(); // `${userId}:${idempotencyKey}` -> record
  private lockedUsers: Set<string> = new Set();
  private simulateTransactionError = false;

  setSimulateTransactionError(value: boolean): void {
    this.simulateTransactionError = value;
  }

  seedUser(user: UserProfileRecord): void {
    this.users.set(user.id, { ...user });
  }

  seedUserStats(stats: UserStatsRecord): void {
    this.userStats.set(stats.userId, { ...stats });
  }

  seedPhonemeMastery(records: PhonemeMasteryRecord[]): void {
    for (const r of records) {
      const list = this.phonemeMastery.get(r.userId) ?? [];
      list.push({ ...r });
      this.phonemeMastery.set(r.userId, list);
    }
  }

  seedAttemptHistory(userId: string, records: AttemptHistoryRecord[]): void {
    const list = this.attemptHistory.get(userId) ?? [];
    this.attemptHistory.set(userId, [...list, ...records.map((r) => ({ ...r }))]);
  }

  seedXpLedger(entries: XpLedgerRecord[]): void {
    for (const entry of entries) {
      const userList = this.xpLedger.get(entry.userId) ?? [];
      userList.push({ ...entry });
      this.xpLedger.set(entry.userId, userList);
      this.idempotencyIndex.set(`${entry.userId}:${entry.idempotencyKey}`, entry);
    }
  }

  async getUser(userId: string): Promise<UserProfileRecord | null> {
    const u = this.users.get(userId);
    return u ? { ...u } : null;
  }

  async getUserStats(userId: string): Promise<UserStatsRecord | null> {
    const s = this.userStats.get(userId);
    return s ? { ...s } : null;
  }

  async getXpLedger(userId: string, limit = 20): Promise<XpLedgerRecord[]> {
    const list = this.xpLedger.get(userId) ?? [];
    return list
      .slice(-limit)
      .reverse()
      .map((item) => ({ ...item }));
  }

  async getPhonemeMastery(userId: string): Promise<PhonemeMasteryRecord[]> {
    const list = this.phonemeMastery.get(userId) ?? [];
    return list.map((item) => ({ ...item }));
  }

  async getAttemptHistory(userId: string, days = 30): Promise<AttemptHistoryRecord[]> {
    const list = this.attemptHistory.get(userId) ?? [];
    return list.slice(-days).map((item) => ({ ...item }));
  }

  async awardXp(input: AwardXpInput): Promise<{
    userStats: UserStatsRecord;
    ledgerEntry: XpLedgerRecord;
    newTotalXp: bigint;
  }> {
    const idKey = `${input.userId}:${input.idempotencyKey}`;

    // 1. Check idempotency violation (return existing state if already applied)
    if (this.idempotencyIndex.has(idKey)) {
      const existingEntry = this.idempotencyIndex.get(idKey)!;
      const stats = this.userStats.get(input.userId);
      return {
        userStats: stats ? { ...stats } : ({} as UserStatsRecord),
        ledgerEntry: { ...existingEntry },
        newTotalXp: existingEntry.balanceAfter,
      };
    }

    // 2. Snapshot state for ACID Rollback Guarantee
    const statsSnapshot = new Map(this.userStats);
    const ledgerSnapshot = new Map(this.xpLedger);
    const indexSnapshot = new Map(this.idempotencyIndex);

    // 3. Acquire Row-Level Lock: SELECT ... FOR UPDATE on user_stats
    while (this.lockedUsers.has(input.userId)) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    this.lockedUsers.add(input.userId);

    try {
      if (this.simulateTransactionError) {
        throw new Error("Simulated database failure during XP transaction");
      }

      const now = new Date();
      const currentStats = this.userStats.get(input.userId) ?? {
        userId: input.userId,
        totalXp: 0n,
        currentStreakDays: 0,
        longestStreakDays: 0,
        lastActiveDate: null,
        lessonsCompleted: 0,
        streakFreezesAvailable: 1,
        version: 0,
        updatedAt: now,
      };

      // Calculate Streak update
      const streakResult = calculateStreakUpdate({
        lastActiveDate: currentStats.lastActiveDate,
        currentStreakDays: currentStats.currentStreakDays,
        longestStreakDays: currentStats.longestStreakDays,
        streakFreezesAvailable: currentStats.streakFreezesAvailable,
        practiceDate: input.practiceDate,
        isQualifying: input.isQualifyingForStreak,
      });

      const newTotalXp = currentStats.totalXp + input.amount;

      // New user_stats state
      const updatedStats: UserStatsRecord = {
        ...currentStats,
        totalXp: newTotalXp,
        currentStreakDays: streakResult.currentStreakDays,
        longestStreakDays: streakResult.longestStreakDays,
        lastActiveDate: streakResult.lastActiveDate,
        streakFreezesAvailable: streakResult.streakFreezesAvailable,
        version: currentStats.version + 1,
        updatedAt: now,
      };
      this.userStats.set(input.userId, updatedStats);

      // Append-only XP Ledger entry
      const ledgerEntry: XpLedgerRecord = {
        id: crypto.randomUUID(),
        userId: input.userId,
        amount: input.amount,
        balanceAfter: newTotalXp,
        source: input.source,
        referenceId: input.referenceId,
        idempotencyKey: input.idempotencyKey,
        createdAt: now,
      };

      const userLedger = this.xpLedger.get(input.userId) ?? [];
      this.xpLedger.set(input.userId, [...userLedger, ledgerEntry]);
      this.idempotencyIndex.set(idKey, ledgerEntry);

      return {
        userStats: { ...updatedStats },
        ledgerEntry: { ...ledgerEntry },
        newTotalXp,
      };
    } catch (error) {
      // ROLLBACK: Restore clean snapshots
      this.userStats = statsSnapshot;
      this.xpLedger = ledgerSnapshot;
      this.idempotencyIndex = indexSnapshot;
      throw error;
    } finally {
      // Release Row-Level Lock
      this.lockedUsers.delete(input.userId);
    }
  }

  async getAllTimeLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
    const list = Array.from(this.userStats.values())
      .map((stats) => {
        const user = this.users.get(stats.userId);
        return {
          userId: stats.userId,
          displayName: user?.displayName ?? "Learner",
          score: stats.totalXp,
          streakDays: stats.currentStreakDays,
        };
      })
      .sort((a, b) => (b.score > a.score ? 1 : b.score < a.score ? -1 : 0));

    // Calculate DENSE_RANK()
    let currentRank = 1;
    let prevScore: bigint | null = null;
    const ranked: LeaderboardRow[] = [];

    for (const item of list) {
      if (prevScore !== null && item.score < prevScore) {
        currentRank++;
      }
      prevScore = item.score;
      ranked.push({
        ...item,
        rank: currentRank,
      });
    }

    return ranked.slice(0, limit);
  }

  async getWeeklyLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
    // Sum amount from xp_ledger for each user
    const weeklySums = new Map<string, bigint>();

    for (const [userId, entries] of this.xpLedger.entries()) {
      let sum = 0n;
      for (const e of entries) {
        sum += e.amount;
      }
      weeklySums.set(userId, sum);
    }

    const list = Array.from(weeklySums.entries())
      .map(([userId, weeklyXp]) => {
        const user = this.users.get(userId);
        const stats = this.userStats.get(userId);
        return {
          userId,
          displayName: user?.displayName ?? "Learner",
          score: weeklyXp,
          streakDays: stats?.currentStreakDays ?? 0,
        };
      })
      .sort((a, b) => (b.score > a.score ? 1 : b.score < a.score ? -1 : 0));

    let currentRank = 1;
    let prevScore: bigint | null = null;
    const ranked: LeaderboardRow[] = [];

    for (const item of list) {
      if (prevScore !== null && item.score < prevScore) {
        currentRank++;
      }
      prevScore = item.score;
      ranked.push({
        ...item,
        rank: currentRank,
      });
    }

    return ranked.slice(0, limit);
  }
}
