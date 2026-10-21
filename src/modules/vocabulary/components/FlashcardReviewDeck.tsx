"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useVocabularyStore } from "../stores/useVocabularyStore";
import { useVocabularyAudioRecorder } from "../hooks/useVocabularyAudioRecorder";
import { VocabWaveform } from "./VocabWaveform";

// Lazy-load 3D WebGL Canvas to preserve high client performance
const VocabOralCanvas = dynamic(
  () => import("../three/VocabOralCanvas").then((m) => m.VocabOralCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-44 rounded-xl bg-surface-raised animate-pulse flex items-center justify-center text-xs text-ink-muted">
        Đang khởi tạo mô hình 3D...
      </div>
    ),
  },
);

export function FlashcardReviewDeck() {
  const {
    dueItems,
    currentCardIndex,
    isFlipped,
    lastReviewResult,
    isSubmittingReview,
    flipCard,
    nextCard,
    prevCard,
    resetReviewSession,
    submitSpeakingReview,
  } = useVocabularyStore();

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [show3dModel, setShow3dModel] = useState(true);

  const {
    isRecording,
    isEvaluating,
    analyser,
    startRecording,
    stopAndAssess,
  } = useVocabularyAudioRecorder();

  const currentItem = dueItems[currentCardIndex];

  const playWebSpeech = useCallback((word: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-GB";
    utterance.rate = 0.9;
    setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  // Keyboard shortcut listener: Space to flip, Arrow keys to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        flipCard();
      } else if (e.code === "ArrowRight") {
        nextCard();
      } else if (e.code === "ArrowLeft") {
        prevCard();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipCard, nextCard, prevCard]);

  // Audio speech playback (Free Dictionary Audio or Web Speech API fallback)
  const handlePlayAudio = useCallback(() => {
    if (!currentItem) return;

    if (currentItem.referenceAudioUrl) {
      const audio = new Audio(currentItem.referenceAudioUrl);
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        // Fallback to Web Speech
        playWebSpeech(currentItem.word);
      };
      audio.play().catch(() => {
        setIsPlayingAudio(false);
        playWebSpeech(currentItem.word);
      });
    } else {
      playWebSpeech(currentItem.word);
    }
  }, [currentItem, playWebSpeech]);

  // Microphone speaking verification action
  const handleToggleRecord = async () => {
    if (!currentItem) return;

    if (isRecording) {
      const assessResult = await stopAndAssess(currentItem.word);
      if (assessResult) {
        const reviewResult = await submitSpeakingReview({
          vocabularyItemId: currentItem.id,
          pronunciationScoreBp: assessResult.pronunciationScoreBp,
          audioDurationMs: assessResult.durationMs,
        });

        if (reviewResult) {
          if (reviewResult.isPassed) {
            toast.success(
              `🎉 Đạt chuẩn! ${Math.round(reviewResult.pronunciationScoreBp / 100)}/100 (+${reviewResult.xpAwarded} XP)`,
            );
          } else {
            toast.warning(
              `⚠️ Chưa đạt: ${Math.round(reviewResult.pronunciationScoreBp / 100)}/100 (< 80). Cần luyện lại vào ngày mai.`,
            );
          }
        }
      }
    } else {
      await startRecording();
    }
  };

  if (!currentItem) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border-subtle bg-surface">
        <span className="text-5xl mb-4">🎉</span>
        <h3 className="text-2xl font-bold text-ink mb-2">
          Tuyệt vời! Bạn đã hoàn thành tất cả thẻ cần ôn hôm nay
        </h3>
        <p className="text-ink-muted max-w-md mb-6">
          Thuật toán SM-2 đã tự động xếp lịch giãn cách theo chất lượng phát âm của bạn. Hãy quay lại vào ngày mai hoặc thêm từ mới!
        </p>
        <button
          onClick={resetReviewSession}
          className="px-6 py-2.5 rounded-xl bg-primary text-canvas font-semibold hover:brightness-110 transition shadow"
        >
          Xem lại từ đầu
        </button>
      </div>
    );
  }

  const isPassed = lastReviewResult?.isPassed;
  const scorePercent = lastReviewResult ? Math.round(lastReviewResult.pronunciationScoreBp / 100) : null;

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto gap-5">
      {/* Session Progress Header */}
      <div className="w-full flex items-center justify-between px-2 text-sm text-ink-muted">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">
            Thẻ {currentCardIndex + 1} / {dueItems.length}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-raised border border-border-subtle">
            Chu kỳ hiện tại: {currentItem.sm2IntervalDays} ngày
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShow3dModel(!show3dModel)}
            className="text-xs font-medium px-2.5 py-1 rounded-lg bg-surface-raised border border-border-subtle hover:border-primary/50 text-ink transition"
          >
            {show3dModel ? "Ẩn mô hình 3D" : "Hiện mô hình 3D"}
          </button>
          <span className="text-xs text-ink-muted">Nhấn [Space] để lật</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-surface-raised rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentCardIndex + 1) / dueItems.length) * 100}%` }}
        />
      </div>

      {/* 3D Flip Card Container */}
      <div className="relative w-full min-h-[460px] perspective-1000 select-none">
        <div
          onClick={flipCard}
          className={`relative w-full h-full min-h-[460px] cursor-pointer rounded-2xl border transition-transform duration-500 transform-style-preserve-3d shadow-xl ${
            isFlipped ? "rotate-y-180" : ""
          } ${
            lastReviewResult
              ? isPassed
                ? "border-emerald-500/60 shadow-emerald-500/10"
                : "border-coral-500/60 shadow-coral-500/10"
              : "border-border-subtle bg-surface hover:border-primary/40"
          }`}
        >
          {/* FRONT OF CARD */}
          <div className="absolute inset-0 backface-hidden flex flex-col justify-between p-7 bg-surface rounded-2xl">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-surface-raised border border-border-subtle text-ink-muted">
                {currentItem.partOfSpeech || "Từ vựng"}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayAudio();
                }}
                disabled={isPlayingAudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-raised border border-border-subtle hover:border-primary/60 text-xs font-semibold text-ink transition active:scale-95"
                title="Nghe giọng chuẩn British RP"
              >
                <span>🔊</span>
                <span>{isPlayingAudio ? "Đang phát..." : "Giọng British RP"}</span>
              </button>
            </div>

            {/* Central Word & IPA */}
            <div className="flex flex-col items-center text-center my-auto gap-3">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-ink tracking-tight">
                {currentItem.word}
              </h2>
              <span className="ipa text-2xl text-primary font-medium tracking-wide">
                /{currentItem.ipa}/
              </span>
            </div>

            {/* 3D Anatomical Vocal Tract Canvas */}
            {show3dModel && (
              <div
                className="my-3 w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <VocabOralCanvas word={currentItem.word} />
              </div>
            )}

            {/* Articulatory Tip Teaser */}
            <div className="text-center">
              <p className="text-xs text-ink-muted italic">
                {currentItem.articulatoryTipVi || "Nhấp vào thẻ hoặc bấm phím Cách để xem định nghĩa & ví dụ"}
              </p>
            </div>
          </div>

          {/* BACK OF CARD */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col justify-between p-7 bg-surface-raised rounded-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-surface border border-border-subtle text-ink-muted">
                  {currentItem.partOfSpeech || "Định nghĩa"}
                </span>
                <span className="ipa text-sm text-primary font-medium">/{currentItem.ipa}/</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayAudio();
                }}
                disabled={isPlayingAudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border-subtle hover:border-primary/60 text-xs font-semibold text-ink transition active:scale-95"
              >
                <span>🔊</span>
                <span>Nghe lại</span>
              </button>
            </div>

            {/* Meanings & Examples */}
            <div className="flex flex-col gap-4 my-auto">
              <div>
                <span className="text-xs font-semibold text-ink-muted uppercase">Nghĩa tiếng Việt:</span>
                <p className="text-xl font-bold text-ink mt-0.5">{currentItem.definitionVi}</p>
              </div>

              {currentItem.exampleSentenceEn && (
                <div className="p-3.5 rounded-xl bg-surface/80 border border-border-subtle">
                  <span className="text-xs font-semibold text-primary uppercase">Câu ví dụ:</span>
                  <p className="text-sm font-medium text-ink mt-1 italic leading-relaxed">
                    &ldquo;{currentItem.exampleSentenceEn}&rdquo;
                  </p>
                  {currentItem.exampleSentenceVi && (
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      {currentItem.exampleSentenceVi}
                    </p>
                  )}
                </div>
              )}

              {currentItem.articulatoryTipVi && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-xs font-semibold text-primary uppercase flex items-center gap-1">
                    <span>💡</span> Mẹo đặt khẩu hình & vị trí lưỡi:
                  </span>
                  <p className="text-xs text-ink mt-1 leading-relaxed">
                    {currentItem.articulatoryTipVi}
                  </p>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-ink-muted">
              Bắt buộc phát âm đúng $\ge 80$ điểm bên dưới để thẻ được tính là thuộc
            </div>
          </div>
        </div>
      </div>

      {/* Speaking-Verified Mastery Microphone Action Bar */}
      <div className="w-full flex flex-col items-center gap-3 p-5 rounded-2xl border border-border-subtle bg-surface">
        <div className="text-center">
          <h4 className="text-sm font-bold text-ink flex items-center justify-center gap-1.5">
            <span>🎙️</span> Cơ Chế &ldquo;Phát Âm Đúng Mới Tính Là Thuộc&rdquo;
          </h4>
          <p className="text-xs text-ink-muted mt-0.5">
            Bấm mic đọc to từ <strong className="text-primary">&ldquo;{currentItem.word}&rdquo;</strong>. Hệ thống yêu cầu điểm phát âm $\ge 80/100$ để thăng hạng SM-2.
          </p>
        </div>

        {/* Real-time Waveform display */}
        <VocabWaveform analyser={analyser} isRecording={isRecording} />

        {/* Review Result Banner */}
        {lastReviewResult && (
          <div
            className={`w-full p-3.5 rounded-xl border text-center text-xs transition-all ${
              isPassed
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : "bg-coral-500/10 border-coral-500/40 text-coral-400"
            }`}
          >
            <div className="font-bold text-sm mb-1">
              {isPassed ? "✅ ĐÃ THUỘC & ĐẠT CHUẨN PHÁT ÂM" : "❌ CHƯA ĐẠT CHUẨN (< 80 ĐIỂM)"}
            </div>
            <p className="leading-relaxed">{lastReviewResult.feedbackVi}</p>
            <div className="mt-1 text-[11px] opacity-80">
              Điểm số: {scorePercent}/100 · Chu kỳ SM-2 mới: {lastReviewResult.intervalDaysAfter} ngày
            </div>
          </div>
        )}

        {/* Microphone Button Controls */}
        <div className="flex items-center gap-4 mt-1">
          <button
            onClick={prevCard}
            disabled={currentCardIndex === 0 || isRecording || isEvaluating}
            className="p-3 rounded-xl bg-surface-raised border border-border-subtle hover:border-primary/40 disabled:opacity-40 text-ink transition"
            title="Thẻ trước [Phím mũi tên trái]"
          >
            ←
          </button>

          <button
            onClick={handleToggleRecord}
            disabled={isEvaluating || isSubmittingReview}
            className={`relative flex items-center justify-center gap-2.5 px-7 py-3 rounded-2xl font-bold transition-all shadow-lg ${
              isRecording
                ? "bg-coral-500 text-white animate-pulse"
                : "bg-primary text-canvas hover:brightness-110 active:scale-95"
            }`}
          >
            {isRecording ? (
              <>
                <span className="w-3 h-3 rounded-sm bg-white" />
                <span>Dừng & Chấm Điểm</span>
              </>
            ) : isEvaluating || isSubmittingReview ? (
              <span>Đang đánh giá phát âm...</span>
            ) : (
              <>
                <span className="text-lg">🎙️</span>
                <span>Bấm Mic Để Nói ({currentItem.word})</span>
              </>
            )}
          </button>

          <button
            onClick={nextCard}
            disabled={isRecording || isEvaluating}
            className="p-3 rounded-xl bg-surface-raised border border-border-subtle hover:border-primary/40 disabled:opacity-40 text-ink transition"
            title="Thẻ tiếp theo [Phím mũi tên phải]"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
