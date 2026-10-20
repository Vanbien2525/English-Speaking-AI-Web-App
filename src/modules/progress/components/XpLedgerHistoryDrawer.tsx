"use client";

import { motion, AnimatePresence } from "motion/react";
import type { XpLedgerEntry } from "@/core/dto/progress.dto";

interface XpLedgerHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entries: XpLedgerEntry[];
  currentTotalXp: string;
}

export function XpLedgerHistoryDrawer({
  isOpen,
  onClose,
  entries,
  currentTotalXp,
}: XpLedgerHistoryDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Slide-over Content Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative z-10 flex h-full w-full max-w-md flex-col bg-surface border-l border-border-subtle p-6 shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle/50 pb-4">
              <div>
                <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                  <span>Sổ Cái Điểm Thưởng XP</span>
                  <span className="text-sm">📜</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Lịch sử kế toán bất biến (Append-Only ACID Ledger)
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-raised border border-border-subtle text-ink hover:bg-surface transition-colors"
                aria-label="Đóng sổ cái"
              >
                ✕
              </button>
            </div>

            {/* Current Total Balance Card */}
            <div className="my-5 flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-primary/10 to-transparent border border-amber-500/30">
              <div className="flex flex-col">
                <span className="text-xs text-ink-muted">Tổng Số Dư Khả Dụng</span>
                <span className="text-2xl font-black text-amber-400">{currentTotalXp} XP</span>
              </div>
              <span className="rounded-full bg-emerald-950/60 px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                ✓ ACID Khóa Dòng
              </span>
            </div>

            {/* Transaction Timeline */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Lịch Sử Biến Động Gần Nhất
              </h4>

              {entries.length === 0 ? (
                <p className="text-xs text-ink-muted text-center py-8">Chưa có giao dịch XP nào.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start justify-between p-3 rounded-xl bg-surface-raised/40 border border-border-subtle/60 text-xs hover:border-border-subtle transition-all"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-ink">{entry.sourceLabelVi}</span>
                        <span className="text-[10px] text-ink-muted">
                          {new Date(entry.createdAt).toLocaleString("vi-VN")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Số dư sau: {entry.balanceAfter} XP
                        </span>
                      </div>

                      <span className="font-extrabold text-sm text-emerald-400 shrink-0">
                        {entry.amount} XP
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
