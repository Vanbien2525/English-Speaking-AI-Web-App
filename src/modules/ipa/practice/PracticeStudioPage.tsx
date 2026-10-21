"use client";

import { useState } from "react";
import {
  Sparkles,
  GitCompare,
  Shuffle,
  Volume2,
  AlertTriangle,
} from "lucide-react";
import { MinimalPairsPractice } from "./MinimalPairsPractice";
import { MatchingPractice } from "./MatchingPractice";
import { ListeningPractice } from "./ListeningPractice";
import { ErrorReviewPractice } from "./ErrorReviewPractice";

type PracticeTab = "minimal_pairs" | "matching" | "listening" | "error_review";

export function PracticeStudioPage() {
  const [activeTab, setActiveTab] = useState<PracticeTab>("minimal_pairs");

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      {/* Top Hero Banner */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Phòng Luyện Tập Tương Tác Đa Giác Quan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Phòng Luyện Phản Xạ Âm Vị IPA
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-500">
              Rèn luyện độ nhạy thính giác, xóa bỏ hoàn toàn các cặp âm dễ nhầm lẫn và ôn tập có chủ đích các từ vựng bị lỗi.
            </p>
          </div>
        </div>

        {/* 4 Interactive Mode Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
          <button
            onClick={() => setActiveTab("minimal_pairs")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "minimal_pairs"
                ? "bg-emerald-500 text-white shadow-xs shadow-emerald-200"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
            }`}
          >
            <GitCompare className="h-4 w-4" />
            <span>Cặp Âm Nhầm Lẫn</span>
          </button>

          <button
            onClick={() => setActiveTab("matching")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "matching"
                ? "bg-emerald-500 text-white shadow-xs shadow-emerald-200"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
            }`}
          >
            <Shuffle className="h-4 w-4" />
            <span>Nối Từ &amp; IPA</span>
          </button>

          <button
            onClick={() => setActiveTab("listening")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "listening"
                ? "bg-emerald-500 text-white shadow-xs shadow-emerald-200"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
            }`}
          >
            <Volume2 className="h-4 w-4" />
            <span>Nghe &amp; Chọn</span>
          </button>

          <button
            onClick={() => setActiveTab("error_review")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "error_review"
                ? "bg-emerald-500 text-white shadow-xs shadow-emerald-200"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Ôn Tập Lỗi Sai (&lt;70%)</span>
          </button>
        </div>
      </div>

      {/* Render Active Tab Module */}
      <div>
        {activeTab === "minimal_pairs" && <MinimalPairsPractice />}
        {activeTab === "matching" && <MatchingPractice />}
        {activeTab === "listening" && <ListeningPractice />}
        {activeTab === "error_review" && <ErrorReviewPractice />}
      </div>
    </div>
  );
}
