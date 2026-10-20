"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";

interface CurriculumHeaderProps {
  activeView: "ipa" | "lessons";
}

export function CurriculumHeader({ activeView }: CurriculumHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const handleTabChange = (view: "ipa" | "lessons") => {
    if (view === activeView) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);

    startTransition(() => {
      router.push(`/learn?${params.toString()}`);
    });
  };

  return (
    <header className="flex flex-col gap-6 rounded-2xl bg-surface p-6 border border-border-subtle shadow-xl">
      {/* Top Meta Line: Unit indicator & Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/25">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Học Liệu Ngữ Âm Chuẩn Quốc Tế
          </span>
          <span className="text-xs text-ink-muted">British RP • 44 Âm Vị • CEFR A1–C2</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-950/40 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/40">
            🎯 Chuẩn Bản Xứ: &gt;= 80%
          </span>
        </div>
      </div>

      {/* Main Title & Segmented Control Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-t border-border-subtle/50 pt-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink">
            Trung Tâm Học Liệu & Lộ Trình Phát Âm
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted max-w-2xl">
            Bản đồ nhiệt 44 âm vị IPA theo thời gian thực và hệ thống bài học phân tầng khắc phục triệt
            để các điểm nghẽn phát âm đặc trưng của người Việt.
          </p>
        </div>

        {/* Luxury Segmented View Switcher */}
        <div className="inline-flex p-1 rounded-xl bg-surface-raised border border-border-subtle shrink-0">
          <button
            type="button"
            onClick={() => handleTabChange("ipa")}
            className={`relative px-4 py-2 text-xs md:text-sm font-semibold transition-colors duration-200 rounded-lg ${
              activeView === "ipa" ? "text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {activeView === "ipa" && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-primary/20 border border-primary/40 rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <span className="ipa">/aɪ.piː.eɪ/</span>
              <span>Bản Đồ 44 Âm IPA</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("lessons")}
            className={`relative px-4 py-2 text-xs md:text-sm font-semibold transition-colors duration-200 rounded-lg ${
              activeView === "lessons" ? "text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {activeView === "lessons" && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-primary/20 border border-primary/40 rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <span>📚</span>
              <span>Lộ Trình Bài Học CEFR</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
