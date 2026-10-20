import { z } from "zod";

export const XpSourceEnum = z.enum([
  "attempt_scored",
  "lesson_completed",
  "streak_bonus",
  "achievement_unlocked",
  "admin_adjustment",
]);

export type XpSource = z.infer<typeof XpSourceEnum>;

// Thông số Cấp độ (Quadratic progression curve)
export const UserLevelSchema = z.object({
  currentLevel: z.number().int().positive(),
  currentLevelTitle: z.string(),
  currentXp: z.string(), // BigInt serialized as string
  xpForNextLevel: z.string(),
  progressPercent: z.number().min(0).max(100),
});
export type UserLevel = z.infer<typeof UserLevelSchema>;

// Trục Radar Ngữ Âm 6 cực
export const PhonemeRadarAxisKeyEnum = z.enum([
  "plosives",
  "fricatives",
  "affricates",
  "nasals",
  "approximants",
  "vowels",
]);
export type PhonemeRadarAxisKey = z.infer<typeof PhonemeRadarAxisKeyEnum>;

export const PhonemeRadarAxisSchema = z.object({
  axisKey: PhonemeRadarAxisKeyEnum,
  labelVi: z.string(),
  labelEn: z.string(),
  scoreBp: z.number().int().min(0).max(10000), // Basis points (0..10000)
  percentage: z.number().min(0).max(100),
  phonemesSample: z.array(z.string()),
  attemptsCount: z.number().int().nonnegative(),
});
export type PhonemeRadarAxis = z.infer<typeof PhonemeRadarAxisSchema>;

// Điểm đường xu hướng phát âm 30 ngày
export const ProgressTrendPointSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  averageScoreBp: z.number().int().min(0).max(10000),
  percentage: z.number().min(0).max(100),
  attemptsCount: z.number().int().positive(),
});
export type ProgressTrendPoint = z.infer<typeof ProgressTrendPointSchema>;

// Thành tựu / Danh hiệu
export const AchievementItemSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  titleVi: z.string(),
  descriptionVi: z.string(),
  icon: z.string(),
  xpReward: z.number().int().nonnegative(),
  isUnlocked: z.boolean(),
  unlockedAt: z.string().datetime().nullable(),
  progressPercent: z.number().min(0).max(100).optional(),
});
export type AchievementItem = z.infer<typeof AchievementItemSchema>;

// Mục bảng xếp hạng
export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  userId: z.string().uuid(),
  displayName: z.string(),
  score: z.string(), // Total XP hoặc Weekly XP
  streakDays: z.number().int().nonnegative().optional(),
  isCurrentUser: z.boolean(),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

// Bảng xếp hạng hoàn chỉnh
export const LeaderboardDataSchema = z.object({
  timeframe: z.enum(["weekly", "all_time"]),
  topRanked: z.array(LeaderboardEntrySchema),
  currentUserRank: LeaderboardEntrySchema.nullable(),
});
export type LeaderboardData = z.infer<typeof LeaderboardDataSchema>;

// Lịch sử biến động Sổ cái XP
export const XpLedgerEntrySchema = z.object({
  id: z.string().uuid(),
  amount: z.string(), // "+50", "+100"
  balanceAfter: z.string(),
  source: XpSourceEnum,
  sourceLabelVi: z.string(),
  referenceId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});
export type XpLedgerEntry = z.infer<typeof XpLedgerEntrySchema>;

// Payload tổng hợp trả về cho trang Dashboard
export const UserProgressDashboardSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string(),
  levelInfo: UserLevelSchema,
  streakInfo: z.object({
    currentStreakDays: z.number().int().nonnegative(),
    longestStreakDays: z.number().int().nonnegative(),
    lastActiveDate: z.string().nullable(),
    streakFreezesAvailable: z.number().int().nonnegative(),
    isFrozenToday: z.boolean(),
    streakStatus: z.enum(["active", "at_risk", "lost"]),
  }),
  radarAxes: z.array(PhonemeRadarAxisSchema),
  trendHistory: z.array(ProgressTrendPointSchema),
  recentLedger: z.array(XpLedgerEntrySchema),
  summaryStats: z.object({
    totalXp: z.string(),
    lessonsCompleted: z.number().int().nonnegative(),
    totalAttempts: z.number().int().nonnegative(),
    averageMasteryBp: z.number().int().min(0).max(10000),
  }),
});
export type UserProgressDashboard = z.infer<typeof UserProgressDashboardSchema>;
