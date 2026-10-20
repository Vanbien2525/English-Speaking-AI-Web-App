"use client";

import { motion, AnimatePresence } from "motion/react";

interface StreakFreezeModalProps {
  isOpen: boolean;
  onClose: () => void;
  freezesAvailable: number;
  currentStreakDays: number;
}

export function StreakFreezeModal({
  isOpen,
  onClose,
  freezesAvailable,
  currentStreakDays,
}: StreakFreezeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-surface border border-cyan-500/30 p-6 shadow-2xl flex flex-col gap-5"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-2xl">
                🛡️
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">Bảo Vệ Chuỗi Ngày Học</h3>
                <p className="text-xs text-ink-muted">Streak Freeze Shield Engine</p>
              </div>
            </div>

            {/* Content Explanation */}
            <div className="flex flex-col gap-3 rounded-xl bg-surface-raised p-4 border border-border-subtle/50 text-xs">
              <p className="text-ink leading-relaxed">
                Khi bạn bận hoặc không thể luyện phát âm trong đúng <strong className="text-cyan-400">1 ngày</strong>,
                hệ thống sẽ tự động tiêu thụ 1 vật phẩm <strong>Streak Freeze</strong> để đóng băng chuỗi và bảo toàn số ngày học liên tiếp của bạn.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-border-subtle/40">
                <span className="text-ink-muted">Chuỗi ngày hiện tại:</span>
                <span className="font-bold text-amber-400">🔥 {currentStreakDays} Ngày</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Khiên bảo vệ còn lại:</span>
                <span className="font-bold text-cyan-400">🛡️ {freezesAvailable} Khiên</span>
              </div>
            </div>

            {/* Note & Rules */}
            <div className="text-[11px] text-ink-muted flex items-start gap-2">
              <span>💡</span>
              <span>
                Quy tắc chống gian lận: Bài luyện tập chỉ được tính vào chuỗi khi đạt tối thiểu <strong>60% điểm (Amber)</strong> và thời lượng audio tối thiểu <strong>1.0 giây</strong>.
              </span>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-cyan-500/20 py-2.5 text-xs font-bold text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
            >
              Đã Hiểu & Đóng
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
