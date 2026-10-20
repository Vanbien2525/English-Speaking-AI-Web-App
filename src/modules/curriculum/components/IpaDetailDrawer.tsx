"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import type { PhonemeDetailDrawerDto } from "@/core/dto/curriculum.dto";

interface IpaDetailDrawerProps {
  phoneme: PhonemeDetailDrawerDto | null;
  isOpen: boolean;
  onClose: () => void;
  onViewRelatedLessons: (phonemeId: string) => void;
}

export function IpaDetailDrawer({
  phoneme,
  isOpen,
  onClose,
  onViewRelatedLessons,
}: IpaDetailDrawerProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!phoneme) return null;

  const handlePlayVoice = () => {
    setIsPlayingAudio(true);
    toast.info(`Đang phát âm mẫu /${phoneme.ipaSymbol}/ (${phoneme.exampleWord}) giọng British RP...`);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${phoneme.exampleWord}`);
      utterance.lang = "en-GB";
      utterance.rate = 0.85;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingAudio(false), 1500);
    }
  };

  const statusBadge = {
    emerald: {
      text: "Đạt chuẩn bản xứ (>= 80%)",
      class: "bg-emerald-950/50 text-emerald-400 border-emerald-500/40",
    },
    amber: {
      text: "Cần trau chuốt (60% - 79%)",
      class: "bg-amber-950/50 text-amber-400 border-amber-500/40",
    },
    coral: {
      text: "Cần cải thiện (< 60%)",
      class: "bg-rose-950/50 text-rose-400 border-rose-500/40",
    },
    neutral: {
      text: "Chưa luyện tập (0%)",
      class: "bg-surface-raised text-ink-muted border-border-subtle",
    },
  }[phoneme.statusColor];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Slide-over Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-md bg-surface p-6 shadow-2xl border-l border-border-subtle overflow-y-auto"
          >
            {/* 1. Header with Close Button */}
            <div className="flex items-center justify-between border-b border-border-subtle/60 pb-4">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Chẩn Đoán Ngữ Âm Học (IPA Insight)
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors"
                aria-label="Đóng bảng chi tiết"
              >
                ✕
              </button>
            </div>

            {/* 2. Hero Phoneme Presentation */}
            <div className="flex flex-col items-center justify-center my-6 text-center">
              <div className="ipa text-6xl font-black text-ink tracking-tight mb-2">
                /{phoneme.ipaSymbol}/
              </div>
              <div className="text-sm text-ink font-semibold">
                Từ ví dụ: <span className="text-primary italic">&ldquo;{phoneme.exampleWord}&rdquo;</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 justify-center">
                <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-xs text-ink-muted border border-border-subtle">
                  {phoneme.isVoiced ? "Hữu thanh (Voiced)" : "Vô thanh (Voiceless)"}
                </span>
                <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-xs text-ink-muted border border-border-subtle">
                  {phoneme.placeOfArticulation || "Vocal tract"}
                </span>
                <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-xs text-ink-muted border border-border-subtle">
                  {phoneme.mannerOfArticulation || phoneme.category}
                </span>
              </div>
            </div>

            {/* 3. Personal Mastery Card */}
            <div className={`p-4 rounded-xl border mb-6 ${statusBadge.class}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Tiến độ cá nhân</span>
                <span className="text-xs font-semibold">{statusBadge.text}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold font-mono">
                  {phoneme.attemptsCount > 0 && phoneme.averageScoreBp !== null
                    ? `${(phoneme.averageScoreBp / 100).toFixed(0)}%`
                    : "0%"}
                </span>
                <span className="text-xs opacity-80">
                  {phoneme.attemptsCount} lần luyện • {phoneme.correctCount} lần đạt
                </span>
              </div>
            </div>

            {/* 4. British RP Audio Player */}
            <div className="mb-6 p-4 rounded-xl bg-surface-raised border border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink">Giọng Đọc Chuẩn Hoàng Gia (British RP)</span>
                <span className="text-[10px] text-primary font-mono">en-GB-SoniaNeural</span>
              </div>
              <button
                type="button"
                onClick={handlePlayVoice}
                disabled={isPlayingAudio}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary/10 border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors"
              >
                <span>{isPlayingAudio ? "⏸ Đang phát..." : "▶ Nghe Giọng Bản Xứ"}</span>
                <span className="text-xs opacity-75">(&ldquo;{phoneme.exampleWord}&rdquo;)</span>
              </button>
            </div>

            {/* 5. Articulation Guide for Vietnamese Learners */}
            <div className="mb-6 space-y-2">
              <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                <span>👄</span>
                <span>Hướng dẫn khẩu hình cho người Việt</span>
              </h3>
              <p className="text-sm text-ink leading-relaxed p-3.5 rounded-xl bg-surface-raised border border-border-subtle/80">
                {phoneme.articulationGuideVi}
              </p>
            </div>

            {/* 6. Common Vietnamese Substitutions */}
            {phoneme.commonVnSubstitutions.length > 0 && (
              <div className="mb-6 space-y-2">
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Lỗi đặc trưng người Việt hay mắc</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {phoneme.commonVnSubstitutions.map((sub, idx) => (
                    <span
                      key={`sub-${idx}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300"
                    >
                      <span>❌ Đọc nhầm thành</span>
                      <strong className="ipa text-sm font-bold">/{sub}/</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Strategic CTAs */}
            <div className="mt-auto pt-6 flex flex-col gap-3 border-t border-border-subtle/60">
              <Link
                href={`/practice?phonemeId=${phoneme.id}&symbol=${encodeURIComponent(phoneme.ipaSymbol)}`}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-primary text-canvas font-bold text-sm shadow-lg hover:brightness-110 transition-all"
              >
                <span>🚀 Luyện Âm Này Trong Phòng 3D</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewRelatedLessons(phoneme.id);
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-surface-raised border border-border-subtle text-ink font-semibold text-sm hover:border-primary/50 transition-colors"
              >
                <span>📚 Xem các bài học chứa âm này ({phoneme.relatedLessons.length})</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
