import { Suspense } from "react";
import type { Metadata } from "next";
import {
  getProgressService,
  getSharedAchievementRepository,
} from "@/core/services/progress-service";
import { getLeaderboardService } from "@/core/services/leaderboard-service";
import { ProgressDashboardView } from "@/modules/progress/components/ProgressDashboardView";
import { ProgressSkeleton } from "@/modules/progress/components/ProgressSkeleton";
import type { AchievementItem } from "@/core/dto/progress.dto";

export const metadata: Metadata = {
  title: "Bảng Thành Tích, Biểu Đồ Tiến Độ & Chuỗi Ngày | AI Speaking Tutor 3D",
  description:
    "Theo dõi tiến độ phát âm 6 trục ngữ âm, chuỗi ngày học streak, thăng cấp Level và sổ cái điểm thưởng XP bất biến.",
};

export const dynamic = "force-dynamic";

const DEFAULT_USER_ID = "019488a0-7b24-789a-bcde-000000000001";

export default async function ProgressPage() {
  const progressService = getProgressService();
  const leaderboardService = getLeaderboardService();
  const achievementRepo = getSharedAchievementRepository();

  const [dashboard, weeklyLeaderboard, allTimeLeaderboard, allAchievements, userAchievements] =
    await Promise.all([
      progressService.getDashboardData(DEFAULT_USER_ID, "Asia/Ho_Chi_Minh"),
      leaderboardService.getLeaderboard("weekly", DEFAULT_USER_ID),
      leaderboardService.getLeaderboard("all_time", DEFAULT_USER_ID),
      achievementRepo.listAllAchievements(),
      achievementRepo.getUserAchievements(DEFAULT_USER_ID),
    ]);

  const unlockedMap = new Map(
    userAchievements.map((u) => [u.achievementId, u.unlockedAt.toISOString()]),
  );

  const achievements: AchievementItem[] = allAchievements.map((a) => ({
    id: a.id,
    code: a.code,
    titleVi: a.titleVi,
    descriptionVi: a.descriptionVi,
    icon: a.icon,
    xpReward: a.xpReward,
    isUnlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id) ?? null,
  }));

  return (
    <main className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
      <Suspense fallback={<ProgressSkeleton />}>
        <ProgressDashboardView
          dashboard={dashboard}
          weeklyLeaderboard={weeklyLeaderboard}
          allTimeLeaderboard={allTimeLeaderboard}
          achievements={achievements}
        />
      </Suspense>
    </main>
  );
}
