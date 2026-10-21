"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { usePracticeStore } from "../stores/usePracticeStore";
import { AudioWaveformVisualizer } from "./AudioWaveformVisualizer";
import { convertBlobToWav } from "@/shared/lib/audio-wav";
import type { CreateAttemptMeta, PronunciationAssessment } from "@/core/dto/shared.dto";

export function AudioRecordDock() {
  const { isRecording, elapsedMs, analyser, startRecording, stopRecording } = useAudioRecorder();
  const setRecordingState = usePracticeStore((s) => s.setRecordingState);
  const setAssessment = usePracticeStore((s) => s.setAssessment);
  const audioBlob = usePracticeStore((s) => s.audioBlob);
  const audioDurationMs = usePracticeStore((s) => s.audioDurationMs);
  const lesson = usePracticeStore((s) => s.lesson);
  const resetPractice = usePracticeStore((s) => s.resetPractice);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format milliseconds to MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  // Submit audio blob to Next.js BFF endpoint /api/practice/assess
  const submitAudioForAssessment = async (blob: Blob, duration: number) => {
    setIsSubmitting(true);
    setRecordingState("analyzing");
    toast.loading("AI đang phân tích từng âm vị ngữ âm học...", { id: "scoring-toast" });

    try {
      // In-memory conversion to standard 16kHz PCM WAV
      const wavBlob = await convertBlobToWav(blob, 16000);

      const metadata: CreateAttemptMeta = {
        sessionId: "019488a0-7b24-789a-bcde-000000000002",
        lessonItemId: lesson.id,
        idempotencyKey: crypto.randomUUID(),
        audioDurationMs: Math.max(500, Math.min(15000, duration)),
        accent: "en-GB-RP",
        targetText: lesson.targetPhrase,
      };

      const formData = new FormData();
      formData.append("audio", wavBlob, "recording.wav");
      formData.append("metadata", JSON.stringify(metadata));

      const response = await fetch("/api/practice/assess", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || `Lỗi máy chủ HTTP ${response.status}`);
      }

      const assessmentResult: PronunciationAssessment = await response.json();
      setAssessment(assessmentResult);
      toast.success(`Chấm điểm hoàn tất! Điểm phát âm: ${Math.round(assessmentResult.overallScoreBp / 100)}/100`, {
        id: "scoring-toast",
      });
    } catch (err: unknown) {
      const error = err as Error;
      setRecordingState("error");
      setTimeout(() => {
        toast.error(`Chấm điểm thất bại: ${error.message}`, { id: "scoring-toast" });
      }, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Record Button click
  const handleToggleRecord = async () => {
    if (isRecording) {
      const recordedBlob = await stopRecording();
      if (recordedBlob) {
        await submitAudioForAssessment(recordedBlob, elapsedMs);
      }
    } else {
      await startRecording();
    }
  };

  // Keyboard shortcut: Spacebar to toggle record
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body && !isSubmitting) {
        e.preventDefault();
        handleToggleRecord();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="fixed bottom-6 inset-x-0 mx-auto max-w-4xl px-4 z-20">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-surface/90 px-6 py-4 shadow-2xl backdrop-blur-xl border border-border-subtle/80">
        {/* Left: Timer & Studio Mic Status */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-mono text-base font-bold text-ink tracking-wider">
              {formatTime(isRecording ? elapsedMs : audioDurationMs)}
              <span className="text-xs text-ink-muted"> / 00:15</span>
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
              <span
                className={`h-2 w-2 rounded-full ${
                  isRecording ? "bg-rose-500 animate-ping" : "bg-emerald-400"
                }`}
              />
              {isRecording ? "Đang thu âm PCM..." : "Microphone: Sẵn sàng"}
            </span>
          </div>
        </div>

        {/* Center: Glowing Pulse Record Button */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring animation when recording */}
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full bg-rose-500/50"
                />
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              disabled={isSubmitting}
              onClick={handleToggleRecord}
              className={`relative flex h-16 w-16 items-center justify-center rounded-full shadow-xl transition-all ${
                isRecording
                  ? "bg-rose-600 text-white shadow-rose-900/50 ring-4 ring-rose-500/30"
                  : isSubmitting
                  ? "bg-surface-raised text-ink-muted cursor-wait"
                  : "bg-gradient-to-tr from-primary to-sky-400 text-white shadow-primary/40 hover:shadow-primary/60"
              }`}
              title={isRecording ? "Dừng và nộp bài chấm điểm" : "Bắt đầu thu âm phát âm (Phím tắt Spacebar)"}
            >
              {isSubmitting ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : isRecording ? (
                <div className="h-6 w-6 rounded-md bg-white" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-8 w-8"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2a1 1 0 0 0-2 0v2a9 9 0 0 0 8 8.945V22a1 1 0 0 0 2 0v-1.055A9 9 0 0 0 21 12v-2a1 1 0 0 0-2 0Z" />
                </svg>
              )}
            </motion.button>
          </div>

          {/* Waveform EQ Visualizer */}
          <AudioWaveformVisualizer analyser={analyser} isRecording={isRecording} />
        </div>

        {/* Right: SLA Badge & Retry Button */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="rounded-full bg-canvas px-2.5 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
              ⚡ SLA AI: 145ms
            </span>
            <span className="text-[10px] text-ink-muted mt-0.5">Phím tắt: [Spacebar]</span>
          </div>

          {audioBlob && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={resetPractice}
              className="rounded-xl bg-surface-raised px-3 py-2 text-xs font-semibold text-ink-muted hover:text-ink hover:bg-border-subtle transition-colors border border-border-subtle"
            >
              Luyện lại
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
