import type { ProgressRepository } from "@/core/repositories/progress-repository";
import {
  InMemoryProgressRepository,
} from "@/core/repositories/progress-repository";
import type { AchievementRepository } from "@/core/repositories/achievement-repository";
import {
  InMemoryAchievementRepository,
} from "@/core/repositories/achievement-repository";
import { calculateUserLevel } from "@/core/domain/level-calculator";
import { getLocalDateString } from "@/core/domain/streak-calculator";
import type {
  PhonemeRadarAxis,
  PhonemeRadarAxisKey,
  ProgressTrendPoint,
  UserProgressDashboard,
  XpLedgerEntry,
} from "@/core/dto/progress.dto";

const SOURCE_LABELS_VI: Record<string, string> = {
  attempt_scored: "Hoàn thành lượt luyện phát âm",
  lesson_completed: "Hoàn thành bài học",
  streak_bonus: "Thưởng chuỗi ngày học liên tục",
  achievement_unlocked: "Mở khóa danh hiệu âm học",
  admin_adjustment: "Điều chỉnh hệ thống",
};

const RADAR_AXIS_DEFINITIONS: Array<{
  key: PhonemeRadarAxisKey;
  labelVi: string;
  labelEn: string;
  sample: string[];
}> = [
  { key: "plosives", labelVi: "Âm Tắc", labelEn: "Plosives", sample: ["/p/", "/b/", "/t/", "/d/", "/k/", "/g/"] },
  { key: "fricatives", labelVi: "Âm Xát", labelEn: "Fricatives", sample: ["/f/", "/v/", "/θ/", "/ð/", "/s/", "/z/"] },
  { key: "affricates", labelVi: "Âm Tắc Xát", labelEn: "Affricates", sample: ["/tʃ/", "/dʒ/"] },
  { key: "nasals", labelVi: "Âm Mũi", labelEn: "Nasals", sample: ["/m/", "/n/", "/ŋ/"] },
  { key: "approximants", labelVi: "Âm Tiếp Cận", labelEn: "Approximants", sample: ["/l/", "/r/", "/w/", "/j/"] },
  { key: "vowels", labelVi: "Nguyên Âm", labelEn: "Vowels", sample: ["/iː/", "/uː/", "/æ/", "/e/"] },
];

export class ProgressService {
  constructor(
    private progressRepo: ProgressRepository,
    private achievementRepo: AchievementRepository,
  ) {}

  async getDashboardData(userId: string, clientTimezone = "Asia/Ho_Chi_Minh"): Promise<UserProgressDashboard> {
    const [user, userStats, rawMastery, rawAttempts, rawLedger] = await Promise.all([
      this.progressRepo.getUser(userId),
      this.progressRepo.getUserStats(userId),
      this.progressRepo.getPhonemeMastery(userId),
      this.progressRepo.getAttemptHistory(userId, 30),
      this.progressRepo.getXpLedger(userId, 10),
    ]);

    const stats = userStats ?? {
      userId,
      totalXp: 0n,
      currentStreakDays: 0,
      longestStreakDays: 0,
      lastActiveDate: null,
      lessonsCompleted: 0,
      streakFreezesAvailable: 1,
      version: 0,
      updatedAt: new Date(),
    };

    // 1. Level Calculation
    const levelInfo = calculateUserLevel(stats.totalXp);

    // 2. Streak Info
    const todayStr = getLocalDateString(new Date(), clientTimezone);
    let streakStatus: "active" | "at_risk" | "lost" = "active";

    if (!stats.lastActiveDate) {
      streakStatus = "at_risk";
    } else if (stats.lastActiveDate === todayStr) {
      streakStatus = "active";
    } else {
      const lastDate = new Date(`${stats.lastActiveDate}T00:00:00Z`);
      const currDate = new Date(`${todayStr}T00:00:00Z`);
      const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streakStatus = "at_risk"; // Hasn't practiced today yet!
      } else {
        streakStatus = "lost";
      }
    }

