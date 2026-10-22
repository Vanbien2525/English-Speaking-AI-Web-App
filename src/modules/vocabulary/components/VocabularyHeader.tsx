"use client";

import Link from "next/link";
import { useVocabularyStore } from "../stores/useVocabularyStore";

export function VocabularyHeader() {
  const {
    metrics,
    dueItems,
    setQuickAddOpen,
    setBatchImportOpen,
  } = useVocabularyStore();

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
          <p className="text-sm text-ink-muted mt-1 max-w-2xl leading-relaxed">
            Làm chủ vốn từ giao tiếp tự nhiên, tối ưu khẩu hình chuẩn British RP và phản xạ phát âm lưu loát.
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
        </div>
      </div>

      {/* 3 Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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
      </div>
    </div>
  );
}
