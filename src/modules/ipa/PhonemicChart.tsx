"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  Info,
  CheckCircle2,
  XCircle,
  Sparkles,
  LayoutGrid,
  Dumbbell,
} from "lucide-react";
import { IPA_PHONEMES } from "@/core/data/ipa-dataset";
import type { IpaPhonemeData } from "@/core/data/ipa-dataset";
import { speechService } from "@/shared/lib/speech";
import { getStoredPhonemeScores, IPA_STORAGE_EVENT } from "@/shared/lib/ipa-storage";
import { PracticeStudioPage } from "./practice/PracticeStudioPage";

type FilterCategory = "all" | "monophthong" | "diphthong" | "consonant";
type MainView = "chart" | "practice";

export function PhonemicChart() {
  const [mainView, setMainView] = useState<MainView>("chart");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackStep, setPlaybackStep] = useState<"idle" | "phoneme" | "pause" | "anchor">("idle");
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");

  const refreshScores = () => {
    setScores(getStoredPhonemeScores());
  };

  useEffect(() => {
    const timer = setTimeout(refreshScores, 0);

    // Listen to reactive storage updates from practice/detail pages
    const handleUpdate = () => refreshScores();
    window.addEventListener(IPA_STORAGE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      clearTimeout(timer);
      window.removeEventListener(IPA_STORAGE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const handleCardClick = async (phoneme: IpaPhonemeData) => {
    if (playingId === phoneme.id) {
      speechService.cancel();
      setPlayingId(null);
      setPlaybackStep("idle");
      return;
    }

    setPlayingId(phoneme.id);
    try {
      await speechService.playPhonemeSequence(
        phoneme.symbol,
        phoneme.anchorWord,
        (step) => setPlaybackStep(step)
      );
    } finally {
      setPlayingId(null);
      setPlaybackStep("idle");
    }
  };

  const monophthongs = IPA_PHONEMES.filter((p) => p.category === "monophthong");
  const diphthongs = IPA_PHONEMES.filter((p) => p.category === "diphthong");
  const consonants = IPA_PHONEMES.filter((p) => p.category === "consonant");

  const completedCount = Object.values(scores).filter((s) => s >= 80).length;
  const progressPercent = Math.round((completedCount / 44) * 100);

  const renderPhonemeCard = (phoneme: IpaPhonemeData) => {
    const isPlaying = playingId === phoneme.id;
    const score = scores[phoneme.id] ?? 0;
    const isScored = score > 0;
    const isPass = score >= 80;

    // Background color coding according to phonetic category
    let bgClasses = "bg-white border-slate-200/90 hover:border-slate-300 text-slate-800";
    if (phoneme.category === "monophthong") {
      bgClasses = "bg-emerald-50/40 border-emerald-100/90 hover:border-emerald-300 text-emerald-950";
    } else if (phoneme.category === "diphthong") {
      bgClasses = "bg-teal-50/40 border-teal-100/90 hover:border-teal-300 text-teal-950";
    } else if (phoneme.category === "consonant") {
      if (phoneme.isVoiced) {
        bgClasses = "bg-amber-50/40 border-amber-200/70 hover:border-amber-300 text-amber-950";
      } else {
        bgClasses = "bg-sky-50/40 border-sky-200/70 hover:border-sky-300 text-sky-950";
      }
    }

    return (
      <div
        key={phoneme.id}
        onClick={() => handleCardClick(phoneme)}
        className={`group relative flex flex-col justify-between rounded-2xl p-4 transition-all duration-200 cursor-pointer select-none border-2 shadow-xs hover:-translate-y-1 hover:shadow-md ${bgClasses} ${
          isPlaying ? "ring-2 ring-emerald-500 scale-[1.02] shadow-md z-10" : ""
        }`}
      >
        {/* Top Badges: Score Checkmark/X badge or Category Tag + Info Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {isScored ? (
              isPass ? (
                // Requirement 5: Score >= 80 -> Green Mint Badge with Checkmark
                <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{score}%</span>
                </span>
              ) : (
                // Requirement 5: Score < 80 -> Red Badge with small "x"
                <span className="flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                  <XCircle className="h-3 w-3" />
                  <span>{score}%</span>
                </span>
              )
            ) : phoneme.category === "consonant" ? (
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-tight uppercase ${
                  phoneme.isVoiced
                    ? "bg-amber-100 text-amber-800"
                    : "bg-sky-100 text-sky-800"
                }`}
              >
                {phoneme.isVoiced ? "Hữu thanh" : "Vô thanh"}
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-400">
                {phoneme.category === "monophthong" ? "Nguyên âm đơn" : "Nguyên âm đôi"}
              </span>
            )}
          </div>

          {/* Info Button ("i" icon) */}
          <Link
            href={`/ipa/${phoneme.id}`}
            onClick={(e) => e.stopPropagation()}
            title={`Xem chi tiết & luyện 10 từ của âm ${phoneme.symbol}`}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-xs border border-slate-200 transition-all hover:bg-emerald-500 hover:text-white hover:border-emerald-500 active:scale-95"
          >
            <Info className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Center: Large IPA Symbol */}
        <div className="my-3 flex flex-col items-center justify-center text-center px-1">
          <span
            className={`ipa text-2xl sm:text-3xl font-medium tracking-normal whitespace-nowrap select-none inline-block leading-none transition-transform ${
              isPlaying && playbackStep === "phoneme"
                ? "scale-110 text-emerald-600 font-semibold animate-pulse"
                : ""
            }`}
          >
            /{phoneme.symbol}/
          </span>
          <span className="text-[11px] font-medium text-slate-500 mt-1 line-clamp-1">
            {phoneme.nameVi}
          </span>
        </div>

        {/* Bottom: Anchor Word with Audio Indicator */}
        <div className="flex items-center justify-between rounded-xl bg-white/80 px-2.5 py-1.5 border border-slate-100">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Volume2
              className={`h-3 w-3 shrink-0 ${
                isPlaying ? "text-emerald-500 animate-bounce" : "text-slate-400"
              }`}
            />
            <span
              className={`text-xs font-semibold truncate ${
                isPlaying && playbackStep === "anchor"
                  ? "text-emerald-700 underline font-bold"
                  : "text-slate-700"
              }`}
            >
              {phoneme.anchorWord}
            </span>
          </div>
          <span className="ipa text-[10px] text-slate-400 shrink-0">
            {phoneme.anchorWordIpa}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-8">
      {/* Top Module Sub-Menu Switcher (Requirement 11) */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="inline-flex rounded-2xl bg-slate-100/90 p-1.5 border border-slate-200/80 shadow-xs">
          <button
            onClick={() => setMainView("chart")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              mainView === "chart"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Bản Đồ 44 Âm Vị IPA</span>
          </button>

          <button
            onClick={() => setMainView("practice")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              mainView === "practice"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Dumbbell className="h-4 w-4" />
            <span>Phòng Luyện Phản Xạ Âm Vị</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mainView === "practice" ? (
          <motion.div
            key="practice_view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <PracticeStudioPage />
          </motion.div>
        ) : (
          <motion.div
            key="chart_view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-10"
          >
            {/* Header Banner: Title, Progress Bar, Quick Filter */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Bản Đồ 44 Âm Vị Tiếng Anh Quốc Tế (IPA Chart)</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Làm Chủ Khẩu Hình &amp; Phát Âm Chuẩn Xác
                  </h1>
                  <p className="max-w-3xl text-sm sm:text-base text-slate-600">
                    Chạm vào thẻ để nghe âm vị cô lập và từ mẫu chuẩn British RP giọng nam. Nhấn vào biểu tượng{" "}
                    <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">i</span>{" "}
                    để vào phòng học sâu với 10 từ vựng và chấm điểm âm thanh.
                  </p>
                </div>

                {/* Progress Card */}
                <div className="flex flex-col justify-between rounded-2xl bg-slate-50 border border-slate-200/80 p-5 min-w-[260px]">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                    <span>Tiến độ thành thạo (&gt;= 80%)</span>
                    <span className="font-bold text-emerald-600">{completedCount} / 44 âm</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Đạt &gt;= 80% có dấu check xanh</span>
                    <span className="font-bold text-slate-700">{progressPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Category Quick Filter */}
              <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-6">
                <span className="text-xs font-bold text-slate-400 mr-1 uppercase tracking-wider">
                  Bộ lọc:
                </span>
                {[
                  { id: "all", label: "Tất cả 44 âm" },
                  { id: "monophthong", label: "12 Nguyên âm đơn" },
                  { id: "diphthong", label: "8 Nguyên âm đôi" },
                  { id: "consonant", label: "24 Phụ âm" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id as FilterCategory)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                      activeFilter === f.id
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. Monophthongs Group */}
            {(activeFilter === "all" || activeFilter === "monophthong") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-xs font-extrabold text-emerald-800">
                      1
                    </span>
                    <h2 className="text-lg font-bold text-slate-800">
                      Nguyên Âm Đơn (Monophthongs)
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">
                      (12 âm vị)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
                  {monophthongs.map(renderPhonemeCard)}
                </div>
              </div>
            )}

            {/* 2. Diphthongs Group */}
            {(activeFilter === "all" || activeFilter === "diphthong") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-100 text-xs font-extrabold text-teal-800">
                      2
                    </span>
                    <h2 className="text-lg font-bold text-slate-800">
                      Nguyên Âm Đôi (Diphthongs)
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">
                      (8 âm vị)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3.5 sm:gap-4">
                  {diphthongs.map(renderPhonemeCard)}
                </div>
              </div>
            )}

            {/* 3. Consonants Group */}
            {(activeFilter === "all" || activeFilter === "consonant") && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-xs font-extrabold text-amber-800">
                      3
                    </span>
                    <h2 className="text-lg font-bold text-slate-800">
                      Phụ Âm (Consonants)
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">
                      (24 âm vị)
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                      Vô thanh (Voiceless)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      Hữu thanh (Voiced)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
                  {consonants.map(renderPhonemeCard)}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
