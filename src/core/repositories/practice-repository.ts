import crypto from "node:crypto";
import type { FeedbackSeverity } from "@/core/domain/scoring";
import type { EngineProvider, PhonemeErrorType } from "@/core/dto/shared.dto";

// -----------------------------------------------------------------------------
// Domain Records (Aligned 1:1 with PostgreSQL Schema 0001)
// -----------------------------------------------------------------------------

export interface PracticeAttemptRecord {
  id: string;
  sessionId: string;
  userId: string;
  lessonItemId: string;
  idempotencyKey: string;
  status: "pending" | "scored" | "failed";
  engine: EngineProvider;
  engineVersion: string;
  recognizedText: string | null;
  overallScoreBp: number | null;
  accuracyBp: number | null;
  fluencyBp: number | null;
  completenessBp: number | null;
  prosodyBp: number | null;
  audioDurationMs: number;
  scoringLatencyMs: number | null;
  wordResults: unknown[];
  tutorFeedback: Record<string, unknown>;
  errorCode: string | null;
  createdAt: Date;
  scoredAt: Date | null;
}

export interface AttemptPhonemeRecord {
  id: string;
  attemptId: string;
  userId: string;
  position: number;
  expectedPhonemeId: string | null;
  actualPhonemeId: string | null;
  errorType: PhonemeErrorType;
  severity: FeedbackSeverity;
  gopScoreBp: number;
  startMs: number | null;
  endMs: number | null;
  createdAt: Date;
}

export interface UserStatsRecord {
  userId: string;
  totalXp: bigint;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveDate: string | null;
  lessonsCompleted: number;
  version: number;
  updatedAt: Date;
}

export interface XpLedgerRecord {
  id: string;
  userId: string;
  amount: bigint;
  balanceAfter: bigint;
  source: "attempt_scored" | "lesson_completed" | "streak_bonus" | "achievement_unlocked" | "admin_adjustment";
  referenceId: string | null;
  idempotencyKey: string;
  createdAt: Date;
}

export interface SaveScoredAttemptInput {
  sessionId: string;
  userId: string;
  lessonItemId: string;
  idempotencyKey: string;
  engine: EngineProvider;
  engineVersion: string;
  recognizedText: string;
  overallScoreBp: number;
  accuracyBp: number;
  fluencyBp: number;
  completenessBp: number;
  prosodyBp: number | null;
  audioDurationMs: number;
  scoringLatencyMs: number;
  wordResults: unknown[];
  tutorFeedback: Record<string, unknown>;
  phonemes: Array<Omit<AttemptPhonemeRecord, "id" | "attemptId" | "userId" | "createdAt">>;
  xpAward: number;
}

export interface SaveFailedAttemptInput {
  sessionId: string;
  userId: string;
  lessonItemId: string;
  idempotencyKey: string;
  engine: EngineProvider;
  engineVersion: string;
  audioDurationMs: number;
  errorCode: string;
}

// -----------------------------------------------------------------------------
// PracticeRepository Contract Interface
// -----------------------------------------------------------------------------

export interface PracticeRepository {
  findAttemptByIdempotencyKey(userId: string, idempotencyKey: string): Promise<PracticeAttemptRecord | null>;
  getAttemptPhonemes(attemptId: string): Promise<AttemptPhonemeRecord[]>;
  getUserStats(userId: string): Promise<UserStatsRecord | null>;
  getXpLedger(userId: string): Promise<XpLedgerRecord[]>;
  listAttempts(userId: string): Promise<PracticeAttemptRecord[]>;
  saveScoredAttempt(input: SaveScoredAttemptInput): Promise<{ attempt: PracticeAttemptRecord; newTotalXp: bigint }>;
  saveFailedAttempt(input: SaveFailedAttemptInput): Promise<PracticeAttemptRecord>;
}

// -----------------------------------------------------------------------------
// In-Memory Implementation with ACID Semantics & Rollback Guarantee
// -----------------------------------------------------------------------------

export class InMemoryPracticeRepository implements PracticeRepository {
  private attempts: Map<string, PracticeAttemptRecord> = new Map();
  private idempotencyIndex: Map<string, string> = new Map(); // key = `${userId}:${idempotencyKey}` -> attemptId
  private phonemes: Map<string, AttemptPhonemeRecord[]> = new Map(); // key = attemptId -> array
  private userStats: Map<string, UserStatsRecord> = new Map(); // key = userId
  private xpLedger: Map<string, XpLedgerRecord[]> = new Map(); // key = userId
  private lockedUsers: Set<string> = new Set();
  private simulateTransactionError = false;

  setSimulateTransactionError(value: boolean): void {
    this.simulateTransactionError = value;
  }

  seedUserStats(stats: UserStatsRecord): void {
    this.userStats.set(stats.userId, { ...stats });
  }

  async findAttemptByIdempotencyKey(userId: string, idempotencyKey: string): Promise<PracticeAttemptRecord | null> {
    const key = `${userId}:${idempotencyKey}`;
    const attemptId = this.idempotencyIndex.get(key);
    if (!attemptId) return null;
    const record = this.attempts.get(attemptId);
    return record ? { ...record } : null;
  }

  async getAttemptPhonemes(attemptId: string): Promise<AttemptPhonemeRecord[]> {
    const list = this.phonemes.get(attemptId) ?? [];
    return list.map((p) => ({ ...p }));
  }

  async getUserStats(userId: string): Promise<UserStatsRecord | null> {
    const record = this.userStats.get(userId);
    return record ? { ...record } : null;
  }

  async getXpLedger(userId: string): Promise<XpLedgerRecord[]> {
    const list = this.xpLedger.get(userId) ?? [];
    return list.map((entry) => ({ ...entry }));
  }