    // 3. Radar Axes Mapping
    const radarAxes: PhonemeRadarAxis[] = RADAR_AXIS_DEFINITIONS.map((def) => {
      const matchingPhonemes = rawMastery.filter((m) => {
        if (def.key === "plosives") return m.manner.toLowerCase().includes("plosive");
        if (def.key === "fricatives") return m.manner.toLowerCase().includes("fricative");
        if (def.key === "affricates") return m.manner.toLowerCase().includes("affricate");
        if (def.key === "nasals") return m.manner.toLowerCase().includes("nasal");
        if (def.key === "approximants") return m.manner.toLowerCase().includes("approximant");
        if (def.key === "vowels") return m.manner.toLowerCase().includes("vowel");
        return false;
      });

      let totalScoreSum = 0n;
      let totalAttempts = 0;

      for (const p of matchingPhonemes) {
        totalScoreSum += p.scoreSumBp;
        totalAttempts += p.attemptsCount;
      }

      const scoreBp = totalAttempts > 0 ? Number(totalScoreSum / BigInt(totalAttempts)) : 0;
      const percentage = Math.round((scoreBp / 100) * 10) / 10;

      return {
        axisKey: def.key,
        labelVi: def.labelVi,
        labelEn: def.labelEn,
        scoreBp,
        percentage,
        phonemesSample: def.sample,
        attemptsCount: totalAttempts,
      };
    });

    // 4. Trend History
    const trendHistory: ProgressTrendPoint[] = rawAttempts.map((item) => ({
      date: item.date,
      averageScoreBp: item.averageScoreBp,
      percentage: Math.round((item.averageScoreBp / 100) * 10) / 10,
      attemptsCount: item.attemptsCount,
    }));

    // 5. Recent XP Ledger
    const recentLedger: XpLedgerEntry[] = rawLedger.map((entry) => ({
      id: entry.id,
      amount: entry.amount > 0n ? `+${entry.amount.toString()}` : entry.amount.toString(),
      balanceAfter: entry.balanceAfter.toString(),
      source: entry.source,
      sourceLabelVi: SOURCE_LABELS_VI[entry.source] ?? "Biến động điểm thưởng XP",
      referenceId: entry.referenceId,
      createdAt: entry.createdAt.toISOString(),
    }));

    // 6. Summary Stats
    let totalAttempts = 0;
    let totalMasterySum = 0n;
    for (const p of rawMastery) {
      totalAttempts += p.attemptsCount;
      totalMasterySum += p.scoreSumBp;
    }
    const averageMasteryBp = totalAttempts > 0 ? Number(totalMasterySum / BigInt(totalAttempts)) : 0;

    return {
      userId,
      displayName: user?.displayName ?? "Học Viên (Learner)",
      levelInfo,
      streakInfo: {
        currentStreakDays: stats.currentStreakDays,
        longestStreakDays: stats.longestStreakDays,
        lastActiveDate: stats.lastActiveDate,
        streakFreezesAvailable: stats.streakFreezesAvailable,
        isFrozenToday: false,
        streakStatus,
      },
      radarAxes,
      trendHistory,
      recentLedger,
      summaryStats: {
        totalXp: stats.totalXp.toString(),
        lessonsCompleted: stats.lessonsCompleted,
        totalAttempts,
        averageMasteryBp,
      },
    };
  }
}

// -----------------------------------------------------------------------------
// Shared Singleton Provider for Server Components & Runtime
// -----------------------------------------------------------------------------

let sharedProgressRepo: InMemoryProgressRepository | null = null;
let sharedAchievementRepo: InMemoryAchievementRepository | null = null;

