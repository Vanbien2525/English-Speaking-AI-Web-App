"use client";

import Link from "next/link";
import { useVocabularyStore } from "../stores/useVocabularyStore";

export function VocabularyHeader() {
  const {
    metrics,
    dueItems,
    isReviewing,
    setIsReviewing,
    setQuickAddOpen,
    setBatchImportOpen,
  } = useVocabularyStore();

  const retentionPercent = Math.round(metrics.retentionRateBp / 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-ink-muted mb-1">
            <Link href="/" className="hover:text-primary transition">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-ink font-semibold">Từ Vựng Phản Xạ Nói & Thẻ 3D</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            Active Vocabulary & Speaking Mastery
          </h1>
          <p className="text-sm text-ink-muted mt-1 max-w-2xl">
            Luyện ghi nhớ từ vựng phản xạ với thuật toán giãn cách SM-2 kết hợp mô hình khoang miệng 3D và cơ chế bắt buộc phát âm chuẩn ≥ 80 điểm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setQuickAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-raised border border-border-subtle hover:border-primary/50 text-xs font-semibold text-ink transition active:scale-95 shadow-sm"
          >
            <span>⚡</span>
            <span>Nhập 1-Chạm</span>
          </button>

          <button
            onClick={() => setBatchImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-raised border border-border-subtle hover:border-primary/50 text-xs font-semibold text-ink transition active:scale-95 shadow-sm"
          >
            <span>📋</span>
            <span>Nhập Hàng Loạt</span>
          </button>

          <button
            onClick={() => setIsReviewing(!isReviewing)}
            className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs transition active:scale-95 shadow-md ${
              isReviewing
                ? "bg-surface-raised border border-border-subtle text-ink hover:border-primary/50"
                : "bg-primary text-canvas hover:brightness-110"
            }`}
          >
            <span>{isReviewing ? "📋 Xem Danh Sách Từ" : "🗂️ Luyện Thẻ 3D Ngay"}</span>
            {!isReviewing && dueItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-canvas/30 text-canvas font-black text-[10px]">
                {dueItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-surface border border-border-subtle flex flex-col justify-between shadow-sm">
          <span className="text-xs font-semibold text-ink-muted uppercase">Tổng số từ vựng</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-ink">{metrics.totalWords}</span>
            <span className="text-xs text-ink-muted">từ trong kho</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border-subtle flex flex-col justify-between shadow-sm">
          <span className="text-xs font-semibold text-ink-muted uppercase">Cần ôn hôm nay</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-extrabold ${dueItems.length > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {dueItems.length}
            </span>
            <span className="text-xs text-ink-muted">thẻ đến hạn</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border-subtle flex flex-col justify-between shadow-sm">
          <span className="text-xs font-semibold text-ink-muted uppercase">Đã thuộc vững chắc</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {metrics.masteredWordsCount}
            </span>
            <span className="text-xs text-ink-muted">phát âm ≥ 80%</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border-subtle flex flex-col justify-between shadow-sm">
          <span className="text-xs font-semibold text-ink-muted uppercase">Tỷ lệ duy trì (SM-2)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-primary">{retentionPercent}%</span>
            <span className="text-xs text-ink-muted">ghi nhớ trung bình</span>
          </div>
        </div>
      </div>
    </div>
  );
}
