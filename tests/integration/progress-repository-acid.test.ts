import { describe, expect, it, beforeEach } from "vitest";
import {
  InMemoryProgressRepository,
  type AwardXpInput,
} from "@/core/repositories/progress-repository";

describe("ProgressRepository - ACID Transactions, Concurrency & Idempotency", () => {
  let repository: InMemoryProgressRepository;

  const TEST_USER_ID = "019488a0-7b24-789a-bcde-000000000001";

  beforeEach(() => {
    repository = new InMemoryProgressRepository();

    // Seed initial user stats
    repository.seedUserStats({
      userId: TEST_USER_ID,
      totalXp: 1000n,
      currentStreakDays: 3,
      longestStreakDays: 5,
      lastActiveDate: "2026-10-20",
      lessonsCompleted: 4,
      streakFreezesAvailable: 1,
      version: 1,
      updatedAt: new Date("2026-10-20T10:00:00Z"),
    });
  });

  it("TC-ACID-01: awards XP atomically, creates append-only ledger entry with balanceAfter and increments version", async () => {
    const input: AwardXpInput = {
      userId: TEST_USER_ID,
      amount: 50n,
      source: "attempt_scored",
      referenceId: "019488a0-7b24-789a-bcde-attempt000001",
      idempotencyKey: "attempt:019488a0-7b24-789a-bcde-attempt000001",
      practiceDate: "2026-10-21",
      isQualifyingForStreak: true,
    };

    const result = await repository.awardXp(input);

    expect(result.newTotalXp).toBe(1050n);
    expect(result.ledgerEntry.amount).toBe(50n);
    expect(result.ledgerEntry.balanceAfter).toBe(1050n);
    expect(result.ledgerEntry.source).toBe("attempt_scored");
    expect(result.userStats.totalXp).toBe(1050n);
    expect(result.userStats.version).toBe(2);
    expect(result.userStats.currentStreakDays).toBe(4);
    expect(result.userStats.lastActiveDate).toBe("2026-10-21");

    // Verify ledger persistence
    const ledger = await repository.getXpLedger(TEST_USER_ID);
    expect(ledger).toHaveLength(1);
    expect(ledger[0]?.idempotencyKey).toBe(input.idempotencyKey);
  });

  it("TC-ACID-02: enforces idempotency - identical idempotencyKey returns existing state without duplicate XP mutation", async () => {
    const input: AwardXpInput = {
      userId: TEST_USER_ID,
      amount: 100n,
      source: "lesson_completed",
      referenceId: "019488a0-7b24-789a-bcde-lesson0000001",
      idempotencyKey: "lesson:019488a0-7b24-789a-bcde-lesson0000001",
      practiceDate: "2026-10-21",
      isQualifyingForStreak: true,
    };

    // First call
    const firstResult = await repository.awardXp(input);
    expect(firstResult.newTotalXp).toBe(1100n);

    // Second call with identical key (network retry simulation)
    const secondResult = await repository.awardXp(input);
    expect(secondResult.newTotalXp).toBe(1100n);
    expect(secondResult.ledgerEntry.id).toBe(firstResult.ledgerEntry.id);

    // Ledger must contain exactly 1 record, total XP must not be 1200n
    const ledger = await repository.getXpLedger(TEST_USER_ID);
    expect(ledger).toHaveLength(1);

    const stats = await repository.getUserStats(TEST_USER_ID);
    expect(stats?.totalXp).toBe(1100n);
  });

  it("TC-ACID-03: rolls back entire transaction if downstream database write fails", async () => {
    repository.setSimulateTransactionError(true);

    const input: AwardXpInput = {
      userId: TEST_USER_ID,
      amount: 200n,
      source: "streak_bonus",
      referenceId: null,
      idempotencyKey: "streak:bonus:7days",
      practiceDate: "2026-10-21",
      isQualifyingForStreak: true,
    };

    await expect(repository.awardXp(input)).rejects.toThrow("Simulated database failure during XP transaction");

    // Verify rollback integrity
    const stats = await repository.getUserStats(TEST_USER_ID);
    expect(stats?.totalXp).toBe(1000n); // Unchanged!
    expect(stats?.version).toBe(1); // Unchanged!

    const ledger = await repository.getXpLedger(TEST_USER_ID);
    expect(ledger).toHaveLength(0); // Zero orphan records!
  });

  it("TC-ACID-04: serializes concurrent writes with row-level locking (SELECT ... FOR UPDATE)", async () => {
    // Fire 5 concurrent awards of 20 XP each
    const promises = Array.from({ length: 5 }, (_, idx) =>
      repository.awardXp({
        userId: TEST_USER_ID,
        amount: 20n,
        source: "attempt_scored",
        referenceId: `ref-${idx}`,
        idempotencyKey: `idemp-concurrent-${idx}`,
        practiceDate: "2026-10-21",
        isQualifyingForStreak: true,
      }),
    );

    const results = await Promise.all(promises);

    expect(results).toHaveLength(5);

    const finalStats = await repository.getUserStats(TEST_USER_ID);
    // 1000 + (5 * 20) = 1100 XP
    expect(finalStats?.totalXp).toBe(1100n);
    expect(finalStats?.version).toBe(6); // 1 + 5 mutations

    const ledger = await repository.getXpLedger(TEST_USER_ID);
    expect(ledger).toHaveLength(5);
  });
});