export function getSharedProgressRepository(): InMemoryProgressRepository {
  if (!sharedProgressRepo) {
    sharedProgressRepo = new InMemoryProgressRepository();
    // Seed default demo user & stats if empty
    sharedProgressRepo.seedUser({
      id: "019488a0-7b24-789a-bcde-000000000001",
      displayName: "Bạn (Learner)",
      email: "learner@test.com",
    });
    sharedProgressRepo.seedUserStats({
      userId: "019488a0-7b24-789a-bcde-000000000001",
      totalXp: 1850n,
      currentStreakDays: 7,
      longestStreakDays: 14,
      lastActiveDate: "2026-10-21",
      lessonsCompleted: 8,
      streakFreezesAvailable: 1,
      version: 5,
      updatedAt: new Date(),
    });
    // Seed peers for leaderboard
    sharedProgressRepo.seedUser({
      id: "019488a0-7b24-789a-bcde-000000000002",
      displayName: "Minh Anh (RP Master)",
      email: "minhanh@test.com",
    });
    sharedProgressRepo.seedUserStats({
      userId: "019488a0-7b24-789a-bcde-000000000002",
      totalXp: 4820n,
      currentStreakDays: 25,
      longestStreakDays: 30,
      lastActiveDate: "2026-10-21",
      lessonsCompleted: 24,
      streakFreezesAvailable: 2,
      version: 12,
      updatedAt: new Date(),
    });
    sharedProgressRepo.seedUser({
      id: "019488a0-7b24-789a-bcde-000000000003",
      displayName: "Alexandre T.",
      email: "alex@test.com",
    });
    sharedProgressRepo.seedUserStats({
      userId: "019488a0-7b24-789a-bcde-000000000003",
      totalXp: 4210n,
      currentStreakDays: 19,
      longestStreakDays: 20,
      lastActiveDate: "2026-10-21",
      lessonsCompleted: 18,
      streakFreezesAvailable: 1,
      version: 8,
      updatedAt: new Date(),
    });
    sharedProgressRepo.seedUser({
      id: "019488a0-7b24-789a-bcde-000000000004",
      displayName: "Thu Hà (IELTS 8.0)",
      email: "thuha@test.com",
    });
    sharedProgressRepo.seedUserStats({
      userId: "019488a0-7b24-789a-bcde-000000000004",
      totalXp: 3950n,
      currentStreakDays: 15,
      longestStreakDays: 16,
      lastActiveDate: "2026-10-21",
      lessonsCompleted: 15,
      streakFreezesAvailable: 1,
      version: 7,
      updatedAt: new Date(),
    });

    // Seed Phoneme Mastery
    sharedProgressRepo.seedPhonemeMastery([
      { userId: "019488a0-7b24-789a-bcde-000000000001", ipa: "p", manner: "plosive", attemptsCount: 15, scoreSumBp: 127500n },
      { userId: "019488a0-7b24-789a-bcde-000000000001", ipa: "b", manner: "plosive", attemptsCount: 10, scoreSumBp: 85000n },
      { userId: "019488a0-7b24-789a-bcde-000000000001", ipa: "θ", manner: "fricative", attemptsCount: 20, scoreSumBp: 96000n }, // 48% (Weak)
      { userId: "019488a0-7b24-789a-bcde-000000000001", ipa: "ð", manner: "fricative", attemptsCount: 15, scoreSumBp: 78000n }, // 52%
      { userId: "019488a0-7b24-789a-bcde-000000000001", ipa: "tʃ", manner: "affricate", attemptsCount: 12, scoreSumBp: 86400n }, // 72%
      { userId: "019488a0-7b24-789a-bcde-000000000001", ipa: "m", manner: "nasal", attemptsCount: 10, scoreSumBp: 92000n }, // 92%
      { userId: "019488a0-7b24-789a-bcde-000000000001", ipa: "l", manner: "approximant", attemptsCount: 14, scoreSumBp: 113400n }, // 81%
      { userId: "019488a0-7b24-789a-bcde-000000000001", ipa: "iː", manner: "vowel", attemptsCount: 25, scoreSumBp: 210000n }, // 84%
    ]);

    // Seed 30-day trend
    sharedProgressRepo.seedAttemptHistory("019488a0-7b24-789a-bcde-000000000001", [
      { date: "2026-10-01", averageScoreBp: 6200, attemptsCount: 4 },
      { date: "2026-10-05", averageScoreBp: 6500, attemptsCount: 5 },
      { date: "2026-10-10", averageScoreBp: 7100, attemptsCount: 6 },
      { date: "2026-10-15", averageScoreBp: 7400, attemptsCount: 8 },
      { date: "2026-10-21", averageScoreBp: 7840, attemptsCount: 10 },
    ]);

    // Seed XP Ledger
    sharedProgressRepo.seedXpLedger([
      {
        id: "019488a0-7b24-789a-bcde-000000000101",
        userId: "019488a0-7b24-789a-bcde-000000000001",
        amount: 50n,
        balanceAfter: 1750n,
        source: "attempt_scored",
        referenceId: null,
        idempotencyKey: "attempt:001",
        createdAt: new Date("2026-10-21T08:00:00Z"),
      },
      {
        id: "019488a0-7b24-789a-bcde-000000000102",
        userId: "019488a0-7b24-789a-bcde-000000000001",
        amount: 100n,
        balanceAfter: 1850n,
        source: "streak_bonus",
        referenceId: null,
        idempotencyKey: "streak:bonus:7d",
        createdAt: new Date("2026-10-21T08:30:00Z"),
      },
      {
        id: "019488a0-7b24-789a-bcde-000000000103",
        userId: "019488a0-7b24-789a-bcde-000000000002",
        amount: 500n,
        balanceAfter: 4820n,
        source: "lesson_completed",
        referenceId: null,
        idempotencyKey: "lesson:p1",
        createdAt: new Date("2026-10-21T07:00:00Z"),
      },
      {
        id: "019488a0-7b24-789a-bcde-000000000104",
        userId: "019488a0-7b24-789a-bcde-000000000003",
        amount: 400n,
        balanceAfter: 4210n,
        source: "lesson_completed",
        referenceId: null,
        idempotencyKey: "lesson:p2",
        createdAt: new Date("2026-10-21T06:00:00Z"),
      },
      {
        id: "019488a0-7b24-789a-bcde-000000000105",
        userId: "019488a0-7b24-789a-bcde-000000000004",
        amount: 350n,
        balanceAfter: 3950n,
        source: "lesson_completed",
        referenceId: null,
        idempotencyKey: "lesson:p3",
        createdAt: new Date("2026-10-21T05:30:00Z"),
      },
    ]);
  }
  return sharedProgressRepo;
}

