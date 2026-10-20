"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { usePracticeStore } from "../stores/usePracticeStore";

export function StudioHeader() {
  const lesson = usePracticeStore((s) => s.lesson);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handlePlayReferenceAudio = () => {
    setIsPlayingAudio(true);
    toast.info("Đang phát âm mẫu giọng đọc bản ngữ chuẩn British RP (en-GB-SoniaNeural)...");

    // Sử dụng Web SpeechSynthesis API nếu chưa có file MP3 vật lý
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(lesson.targetPhrase);
      utterance.lang = "en-GB";
      utterance.rate = 0.85; // Tốc độ chuẩn sư phạm
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingAudio(false), 2000);
    }
  };

  return (
    <header className="flex flex-col gap-4 rounded-2xl bg-surface p-5 border border-border-subtle shadow-lg">
      {/* Top Meta Line: Unit indicator & Target Goal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/25">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {lesson.unitBreadcrumb}
          </span>
          <span className="text-xs text-ink-muted">Trình độ: B1 Intermediate</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/40">
            🎯 Mục tiêu: {lesson.targetScore}%
          </span>
        </div>
      </div>

      {/* Target Phrase & Phonetic Display */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 border-t border-border-subtle/50">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink flex items-center gap-2">
            <span>I</span>
            <span className="rounded-lg bg-primary/20 px-2 py-0.5 text-primary border border-primary/30 underline decoration-primary/40 underline-offset-4">
              think
            </span>
            <span>the three thieves fled</span>
          </h1>

          <p className="mt-1.5 flex items-center gap-2 text-sm text-ink-muted">
            <span className="font-semibold text-xs tracking-wider uppercase text-ink-muted/80">Ký hiệu IPA:</span>
            <span className="ipa text-base font-medium text-sky-400 tracking-wide">
              {lesson.targetIpa}
            </span>
          </p>
        </div>

        {/* Reference Audio Player Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePlayReferenceAudio}
          className="flex items-center justify-center gap-2.5 rounded-xl bg-surface-raised px-4 py-3 text-sm font-semibold text-ink hover:border-primary/60 hover:bg-surface-raised/80 transition-all border border-border-subtle shadow-md"
        >
          <span className={`text-lg transition-transform ${isPlayingAudio ? "scale-125" : ""}`}>
            {isPlayingAudio ? "🔊" : "🔈"}
          </span>
          <div className="flex flex-col text-left">
            <span>{isPlayingAudio ? "Đang nghe mẫu..." : "Nghe mẫu British RP"}</span>
            <span className="text-[10px] text-ink-muted font-normal">Giọng Sonia (en-GB) • 00:03</span>
          </div>
        </motion.button>
      </div>
    </header>
  );
}
