"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  Box,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Award,
  ArrowRight,
  Volume2,
  Zap,
} from "lucide-react";
import { getStoredPhonemeScores, getStoredErrorWords } from "@/shared/lib/ipa-storage";
import { getRealDailyStreak } from "@/shared/lib/streak-tracker";
import { IPA_PHONEMES } from "@/core/data/ipa-dataset";
import { speechService } from "@/shared/lib/speech";

export function DashboardView() {
  const [masteredCount, setMasteredCount] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [streakDays, setStreakDays] = useState(1);

  useEffect(() => {
    const updateStats = () => {
      const scores = getStoredPhonemeScores();
      const scoreVals = Object.values(scores);
      const mastered = scoreVals.filter((s) => s >= 80).length;
      setMasteredCount(mastered);

      if (scoreVals.length > 0) {
        const avg = Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length);
        setAverageScore(avg);
      }

      const errors = getStoredErrorWords();
      setErrorCount(errors.length);

      setStreakDays(getRealDailyStreak());
    };

    const timer = setTimeout(updateStats, 0);
    window.addEventListener("storage", updateStats);
    window.addEventListener("ast3d_ipa_storage_updated", updateStats);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage", updateStats);
      window.removeEventListener("ast3d_ipa_storage_updated", updateStats);
    };
  }, []);

  const progressPercent = Math.round((masteredCount / 44) * 100);

  // Daily Recommended Phoneme: Dental fricative /θ/ (think)
  const dailyFocus = IPA_PHONEMES.find((p) => p.symbol === "θ") ?? IPA_PHONEMES[0]!;

  const handlePlayFocusSound = async () => {
    await speechService.playPhonemeSequence(dailyFocus.symbol, dailyFocus.anchorWord);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-10 px-4 py-8 sm:px-8 lg:px-12">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Chào mừng trở lại phòng luyện phát âm cá nhân</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Hôm nay bạn muốn rèn luyện kỹ năng nào?
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Hệ thống nhận diện âm vị AI sẽ theo dõi từng chuyển động phát âm, bóc tách lỗi thay thế âm và nuốt âm với độ chính xác cao.
          </p>
        </div>

        {/* Quick Streak Pill */}
        <div className="flex items-center gap-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs">
            <Flame className="h-6 w-6 fill-white" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-900">{streakDays}</span>
              <span className="text-xs font-bold text-amber-700">Ngày liên tiếp</span>
            </div>
            <span className="text-[11px] font-semibold text-amber-600">
              {streakDays > 1 ? "Chuỗi ngày luyện tập bền bỉ!" : "Bắt đầu ngày học đầu tiên!"}
            </span>
          </div>
        </div>
      </div>

      {/* Core Progress Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Mastered Phonemes */}
        <div className="rounded-2xl border-2 border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Âm vị thành thạo (≥80%)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{masteredCount}</span>
            <span className="text-sm font-semibold text-slate-400">/ 44 âm</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Average Score */}
        <div className="rounded-2xl border-2 border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Điểm phát âm TB</span>
            <Award className="h-4 w-4 text-teal-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {averageScore > 0 ? averageScore : "--"}
            </span>
            <span className="text-sm font-semibold text-slate-400">%</span>
          </div>
          <span className="mt-3 block text-xs font-medium text-emerald-600">
            {averageScore >= 80 ? "Đẳng cấp Chuẩn Bản Xứ" : averageScore >= 60 ? "Phát âm Khá Tốt" : "Cần duy trì luyện tập"}
          </span>
        </div>

        {/* Metric 3: Error Ledger */}
        <div className="rounded-2xl border-2 border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Từ cần ôn tập</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{errorCount}</span>
            <span className="text-sm font-semibold text-slate-400">từ</span>
          </div>
          <span className="mt-3 block text-xs font-medium text-slate-500">
            {errorCount > 0 ? "Các từ đạt điểm < 80%" : "Chưa có từ nào bị lỗi"}
          </span>
        </div>

        {/* Metric 4: Daily Target */}
        <div className="rounded-2xl border-2 border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Mục tiêu hôm nay</span>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">15</span>
            <span className="text-sm font-semibold text-slate-400">phút</span>
          </div>
          <span className="mt-3 block text-xs font-medium text-amber-600">
            Khuyến khích 10 từ vựng mỗi ngày
          </span>
        </div>
      </div>

      {/* Main Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Học IPA (Main Phonemic Chart) */}
        <div className="group relative flex flex-col justify-between rounded-3xl border-2 border-emerald-500/30 bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                Khuyên Học
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-2">
              Học 44 Âm Vị IPA
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Khám phá toàn bộ 12 nguyên âm đơn, 8 nguyên âm đôi và 24 phụ âm. Chạm để nghe chuỗi phát âm tức thì và xem chỉ dẫn khẩu hình.
            </p>
          </div>

          <Link
            href="/ipa"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-xs font-bold text-white shadow-xs shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-95"
          >
            <span>Vào Học Bảng IPA</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Card 2: Luyện tập (Practice Studio) */}
        <div className="group relative flex flex-col justify-between rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-200">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                4 Chế Độ
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-2">
              Phòng Luyện Phản Xạ
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Thử thách Cặp âm nhầm lẫn (Minimal Pairs), game Nối từ với IPA, bài thi Nghe &amp; Chọn và Sổ tay ôn tập lỗi sai tự động.
            </p>
          </div>

          <Link
            href="/ipa/practice"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-600 active:scale-95"
          >
            <span>Bắt Đầu Luyện Tập</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Card 3: 3D Model (Coming Soon) - Disabled state */}
        <div className="relative flex flex-col justify-between rounded-3xl border-2 border-slate-200/60 bg-slate-50/70 p-6 opacity-75 cursor-not-allowed select-none">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-400">
                <Box className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                Coming Soon
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-700 mb-2">
              Khẩu Hình Miệng 3D
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Mô phỏng mặt cắt giải phẫu chuyển động của lưỡi, ngạc cứng và dây thanh âm 3D đang được tinh chỉnh hoàn thiện.
            </p>
          </div>

          <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-200 py-3 text-xs font-bold text-slate-400 cursor-not-allowed">
            <span>Sắp Ra Mắt</span>
          </div>
        </div>
      </div>

      {/* Daily Recommended Target Focus Box */}
      <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50/40 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-200">
            <span className="ipa text-3xl font-black">/{dailyFocus.symbol}/</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Trọng tâm hôm nay
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Từ khóa: <strong>{dailyFocus.anchorWord}</strong> ({dailyFocus.anchorWordIpa})
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              Luyện Âm /{dailyFocus.symbol}/: {dailyFocus.nameVi}
            </h3>
            <p className="text-xs text-slate-600 max-w-lg mt-0.5">
              {dailyFocus.articulationGuideVi}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayFocusSound}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 active:scale-95 shadow-xs"
            title="Nghe mẫu âm"
          >
            <Volume2 className="h-5 w-5" />
          </button>
          <Link
            href={`/ipa/${dailyFocus.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
          >
            <span>Luyện 10 Từ Của Âm Này</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
