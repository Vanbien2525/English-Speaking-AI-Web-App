"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Volume2,
  Info,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { IPA_PHONEMES } from "@/core/data/ipa-dataset";
import type { IpaPhonemeData } from "@/core/data/ipa-dataset";
import { speechService } from "@/shared/lib/speech";
import { getStoredPhonemeScores } from "@/shared/lib/ipa-storage";

type FilterCategory = "all" | "monophthong" | "diphthong" | "consonant";

export function PhonemicChart() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackStep, setPlaybackStep] = useState<"idle" | "phoneme" | "pause" | "anchor">("idle");
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setScores(getStoredPhonemeScores());
    }, 0);
    return () => clearTimeout(timer);
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

  const completedCount = Object.values(scores).filter((s) => s >= 85).length;
  const progressPercent = Math.round((completedCount / 44) * 100);

  const renderPhonemeCard = (phoneme: IpaPhonemeData) => {
    const isPlaying = playingId === phoneme.id;
    const score = scores[phoneme.id] ?? 0;
    const isMastered = score >= 85;

    // Background color coding according to phonetic category
    let bgClasses = "bg-white border-slate-200/90 hover:border-slate-300 text-slate-800";
    if (phoneme.category === "monophthong") {
      bgClasses = "bg-emerald-50/40 border-emerald-100/90 hover:border-emerald-300 text-emerald-950";
    } else if (phoneme.category === "diphthong") {
      bgClasses = "bg-teal-50/40 border-teal-100/90 hover:border-teal-300 text-teal-950";
    } else if (phoneme.category === "consonant") {
      if (phoneme.isVoiced) {
        // Voiced consonant: Warm peach/amber
        bgClasses = "bg-amber-50/40 border-amber-200/70 hover:border-amber-300 text-amber-950";
      } else {
        // Voiceless consonant: Crisp sky blue
        bgClasses = "bg-sky-50/40 border-sky-200/70 hover:border-sky-300 text-sky-950";
      }
    }

    return (
      <div
        key={phoneme.id}
        onClick={() => handleCardClick(phoneme)}
        className={`group relative flex flex-col justify-between rounded-2xl p-3.5 transition-all duration-200 cursor-pointer select-none border-2 shadow-xs hover:-translate-y-1 hover:shadow-md ${bgClasses} ${
          isMastered ? "border-emerald-500! ring-2 ring-emerald-400/20 shadow-emerald-100/50" : ""
        } ${isPlaying ? "ring-2 ring-emerald-500 scale-[1.02]" : ""}`}
      >
        {/* Top Badges: Checkmark or Voiced tag + Info Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {isMastered ? (
              <span className="flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                <CheckCircle2 className="h-2.5 w-2.5" />
                <span>{score}%</span>
              </span>
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
        <div className="my-2.5 flex flex-col items-center justify-center text-center">
          <span
            className={`ipa text-3xl sm:text-4xl font-normal tracking-wide transition-transform ${
              isPlaying && playbackStep === "phoneme"
                ? "scale-115 text-emerald-600 font-semibold animate-pulse"
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
        <div className="flex items-center justify-between rounded-xl bg-white/80 px-2 py-1 border border-slate-100">
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
    <div className="w-full space-y-10">
      {/* Header Banner: Title, Progress Bar, Quick Filter */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Bản Đồ 44 Âm Vị Tiếng Anh Quốc Tế (IPA Chart)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Làm Chủ Khẩu Hình & Phát Âm Chuẩn Xác
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-slate-600">
              Chạm vào bất kỳ thẻ âm nào để nghe chuỗi phát âm chuẩn British RP. Nhấn vào biểu tượng{" "}
              <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">i</span>{" "}
              để vào phòng học sâu với 10 từ vựng và chấm điểm âm thanh.
            </p>
          </div>

          {/* Progress Card */}
          <div className="flex flex-col justify-between rounded-2xl bg-slate-50 border border-slate-200/80 p-4 min-w-[240px]">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>Tiến độ thành thạo</span>
              <span className="font-bold text-emerald-600">{completedCount} / 44 âm</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Đạt &gt; 85% để mở viền Mint</span>
              <span className="font-bold text-slate-700">{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Legend & Filter Controls */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          {/* Legend Items */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-slate-500">Chú giải:</span>
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-800 border border-emerald-200/60 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Nguyên âm đơn (12)
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1 text-teal-800 border border-teal-200/60 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
              Nguyên âm đôi (8)
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1 text-sky-800 border border-sky-200/60 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
              Phụ âm vô thanh (9)
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-amber-800 border border-amber-200/60 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Phụ âm hữu thanh (15)
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-emerald-700 border-2 border-emerald-500 font-bold">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Đã thành thạo (&gt;85%)
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveFilter("all")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Tất cả (44)
            </button>
            <button
              onClick={() => setActiveFilter("monophthong")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeFilter === "monophthong" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Nguyên âm đơn
            </button>
            <button
              onClick={() => setActiveFilter("diphthong")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeFilter === "diphthong" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Nguyên âm đôi
            </button>
            <button
              onClick={() => setActiveFilter("consonant")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeFilter === "consonant" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Phụ âm
            </button>
          </div>
        </div>
      </div>

      {/* Group 1: Monophthongs */}
      {(activeFilter === "all" || activeFilter === "monophthong") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs font-black text-emerald-700">
                12
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Nguyên Âm Đơn (Monophthongs)
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Khẩu hình cố định suốt quá trình phát âm
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {monophthongs.map((phoneme) => renderPhonemeCard(phoneme))}
          </div>
        </section>
      )}

      {/* Group 2: Diphthongs */}
      {(activeFilter === "all" || activeFilter === "diphthong") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-xs font-black text-teal-700">
                08
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Nguyên Âm Đôi (Diphthongs)
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Lướt mượt mà từ âm vị thứ nhất sang âm vị thứ hai
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {diphthongs.map((phoneme) => renderPhonemeCard(phoneme))}
          </div>
        </section>
      )}

      {/* Group 3: Consonants */}
      {(activeFilter === "all" || activeFilter === "consonant") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs font-black text-amber-800">
                24
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Phụ Âm (Consonants)
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Phân biệt rõ Vô thanh (xanh nhạt) và Hữu thanh (cam nhạt)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {consonants.map((phoneme) => renderPhonemeCard(phoneme))}
          </div>
        </section>
      )}
    </div>
  );
}
