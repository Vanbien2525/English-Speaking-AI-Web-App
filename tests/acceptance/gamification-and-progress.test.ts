import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryProgressRepository } from "@/core/repositories/progress-repository";
import { InMemoryAchievementRepository } from "@/core/repositories/achievement-repository";
import { ProgressService } from "@/core/services/progress-service";
import { LeaderboardService } from "@/core/services/leaderboard-service";
import {
  UserProgressDashboardSchema,
  LeaderboardDataSchema,
} from "@/core/dto/progress.dto";

describe("User Progress Dashboard & Gamification Ledger Acceptance Suite (FEAT-GAMIFICATION-AND-PROGRESS)", () => {
  let progressRepo: InMemoryProgressRepository;
  let achievementRepo: InMemoryAchievementRepository;
  let progressService: ProgressService;
  let leaderboardService: LeaderboardService;

  const TEST_USER_ID = "019488a0-7b24-789a-bcde-000000000001";
  const PEER_USER_ID_1 = "019488a0-7b24-789a-bcde-000000000002";
  const PEER_USER_ID_2 = "019488a0-7b24-789a-bcde-000000000003";

  beforeEach(() => {
    progressRepo = new InMemoryProgressRepository();
    achievementRepo = new InMemoryAchievementRepository(progressRepo);
    progressService = new ProgressService(progressRepo, achievementRepo);
    leaderboardService = new LeaderboardService(progressRepo);

    // Seed test user stats
    progressRepo.seedUser({
      id: TEST_USER_ID,
      displayName: "Bạn (You)",
      email: "learner@test.com",
    });

    progressRepo.seedUserStats({
      userId: TEST_USER_ID,
      totalXp: 1850n,
      currentStreakDays: 7,
      longestStreakDays: 14,
      lastActiveDate: "2026-10-21",
      lessonsCompleted: 8,
      streakFreezesAvailable: 1,
      version: 5,
      updatedAt: new Date("2026-10-21T08:30:00Z"),
    });

    // Seed Peer Users for Leaderboard
    progressRepo.seedUser({
      id: PEER_USER_ID_1,
      displayName: "Minh Anh (RP Master)",
      email: "minhanh@test.com",
    });
    progressRepo.seedUserStats({
      userId: PEER_USER_ID_1,
      totalXp: 4820n,
      currentStreakDays: 25,
      longestStreakDays: 30,
      lastActiveDate: "2026-10-21",
      lessonsCompleted: 24,
      streakFreezesAvailable: 2,
      version: 12,
      updatedAt: new Date("2026-10-21T09:00:00Z"),
    });

    progressRepo.seedUser({
      id: PEER_USER_ID_2,
      displayName: "Alexandre T.",
      email: "alex@test.com",
    });
    progressRepo.seedUserStats({
      userId: PEER_USER_ID_2,
      totalXp: 4210n,
      currentStreakDays: 19,
      longestStreakDays: 20,
      lastActiveDate: "2026-10-21",
      lessonsCompleted: 18,
      streakFreezesAvailable: 1,
      version: 8,
      updatedAt: new Date("2026-10-21T07:15:00Z"),
    });

    // Seed Phoneme Mastery across 6 manner/categories
    progressRepo.seedPhonemeMastery([
      // Plosives (/p/, /b/, /t/)
      { userId: TEST_USER_ID, ipa: "p", manner: "plosive", attemptsCount: 15, scoreSumBp: 127500n }, // 85%
      { userId: TEST_USER_ID, ipa: "b", manner: "plosive", attemptsCount: 10, scoreSumBp: 85000n },  // 85%
      // Fricatives (/θ/, /ð/, /s/)
      { userId: TEST_USER_ID, ipa: "θ", manner: "fricative", attemptsCount: 20, scoreSumBp: 96000n }, // 48% (Weak spot)
      { userId: TEST_USER_ID, ipa: "ð", manner: "fricative", attemptsCount: 15, scoreSumBp: 78000n }, // 52%
      // Affricates (/tʃ/, /dʒ/)
      { userId: TEST_USER_ID, ipa: "tʃ", manner: "affricate", attemptsCount: 12, scoreSumBp: 86400n }, // 72%
      // Nasals (/m/, /n/, /ŋ/)
      { userId: TEST_USER_ID, ipa: "m", manner: "nasal", attemptsCount: 10, scoreSumBp: 92000n }, // 92%
      // Approximants (/l/, /r/)
      { userId: TEST_USER_ID, ipa: "l", manner: "approximant", attemptsCount: 14, scoreSumBp: 113400n }, // 81%
      // Vowels (/iː/, /uː/)
      { userId: TEST_USER_ID, ipa: "iː", manner: "vowel", attemptsCount: 25, scoreSumBp: 210000n }, // 84%
    ]);

    // Seed 30-day Attempt trend history
    progressRepo.seedAttemptHistory(TEST_USER_ID, [
      { date: "2026-10-01", averageScoreBp: 6200, attemptsCount: 4 },
      { date: "2026-10-07", averageScoreBp: 6800, attemptsCount: 6 },
      { date: "2026-10-14", averageScoreBp: 7200, attemptsCount: 8 },
      { date: "2026-10-21", averageScoreBp: 7840, attemptsCount: 10 },
    ]);

    // Seed XP Ledger entries
    progressRepo.seedXpLedger([
      {
        id: "019488a0-7b24-789a-bcde-000000000101",
        userId: TEST_USER_ID,
        amount: 50n,
        balanceAfter: 1750n,
        source: "attempt_scored",
        referenceId: null,
        idempotencyKey: "attempt:001",
        createdAt: new Date("2026-10-21T08:00:00Z"),
      },
      {
        id: "019488a0-7b24-789a-bcde-000000000102",
        userId: TEST_USER_ID,
        amount: 100n,
        balanceAfter: 1850n,
        source: "streak_bonus",
        referenceId: null,
        idempotencyKey: "streak:bonus:7d",
        createdAt: new Date("2026-10-21T08:30:00Z"),
      },
      // Weekly XP for peer 1 and 2
      {
        id: "019488a0-7b24-789a-bcde-000000000103",
        userId: PEER_USER_ID_1,
        amount: 500n,
        balanceAfter: 4820n,
        source: "lesson_completed",
        referenceId: null,
        idempotencyKey: "lesson:p1",
        createdAt: new Date("2026-10-21T07:00:00Z"),
      },
      {
        id: "019488a0-7b24-789a-bcde-000000000104",
        userId: PEER_USER_ID_2,
        amount: 400n,
        balanceAfter: 4210n,
        source: "lesson_completed",
        referenceId: null,
        idempotencyKey: "lesson:p2",
        createdAt: new Date("2026-10-21T06:00:00Z"),
      },
    ]);

    // Seed Achievements catalog
    achievementRepo.seedAchievements([
      {
        id: "019488a0-7b24-789a-bcde-achieve000001",
        code: "streak_7_days",
        titleVi: "Ngọn Lửa Tuần Lễ (7-Day Flame)",
        descriptionVi: "Duy trì chuỗi luyện tập liên tục 7 ngày.",
        icon: "flame",
        xpReward: 100,
        criteria: { type: "streak", minDays: 7 },
      },
      {
        id: "019488a0-7b24-789a-bcde-achieve000002",
        code: "phoneme_master_dental",
        titleVi: "Chinh Phục Âm Xát Răng",
        descriptionVi: "Đạt độ chính xác >= 80% cho âm /θ/.",
        icon: "target",
        xpReward: 150,
        criteria: { type: "phoneme_mastery", ipa: "θ", minScoreBp: 8000 },
      },
    ]);
  });

  it("TC-PROG-ACC-01: aggregates complete user progress dashboard conforming to Zod schema", async () => {
    const dashboard = await progressService.getDashboardData(TEST_USER_ID, "Asia/Ho_Chi_Minh");

    // Must strictly validate against Zod Schema
    const parsed = UserProgressDashboardSchema.safeParse(dashboard);
    expect(parsed.success).toBe(true);

    // Verify Level
    expect(dashboard.levelInfo.currentLevel).toBe(5); // sqrt(1850/100) + 1 = sqrt(18.5) + 1 = 4.3 + 1 = 5
    expect(dashboard.levelInfo.currentXp).toBe("1850");

    // Verify Streak
    expect(dashboard.streakInfo.currentStreakDays).toBe(7);
    expect(dashboard.streakInfo.streakFreezesAvailable).toBe(1);

    // Verify 6 Radar Axes
    expect(dashboard.radarAxes).toHaveLength(6);
    const fricativeAxis = dashboard.radarAxes.find((a) => a.axisKey === "fricatives");
    expect(fricativeAxis).toBeDefined();
    expect(fricativeAxis?.scoreBp).toBeLessThan(6000); // 48-52% -> identified as weak spot!

    // Verify 30-Day Trend History
    expect(dashboard.trendHistory.length).toBeGreaterThan(0);
    expect(dashboard.trendHistory[dashboard.trendHistory.length - 1]?.percentage).toBe(78.4);

    // Verify XP Ledger
    expect(dashboard.recentLedger).toHaveLength(2);
    expect(dashboard.recentLedger[0]?.sourceLabelVi).toBeDefined();
  });

  it("TC-PROG-ACC-02: returns weekly and all-time leaderboards with DENSE_RANK()", async () => {
    // All-time Leaderboard
    const allTime = await leaderboardService.getLeaderboard("all_time", TEST_USER_ID);
    const allTimeParsed = LeaderboardDataSchema.safeParse(allTime);
    expect(allTimeParsed.success).toBe(true);

    expect(allTime.topRanked).toHaveLength(3);
    expect(allTime.topRanked[0]?.displayName).toBe("Minh Anh (RP Master)");
    expect(allTime.topRanked[0]?.rank).toBe(1);
    expect(allTime.topRanked[1]?.rank).toBe(2);
    expect(allTime.topRanked[2]?.rank).toBe(3);

    // Current user in all-time
    expect(allTime.currentUserRank?.isCurrentUser).toBe(true);
    expect(allTime.currentUserRank?.rank).toBe(3);

    // Weekly Leaderboard
    const weekly = await leaderboardService.getLeaderboard("weekly", TEST_USER_ID);
    const weeklyParsed = LeaderboardDataSchema.safeParse(weekly);
    expect(weeklyParsed.success).toBe(true);

    expect(weekly.topRanked[0]?.displayName).toBe("Minh Anh (RP Master)");
    expect(weekly.topRanked[0]?.score).toBe("500");
  });

  it("TC-PROG-ACC-03: automatically unlocks eligible achievements and records XP into ledger", async () => {
    // Current streak is 7 -> satisfies 'streak_7_days'
    const unlocked = await achievementRepo.evaluateAndUnlock(TEST_USER_ID);

    expect(unlocked).toHaveLength(1);
    expect(unlocked[0]?.code).toBe("streak_7_days");
    expect(unlocked[0]?.xpReward).toBe(100);

    // Ledger must have recorded the achievement reward
    const ledger = await progressRepo.getXpLedger(TEST_USER_ID);
    const achievementEntry = ledger.find((e) => e.source === "achievement_unlocked");
    expect(achievementEntry).toBeDefined();
    expect(achievementEntry?.amount).toBe(100n);

    // Calling evaluateAndUnlock again does not re-award (Idempotency)
    const secondCall = await achievementRepo.evaluateAndUnlock(TEST_USER_ID);
    expect(secondCall).toHaveLength(0);
  });
});
