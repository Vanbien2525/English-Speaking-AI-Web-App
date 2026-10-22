"use client";

import { useVocabularyStore } from "../stores/useVocabularyStore";
import { CheckCircle, Target } from "lucide-react";

export function DailyProgressBar() {
  const {
    dailyPracticedCount,
    dailyGoalCount,
  } = useVocabularyStore();

  const progressPercent = Math.min(
    100,
    Math.round((dailyPracticedCount / Math.max(1, dailyGoalCount)) * 100),
  );
  const isGoalReached = progressPercent >= 100;

  return (
    <div className="w-full bg-surface border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <span>Mục Tiêu Luyện Tập Hàng Ngày</span>
              {isGoalReached ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle className="h-3 w-3" /> Đã Đạt Mục Tiêu
                </span>
              ) : (
                <span className="text-xs font-semibold text-ink-muted">
                  ({dailyPracticedCount}/{dailyGoalCount} từ)
                </span>
              )}
            </h3>

          </div>
        </div>


      </div>

      {/* Progress Bar Track */}
      <div className="w-full flex items-center gap-3">
        <div className="flex-1 h-3 rounded-full bg-surface-raised border border-border-subtle overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs font-bold text-ink w-12 text-right">
          {progressPercent}%
        </span>
      </div>
    </div>
  );
}
