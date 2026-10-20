"use client";

import { useState } from "react";
import type {
  AchievementItem,
  LeaderboardData,
  UserProgressDashboard,
} from "@/core/dto/progress.dto";
import { ProgressHeader } from "./ProgressHeader";
import { PhonemeRadarCard } from "./PhonemeRadarCard";
import { ProgressTrendCard } from "./ProgressTrendCard";
import { MiniLeaderboardCard } from "./MiniLeaderboardCard";
import { AchievementsBadgeGrid } from "./AchievementsBadgeGrid";
import { StreakFreezeModal } from "./StreakFreezeModal";
import { XpLedgerHistoryDrawer } from "./XpLedgerHistoryDrawer";

interface ProgressDashboardViewProps {
  dashboard: UserProgressDashboard;
  weeklyLeaderboard: LeaderboardData;
  allTimeLeaderboard: LeaderboardData;
  achievements: AchievementItem[];
}

export function ProgressDashboardView({
  dashboard,
  weeklyLeaderboard,
  allTimeLeaderboard,
  achievements,
}: ProgressDashboardViewProps) {
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [isLedgerDrawerOpen, setIsLedgerDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8" data-testid="progress-dashboard-view">
      {/* 1. Header Bar */}
      <ProgressHeader
        displayName={dashboard.displayName}
        levelInfo={dashboard.levelInfo}
        streakInfo={dashboard.streakInfo}
        summaryStats={dashboard.summaryStats}
        onOpenFreezeModal={() => setIsFreezeModalOpen(true)}
        onOpenLedgerDrawer={() => setIsLedgerDrawerOpen(true)}
      />

      {/* 2. Main Analytics & Gamification 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Radar + Trendline */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          <PhonemeRadarCard axes={dashboard.radarAxes} />
          <ProgressTrendCard trendHistory={dashboard.trendHistory} />
        </div>

        {/* Right Column (5 cols): Leaderboard + Achievements */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <MiniLeaderboardCard
            weeklyLeaderboard={weeklyLeaderboard}
            allTimeLeaderboard={allTimeLeaderboard}
          />
          <AchievementsBadgeGrid achievements={achievements} />
        </div>
      </div>

      {/* Modals & Slide-over Drawers */}
      <StreakFreezeModal
        isOpen={isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
        freezesAvailable={dashboard.streakInfo.streakFreezesAvailable}
        currentStreakDays={dashboard.streakInfo.currentStreakDays}
      />

      <XpLedgerHistoryDrawer
        isOpen={isLedgerDrawerOpen}
        onClose={() => setIsLedgerDrawerOpen(false)}
        entries={dashboard.recentLedger}
        currentTotalXp={dashboard.summaryStats.totalXp}
      />
    </div>
  );
}
