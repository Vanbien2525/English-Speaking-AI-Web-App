"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import type { LeaderboardData } from "@/core/dto/progress.dto";

interface MiniLeaderboardCardProps {
  weeklyLeaderboard: LeaderboardData;
  allTimeLeaderboard: LeaderboardData;
}

export function MiniLeaderboardCard({
  weeklyLeaderboard,
  allTimeLeaderboard,
}: MiniLeaderboardCardProps) {
  const [timeframe, setTimeframe] = useState<"weekly" | "all_time">("weekly");

  const currentData = timeframe === "weekly" ? weeklyLeaderboard : allTimeLeaderboard;
  const top3 = currentData.topRanked.slice(0, 3);
  const userRank = currentData.currentUserRank;

  return (
    <section
      aria-labelledby="leaderboard-heading"
      className="flex flex-col gap-5 rounded-2xl bg-surface p-6 border border-border-subtle shadow-xl"
    >
      {/* Header & Segmented Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="leaderboard-heading" className="text-lg font-bold text-ink flex items-center gap-2">
            <span>Bảng Xếp Hạng Âm Học</span>
            <span className="text-sm">🏆</span>
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">Xếp hạng học viên xuất sắc toàn quốc</p>
        </div>

        {/* Segmented Switcher */}
        <div className="inline-flex p-1 rounded-xl bg-surface-raised border border-border-subtle shrink-0">
          <button
            type="button"
            onClick={() => setTimeframe("weekly")}
            className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              timeframe === "weekly" ? "text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {timeframe === "weekly" && (
              <motion.div
                layoutId="leaderboardActiveTab"
                className="absolute inset-0 bg-primary/20 border border-primary/40 rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <span className="relative z-10">Tuần Này</span>
          </button>

          <button
            type="button"
            onClick={() => setTimeframe("all_time")}
            className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              timeframe === "all_time" ? "text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {timeframe === "all_time" && (
              <motion.div
                layoutId="leaderboardActiveTab"
                className="absolute inset-0 bg-primary/20 border border-primary/40 rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <span className="relative z-10">Toàn Thời Gian</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podiums */}
      <div className="flex items-end justify-center gap-2 pt-4 pb-2 border-b border-border-subtle/40">
        {/* #2 Silver (Left) */}
        {top3[1] && (
          <div className="flex flex-col items-center flex-1 max-w-[100px]">
            <span className="text-lg">🥈</span>
            <span className="text-xs font-bold text-ink truncate max-w-full text-center">
              {top3[1].displayName}
            </span>
            <span className="text-[10px] text-slate-300 font-semibold">{top3[1].score} XP</span>
            <div className="h-16 w-full mt-2 rounded-t-xl bg-slate-800/60 border-t border-x border-slate-500/40 flex items-center justify-center font-bold text-slate-300 text-sm">
              2
            </div>
          </div>
        )}

        {/* #1 Gold (Center, Highest) */}
        {top3[0] && (
          <div className="flex flex-col items-center flex-1 max-w-[110px]">
            <motion.span
              animate={{ rotate: [-4, 4, -4] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="text-2xl"
            >
              👑
            </motion.span>
            <span className="text-xs font-bold text-amber-300 truncate max-w-full text-center">
              {top3[0].displayName}
            </span>
            <span className="text-[10px] text-amber-400 font-bold">{top3[0].score} XP</span>
            <div className="h-24 w-full mt-2 rounded-t-xl bg-gradient-to-t from-amber-500/20 to-amber-500/10 border-t border-x border-amber-500/50 flex items-center justify-center font-extrabold text-amber-300 text-base shadow-lg shadow-amber-500/10">
              1
            </div>
          </div>
        )}

        {/* #3 Bronze (Right) */}
        {top3[2] && (
          <div className="flex flex-col items-center flex-1 max-w-[100px]">
            <span className="text-lg">🥉</span>
            <span className="text-xs font-bold text-ink truncate max-w-full text-center">
              {top3[2].displayName}
            </span>
            <span className="text-[10px] text-amber-600 font-semibold">{top3[2].score} XP</span>
            <div className="h-12 w-full mt-2 rounded-t-xl bg-amber-950/40 border-t border-x border-amber-700/40 flex items-center justify-center font-bold text-amber-600 text-sm">
              3
            </div>
          </div>
        )}
      </div>

      {/* Pinned Current User Rank Bar */}
      {userRank && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/30 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
              #{userRank.rank}
            </span>
            <span className="font-bold text-ink">{userRank.displayName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400">{userRank.score} XP</span>
            <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
              Bạn
            </span>
          </div>
        </div>
      )}

      {/* View Full Leaderboard Link */}
      <div className="flex justify-center pt-1">
        <Link
          href="/progress/leaderboard"
          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          <span>Xem Toàn Bộ Bảng Xếp Hạng Top 100</span>
          <span>&rarr;</span>
        </Link>
      </div>
    </section>
  );
}
