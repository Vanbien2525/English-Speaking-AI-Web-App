"use client";

import { motion } from "motion/react";
import type { UserLevel } from "@/core/dto/progress.dto";

interface ProgressHeaderProps {
  displayName: string;
  levelInfo: UserLevel;
  streakInfo: {
    currentStreakDays: number;
    longestStreakDays: number;
    streakFreezesAvailable: number;
    isFrozenToday: boolean;
    streakStatus: "active" | "at_risk" | "lost";
  };
  summaryStats: {
    totalXp: string;
    lessonsCompleted: number;
    totalAttempts: number;
    averageMasteryBp: number;
  };
  onOpenFreezeModal?: () => void;
  onOpenLedgerDrawer?: () => void;
}

export function ProgressHeader({
  displayName,
  levelInfo,
  streakInfo,
  summaryStats,
  onOpenFreezeModal,
  onOpenLedgerDrawer,
}: ProgressHeaderProps) {
  const masteryPercent = (summaryStats.averageMasteryBp / 100).toFixed(1);

  return (
    <header className="flex flex-col gap-6 rounded-2xl bg-surface p-6 border border-border-subtle shadow-xl">
      {/* 1. Top Meta Line */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/25">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Hồ Sơ Năng Lực Học Viên
          </span>
          <span className="text-xs text-ink-muted">British RP • {displayName}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Fiery Streak Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
              streakInfo.currentStreakDays > 0
                ? "bg-amber-950/40 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/10"
                : "bg-surface-raised text-ink-muted border-border-subtle"
            }`}
          >
            <motion.span
              animate={streakInfo.currentStreakDays > 0 ? { scale: [1, 1.25, 1] } : undefined}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              🔥
            </motion.span>
            <span>{streakInfo.currentStreakDays} Ngày Chuỗi</span>
          </div>

          {/* Freeze Shield Button */}
          <button
            type="button"
            onClick={onOpenFreezeModal}
            className="inline-flex items-center gap-1.5 rounded-full bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-400 border border-cyan-500/40 hover:bg-cyan-900/40 transition-colors"
          >
            <span>🛡️</span>
            <span>Bảo Vệ: {streakInfo.streakFreezesAvailable}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Title & Level Progression Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-t border-border-subtle/50 pt-5">
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💎</span>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-ink flex items-center gap-2">
                <span>Cấp {levelInfo.currentLevel}:</span>
                <span className="text-primary">{levelInfo.currentLevelTitle}</span>
              </h1>
              <p className="text-xs text-ink-muted mt-0.5">
                Cần tích lũy thêm XP để mở khóa danh hiệu cấp tiếp theo
              </p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-4 flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-amber-400 font-semibold">{levelInfo.currentXp} XP</span>
              <span className="text-ink-muted">Mục tiêu: {levelInfo.xpForNextLevel} XP</span>
            </div>
            <div className="h-3 w-full rounded-full bg-surface-raised border border-border-subtle overflow-hidden relative">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-primary to-emerald-400 shadow-md"
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progressPercent}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>
          </div>
        </div>

        {/* Action Button: Open XP Ledger Drawer */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenLedgerDrawer}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-surface-raised border border-border-subtle px-4 text-xs font-semibold text-ink hover:border-primary/50 hover:bg-surface transition-all shadow-sm"
          >
            <span>📜</span>
            <span>Xem Sổ Cái XP</span>
          </button>
        </div>
      </div>

      {/* 3. Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border-subtle/30">
        <div className="flex flex-col gap-1 rounded-xl bg-surface-raised/50 p-3 border border-border-subtle/40">
          <span className="text-xs text-ink-muted">Tổng Điểm XP</span>
          <span className="text-lg font-bold text-amber-400">{summaryStats.totalXp} XP</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl bg-surface-raised/50 p-3 border border-border-subtle/40">
          <span className="text-xs text-ink-muted">Chuỗi Dài Nhất</span>
          <span className="text-lg font-bold text-ink">{streakInfo.longestStreakDays} Ngày</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl bg-surface-raised/50 p-3 border border-border-subtle/40">
          <span className="text-xs text-ink-muted">Bài Học Đã Xong</span>
          <span className="text-lg font-bold text-emerald-400">{summaryStats.lessonsCompleted} Bài</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl bg-surface-raised/50 p-3 border border-border-subtle/40">
          <span className="text-xs text-ink-muted">Độ Chuẩn Trung Bình</span>
          <span
            className={`text-lg font-bold ${
              summaryStats.averageMasteryBp >= 8000
                ? "text-emerald-400"
                : summaryStats.averageMasteryBp >= 6000
                  ? "text-amber-400"
                  : "text-rose-400"
            }`}
          >
            {masteryPercent}%
          </span>
        </div>
      </div>
    </header>
  );
}
