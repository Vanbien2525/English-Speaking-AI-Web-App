"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { LessonCardDto } from "@/core/dto/curriculum.dto";

interface LessonCardProps {
  lesson: LessonCardDto;
}

export function LessonCard({ lesson }: LessonCardProps) {
  // Map CEFR Level Badges
  const cefrStyles = {
    A1: "bg-emerald-950/50 text-emerald-400 border-emerald-500/40",
    A2: "bg-cyan-950/50 text-cyan-400 border-cyan-500/40",
    B1: "bg-amber-950/50 text-amber-400 border-amber-500/40",
    B2: "bg-orange-950/50 text-orange-400 border-orange-500/40",
    C1: "bg-purple-950/50 text-purple-400 border-purple-500/40",
    C2: "bg-rose-950/50 text-rose-400 border-rose-500/40",
  }[lesson.cefr];

  const bestScore = lesson.userProgress?.bestScoreBp
    ? Math.round(lesson.userProgress.bestScoreBp / 100)
    : null;

  return (
    <motion.article
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="flex flex-col justify-between p-5 rounded-2xl bg-surface border border-border-subtle shadow-lg hover:border-primary/50 transition-all group"
    >
      <div>
        {/* Top Meta: CEFR + Category + XP Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-black border ${cefrStyles}`}
            >
              {lesson.cefr}
            </span>
            <span className="text-xs text-ink-muted truncate max-w-[150px]">
              {lesson.categoryTitleVi}
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-500/30">
            <span>⭐</span>
            <span>+{lesson.xpReward} XP</span>
          </span>
        </div>

        {/* Lesson Titles */}
        <h3 className="text-base font-bold text-ink group-hover:text-primary transition-colors leading-snug">
          {lesson.titleEn}
        </h3>
        <p className="text-xs text-ink-muted mt-1 font-medium">{lesson.titleVi}</p>

        {/* Description */}
        {lesson.descriptionVi && (
          <p className="text-xs text-ink-muted/80 mt-2 line-clamp-2 leading-relaxed">
            {lesson.descriptionVi}
          </p>
        )}

        {/* Focus Phonemes Chips */}
        {lesson.focusPhonemes.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-ink-muted">Âm trọng tâm:</span>
            {lesson.focusPhonemes.map((ph) => (
              <span
                key={ph.id}
                className="ipa px-2 py-0.5 rounded-md bg-surface-raised border border-border-subtle text-xs font-bold text-primary"
              >
                /{ph.ipaSymbol}/
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Footer: Stats & CTA */}
      <div className="mt-5 pt-4 border-t border-border-subtle/50 flex items-center justify-between gap-3">
        {/* Progress or Duration */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-muted flex items-center gap-1">
            <span>⏱</span>
            <span>{lesson.estimatedMinutes}p</span>
          </span>

          {bestScore !== null ? (
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
                bestScore >= 80
                  ? "bg-emerald-950/50 text-emerald-400 border-emerald-500/40"
                  : "bg-amber-950/50 text-amber-400 border-amber-500/40"
              }`}
            >
              {bestScore >= 80 && <span>👑</span>}
              <span>{bestScore}%</span>
            </span>
          ) : (
            <span className="text-[11px] text-ink-muted opacity-60">Chưa học</span>
          )}
        </div>

        {/* CTA Link */}
        <Link
          href={`/practice?lessonId=${lesson.id}`}
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-primary text-canvas font-bold text-xs hover:brightness-110 transition-all shadow-sm"
        >
          <span>Luyện tập</span>
          <span>→</span>
        </Link>
      </div>
    </motion.article>
  );
}
