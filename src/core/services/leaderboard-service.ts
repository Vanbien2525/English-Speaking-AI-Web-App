import type { ProgressRepository } from "@/core/repositories/progress-repository";
import { getSharedProgressRepository } from "@/core/services/progress-service";
import type { LeaderboardData, LeaderboardEntry } from "@/core/dto/progress.dto";

export class LeaderboardService {
  constructor(private progressRepo: ProgressRepository) {}

  async getLeaderboard(
    timeframe: "weekly" | "all_time",
    currentUserId?: string,
  ): Promise<LeaderboardData> {
    const rawRows =
      timeframe === "weekly"
        ? await this.progressRepo.getWeeklyLeaderboard(50)
        : await this.progressRepo.getAllTimeLeaderboard(50);

    const topRanked: LeaderboardEntry[] = rawRows.map((row) => ({
      rank: row.rank,
      userId: row.userId,
      displayName: row.displayName,
      score: row.score.toString(),
      streakDays: row.streakDays,
      isCurrentUser: row.userId === currentUserId,
    }));

    let currentUserRank: LeaderboardEntry | null = null;

    if (currentUserId) {
      const foundInTop = topRanked.find((entry) => entry.userId === currentUserId);
      if (foundInTop) {
        currentUserRank = { ...foundInTop };
      } else {
        // Query user rank outside top 50
        const stats = await this.progressRepo.getUserStats(currentUserId);
        const user = await this.progressRepo.getUser(currentUserId);
        if (stats && user) {
          currentUserRank = {
            rank: 99,
            userId: currentUserId,
            displayName: user.displayName,
            score: timeframe === "weekly" ? "0" : stats.totalXp.toString(),
            streakDays: stats.currentStreakDays,
            isCurrentUser: true,
          };
        }
      }
    }

    return {
      timeframe,
      topRanked,
      currentUserRank,
    };
  }
}

export function getLeaderboardService(progressRepo?: ProgressRepository): LeaderboardService {
  const pRepo = progressRepo ?? getSharedProgressRepository();
  return new LeaderboardService(pRepo);
}