export function getSharedAchievementRepository(): InMemoryAchievementRepository {
  if (!sharedAchievementRepo) {
    const progressRepo = getSharedProgressRepository();
    sharedAchievementRepo = new InMemoryAchievementRepository(progressRepo);
    sharedAchievementRepo.seedAchievements([
      {
        id: "019488a0-7b24-789a-bcde-000000000201",
        code: "streak_7_days",
        titleVi: "Ngọn Lửa Tuần Lễ (7-Day Flame)",
        descriptionVi: "Duy trì chuỗi ngày học phát âm liên tục 7 ngày.",
        icon: "🔥",
        xpReward: 100,
        criteria: { type: "streak", minDays: 7 },
      },
      {
        id: "019488a0-7b24-789a-bcde-000000000202",
        code: "phoneme_master_dental",
        titleVi: "Chinh Phục Âm Xát Răng",
        descriptionVi: "Đạt độ chuẩn xác >= 80% cho âm xát /θ/.",
        icon: "🎯",
        xpReward: 150,
        criteria: { type: "phoneme_mastery", ipa: "θ", minScoreBp: 8000 },
      },
      {
        id: "019488a0-7b24-789a-bcde-000000000203",
        code: "lessons_10_completed",
        titleVi: "Chiến Binh Kỷ Luật (10 Bài Học)",
        descriptionVi: "Hoàn thành trọn vẹn 10 bài luyện tập phát âm.",
        icon: "📚",
        xpReward: 200,
        criteria: { type: "lessons_completed", count: 10 },
      },
      {
        id: "019488a0-7b24-789a-bcde-000000000204",
        code: "vocal_virtuoso_level_10",
        titleVi: "Bậc Thầy Khẩu Hình (Level 10)",
        descriptionVi: "Cán mốc cấp bậc Bậc Thầy Phát Âm RP tại 8,100 XP.",
        icon: "👑",
        xpReward: 500,
        criteria: { type: "streak", minDays: 100 },
      },
    ]);

    // Seed unlock for 7 days streak
    sharedAchievementRepo.seedUserAchievements([
      {
        userId: "019488a0-7b24-789a-bcde-000000000001",
        achievementId: "019488a0-7b24-789a-bcde-000000000201",
        unlockedAt: new Date("2026-10-21T08:30:00Z"),
      },
    ]);
  }
  return sharedAchievementRepo;
}

export function getProgressService(
  progressRepo?: ProgressRepository,
  achievementRepo?: AchievementRepository,
): ProgressService {
  const pRepo = progressRepo ?? getSharedProgressRepository();
  const aRepo = achievementRepo ?? getSharedAchievementRepository();
  return new ProgressService(pRepo, aRepo);
}
