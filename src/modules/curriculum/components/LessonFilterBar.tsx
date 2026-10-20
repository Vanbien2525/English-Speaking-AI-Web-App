"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface LessonFilterBarProps {
  activeCefr: string;
  activeErrorGroup: string;
  searchQuery: string;
}

const CEFR_LEVELS = ["all", "A1", "A2", "B1", "B2", "C1", "C2"] as const;

const ERROR_GROUPS = [
  { slug: "all", label: "Tất cả chuyên đề" },
  { slug: "dental-fricatives", label: "#Xát_Răng_/θ/-/ð/" },
  { slug: "ending-consonants", label: "#Mất_Âm_Đuôi" },
  { slug: "vowel-length", label: "#Nguyên_Âm_Dài_Ngắn" },
  { slug: "palato-alveolar", label: "#Âm_Uốn_Lưỡi_/ʃ/-/tʃ/" },
  { slug: "regional-confusion", label: "#Phụ_Âm_L_N" },
] as const;

export function LessonFilterBar({
  activeCefr,
  activeErrorGroup,
  searchQuery,
}: LessonFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(searchQuery);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value.trim().length === 0) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("view", "lessons"); // Always stay in lessons tab

    startTransition(() => {
      router.push(`/learn?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", searchTerm);
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl bg-surface border border-border-subtle shadow-md">
      {/* 1. Search Box */}
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm bài học, cụm từ luyện tập, âm vị trọng tâm (vd: think, sheep)..."
          className="w-full h-11 pl-11 pr-24 rounded-xl bg-surface-raised border border-border-subtle text-sm text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none transition-colors"
        />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-base">
          🔍
        </span>
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/25 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
        >
          Tìm kiếm
        </button>
      </form>

      {/* 2. CEFR Level Selector */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle/50">
        <span className="text-xs font-bold text-ink-muted mr-1">Trình độ CEFR:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {CEFR_LEVELS.map((lvl) => {
            const isActive = activeCefr === lvl;
            return (
              <button
                key={`cefr-${lvl}`}
                type="button"
                onClick={() => updateParam("cefr", lvl)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  isActive
                    ? "bg-primary text-canvas border-primary shadow-sm"
                    : "bg-surface-raised text-ink-muted border-border-subtle hover:text-ink hover:border-border-subtle"
                }`}
              >
                {lvl === "all" ? "Tất cả" : lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Vietnamese Phonetic Error Group Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle/50">
        <span className="text-xs font-bold text-ink-muted mr-1">Chuyên đề lỗi VN:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {ERROR_GROUPS.map((grp) => {
            const isActive = activeErrorGroup === grp.slug;
            return (
              <button
                key={`grp-${grp.slug}`}
                type="button"
                onClick={() => updateParam("errorGroup", grp.slug)}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                  isActive
                    ? "bg-amber-950/40 text-amber-400 border-amber-500/50 shadow-sm"
                    : "bg-surface-raised/70 text-ink-muted border-border-subtle/70 hover:text-ink hover:border-border-subtle"
                }`}
              >
                {grp.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
