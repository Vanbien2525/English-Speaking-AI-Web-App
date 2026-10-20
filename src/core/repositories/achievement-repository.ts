import type { ProgressRepository } from "@/core/repositories/progress-repository";
import { getLocalDateString } from "@/core/domain/streak-calculator";

export interface AchievementCriteria {
  type: "streak" | "phoneme_mastery" | "lessons_completed" | "total_attempts";
  minDays?: number;
  ipa?: string;
  minScoreBp?: number;
  count?: number;
}

export interface AchievementDefinition {
  id: string;
  code: string;
  titleVi: string;
  descriptionVi: string;
  icon: string;
  xpReward: number;
  criteria: AchievementCriteria;
}

export interface UserAchievementRecord {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
}

export interface AchievementRepository {
  listAllAchievements(): Promise<AchievementDefinition[]>;
  getUserAchievements(userId: string): Promise<UserAchievementRecord[]>;
  evaluateAndUnlock(userId: string): Promise<AchievementDefinition[]>;
}

export class InMemoryAchievementRepository implements AchievementRepository {
  private achievements: Map<string, AchievementDefinition> = new Map();
  private userAchievements: Map<string, UserAchievementRecord[]> = new Map(); // userId -> list

  constructor(private progressRepo: ProgressRepository) {}

  seedAchievements(definitions: AchievementDefinition[]): void {
    for (const def of definitions) {
      this.achievements.set(def.id, { ...def });
    }
  }

  seedUserAchievements(records: UserAchievementRecord[]): void {
    for (const r of records) {
      const list = this.userAchievements.get(r.userId) ?? [];
      list.push({ ...r });
      this.userAchievements.set(r.userId, list);
    }
  }

  async listAllAchievements(): Promise<AchievementDefinition[]> {
    return Array.from(this.achievements.values()).map((a) => ({ ...a }));
  }

  async getUserAchievements(userId: string): Promise<UserAchievementRecord[]> {
    const list = this.userAchievements.get(userId) ?? [];
    return list.map((a) => ({ ...a }));
  }

  async evaluateAndUnlock(userId: string): Promise<AchievementDefinition[]> {
    const stats = await this.progressRepo.getUserStats(userId);
    if (!stats) return [];

    const existingUnlocked = this.userAchievements.get(userId) ?? [];
    const unlockedIds = new Set(existingUnlocked.map((u) => u.achievementId));

    const newlyUnlocked: AchievementDefinition[] = [];
    const now = new Date();
    const todayStr = getLocalDateString(now);

    for (const achievement of this.achievements.values()) {
      if (unlockedIds.has(achievement.id)) continue;

      let satisfied = false;
      const { criteria } = achievement;

      if (criteria.type === "streak") {
        if (criteria.minDays !== undefined && stats.currentStreakDays >= criteria.minDays) {
          satisfied = true;
        }
      } else if (criteria.type === "lessons_completed") {
        if (criteria.count !== undefined && stats.lessonsCompleted >= criteria.count) {
          satisfied = true;
        }
      } else if (criteria.type === "phoneme_mastery") {
        const masteryList = await this.progressRepo.getPhonemeMastery(userId);
        const match = masteryList.find((m) => m.ipa === criteria.ipa);
        if (match && match.attemptsCount > 0 && criteria.minScoreBp !== undefined) {
          const avgScore = Number(match.scoreSumBp / BigInt(match.attemptsCount));
          if (avgScore >= criteria.minScoreBp) {
            satisfied = true;
          }
        }
      }

      if (satisfied) {
        // Record unlock
        const record: UserAchievementRecord = {
          userId,
          achievementId: achievement.id,
          unlockedAt: now,
        };
        const currentList = this.userAchievements.get(userId) ?? [];
        this.userAchievements.set(userId, [...currentList, record]);
        unlockedIds.add(achievement.id);
        newlyUnlocked.push({ ...achievement });

        // Award achievement XP via ProgressRepository ACID transaction
        if (achievement.xpReward > 0) {
          await this.progressRepo.awardXp({
            userId,
            amount: BigInt(achievement.xpReward),
            source: "achievement_unlocked",
            referenceId: achievement.id,
            idempotencyKey: `achievement:${userId}:${achievement.code}`,
            practiceDate: todayStr,
            isQualifyingForStreak: false,
          });
        }
      }
    }

    return newlyUnlocked;
  }
}
