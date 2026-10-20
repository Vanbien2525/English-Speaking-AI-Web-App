"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { PedagogicalRecommendationDto } from "@/core/dto/curriculum.dto";

interface WeakPhonemeBannerProps {
  recommendation: PedagogicalRecommendationDto | null;
}

export function WeakPhonemeBanner({ recommendation }: WeakPhonemeBannerProps) {
  if (!recommendation) return null;

  const { weakestPhoneme, recommendedLesson, reasonVi } = recommendation;

  return (
    <motion.aside
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      aria-label="Gợi ý sư phạm cá nhân hóa"
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-rose-950/30 via-surface to-surface border border-rose-500/30 shadow-lg"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-lg">
          <span className="animate-pulse">⚡</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Gợi Ý Sư Phạm Cá Nhân Hóa (AI Advisor)
            </span>
            <span className="rounded-full bg-rose-950/60 px-2.5 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/40 ipa">
              /{weakestPhoneme.ipaSymbol}/
            </span>
          </div>
          <p className="text-sm text-ink leading-relaxed max-w-3xl">{reasonVi}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
        {recommendedLesson ? (
          <Link
            href={`/practice?lessonId=${recommendedLesson.id}`}
            className="flex items-center gap-1.5 py-2.5 px-5 rounded-xl bg-rose-500 text-canvas font-bold text-xs hover:bg-rose-400 transition-colors shadow-md"
          >
            <span>Khắc phục ngay</span>
            <span>→</span>
          </Link>
        ) : (
          <Link
            href={`/practice?phonemeId=${weakestPhoneme.id}&symbol=${encodeURIComponent(
              weakestPhoneme.ipaSymbol,
            )}`}
            className="flex items-center gap-1.5 py-2.5 px-5 rounded-xl bg-primary text-canvas font-bold text-xs hover:brightness-110 transition-all shadow-md"
          >
            <span>Luyện âm /{weakestPhoneme.ipaSymbol}/ 3D</span>
            <span>→</span>
          </Link>
        )}
      </div>
    </motion.aside>
  );
}