  async listAttempts(userId: string): Promise<PracticeAttemptRecord[]> {
    return Array.from(this.attempts.values())
      .filter((a) => a.userId === userId)
      .map((a) => ({ ...a }));
  }

  async saveScoredAttempt(
    input: SaveScoredAttemptInput,
  ): Promise<{ attempt: PracticeAttemptRecord; newTotalXp: bigint }> {
    const idKey = `${input.userId}:${input.idempotencyKey}`;

    // 1. Check idempotency violation
    if (this.idempotencyIndex.has(idKey)) {
      const existingId = this.idempotencyIndex.get(idKey)!;
      const existing = this.attempts.get(existingId)!;
      const stats = this.userStats.get(input.userId);
      return { attempt: { ...existing }, newTotalXp: stats?.totalXp ?? 0n };
    }

    // 2. Take snapshots for ACID Rollback
    const attemptsSnapshot = new Map(this.attempts);
    const indexSnapshot = new Map(this.idempotencyIndex);
    const phonemesSnapshot = new Map(this.phonemes);
    const userStatsSnapshot = new Map(this.userStats);
    const xpLedgerSnapshot = new Map(this.xpLedger);

    // 3. Acquire row lock (SELECT ... FOR UPDATE on user_stats)
    if (this.lockedUsers.has(input.userId)) {
      throw new Error(`Row lock conflict on user_stats for userId: ${input.userId}`);
    }
    this.lockedUsers.add(input.userId);

    try {
      if (this.simulateTransactionError) {
        throw new Error("Simulated database constraint failure during transaction");
      }

      const attemptId = crypto.randomUUID();
      const now = new Date();

      const attemptRecord: PracticeAttemptRecord = {
        id: attemptId,
        sessionId: input.sessionId,
        userId: input.userId,
        lessonItemId: input.lessonItemId,
        idempotencyKey: input.idempotencyKey,
        status: "scored",
        engine: input.engine,
        engineVersion: input.engineVersion,
        recognizedText: input.recognizedText,
        overallScoreBp: input.overallScoreBp,
        accuracyBp: input.accuracyBp,
        fluencyBp: input.fluencyBp,
        completenessBp: input.completenessBp,
        prosodyBp: input.prosodyBp,
        audioDurationMs: input.audioDurationMs,
        scoringLatencyMs: input.scoringLatencyMs,
        wordResults: input.wordResults,
        tutorFeedback: input.tutorFeedback,
        errorCode: null,
        createdAt: now,
        scoredAt: now,
      };

      // Save attempt
      this.attempts.set(attemptId, attemptRecord);
      this.idempotencyIndex.set(idKey, attemptId);

      // Save normalized phoneme results
      const phonemeRecords: AttemptPhonemeRecord[] = input.phonemes.map((p) => ({
        ...p,
        id: crypto.randomUUID(),
        attemptId,
        userId: input.userId,
        createdAt: now,
      }));
      this.phonemes.set(attemptId, phonemeRecords);

      // Update user stats
      const currentStats = this.userStats.get(input.userId) ?? {
        userId: input.userId,
        totalXp: 0n,
        currentStreakDays: 1,
        longestStreakDays: 1,
        lastActiveDate: now.toISOString().slice(0, 10),
        lessonsCompleted: 0,
        version: 0,
        updatedAt: now,
      };

      const xpDelta = BigInt(input.xpAward);
      const newTotalXp = currentStats.totalXp + xpDelta;

      this.userStats.set(input.userId, {
        ...currentStats,
        totalXp: newTotalXp,
        version: currentStats.version + 1,
        updatedAt: now,
      });

      // Insert XP ledger entry
      const ledgerEntry: XpLedgerRecord = {
        id: crypto.randomUUID(),
        userId: input.userId,
        amount: xpDelta,
        balanceAfter: newTotalXp,
        source: "attempt_scored",
        referenceId: attemptId,
        idempotencyKey: `attempt:${input.idempotencyKey}`,
        createdAt: now,
      };

      const userLedger = this.xpLedger.get(input.userId) ?? [];
      this.xpLedger.set(input.userId, [...userLedger, ledgerEntry]);

      return { attempt: { ...attemptRecord }, newTotalXp };
    } catch (error) {
      // ROLLBACK: Restore full snapshot
      this.attempts = attemptsSnapshot;
      this.idempotencyIndex = indexSnapshot;
      this.phonemes = phonemesSnapshot;
      this.userStats = userStatsSnapshot;
      this.xpLedger = xpLedgerSnapshot;
      throw error;
    } finally {
      // Release row lock
      this.lockedUsers.delete(input.userId);
    }
  }

  async saveFailedAttempt(input: SaveFailedAttemptInput): Promise<PracticeAttemptRecord> {
    const idKey = `${input.userId}:${input.idempotencyKey}`;
    const attemptId = crypto.randomUUID();
    const now = new Date();

    const record: PracticeAttemptRecord = {
      id: attemptId,
      sessionId: input.sessionId,
      userId: input.userId,
      lessonItemId: input.lessonItemId,
      idempotencyKey: input.idempotencyKey,
      status: "failed",
      engine: input.engine,
      engineVersion: input.engineVersion,
      recognizedText: null,
      overallScoreBp: null,
      accuracyBp: null,
      fluencyBp: null,
      completenessBp: null,
      prosodyBp: null,
      audioDurationMs: input.audioDurationMs,
      scoringLatencyMs: null,
      wordResults: [],
      tutorFeedback: {},
      errorCode: input.errorCode,
      createdAt: now,
      scoredAt: null,
    };

    this.attempts.set(attemptId, record);
    this.idempotencyIndex.set(idKey, attemptId);
    return { ...record };
  }
}
