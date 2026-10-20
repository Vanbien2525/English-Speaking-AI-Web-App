"use client";

import { motion } from "motion/react";
import type { AchievementItem } from "@/core/dto/progress.dto";

interface AchievementsBadgeGridProps {
  achievements: AchievementItem[];
}

export function AchievementsBadgeGrid({ achievements }: AchievementsBadgeGridProps) {
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <section
      aria-labelledby="achievements-heading"
      className="flex flex-col gap-4 rounded-2xl bg-surface p-6 border border-border-subtle shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="achievements-heading" className="text-lg font-bold text-ink flex items-center gap-2">
            <span>Kho Danh Hiệu & Huy Hiệu</span>
            <span>🎖️</span>
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Mở khóa các cột mốc danh giá trong hành trình chinh phục ngữ âm
          </p>
        </div>

        <span className="rounded-full bg-surface-raised px-3 py-1 text-xs font-bold text-ink border border-border-subtle">
          {unlockedCount}/{achievements.length} Đã Mở
        </span>
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {achievements.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
              item.isUnlocked
                ? "bg-gradient-to-br from-amber-950/20 to-surface-raised/40 border-amber-500/40 shadow-sm"
                : "bg-surface-raised/30 border-border-subtle/50 opacity-60"
            }`}
          >
            {/* Icon / Badge Shield */}
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl border ${
                item.isUnlocked
                  ? "bg-amber-500/10 border-amber-500/40 shadow-inner"
                  : "bg-slate-900/60 border-slate-800 text-slate-500"
              }`}
            >
              {item.isUnlocked ? item.icon : "🔒"}
            </div>

            {/* Info */}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-ink truncate">{item.titleVi}</span>
                <span className="text-[10px] font-bold text-amber-400 shrink-0">+{item.xpReward} XP</span>
              </div>
              <p className="text-[11px] text-ink-muted line-clamp-2 mt-0.5">{item.descriptionVi}</p>

              {item.isUnlocked && item.unlockedAt && (
                <span className="text-[9px] text-emerald-400 font-semibold mt-1">
                  ✓ Đã đạt: {item.unlockedAt.slice(0, 10)}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
