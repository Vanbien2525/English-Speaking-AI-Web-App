"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { ReviewLevel } from "@/core/dto/vocabulary.dto";
import type { PronunciationAssessment } from "@/core/dto/shared.dto";
import { useVocabularyStore } from "../stores/useVocabularyStore";
import { useVocabularyAudioRecorder } from "../hooks/useVocabularyAudioRecorder";
import { VocabWaveform } from "./VocabWaveform";
import { isSameDay, shuffleArray } from "../utils/date-helpers";



export function FlashcardReviewDeck() {
  const {
    dueItems,
    allItems,
    selectedDeckId,
    decks,
    currentCardIndex,
    isFlipped,
    lastReviewResult,
    isSubmittingReview,
    flipCard,
    nextCard,
    prevCard,
    submitSpeakingReview,
    isRandomShuffle,
    toggleShuffle,
    setQuickAddOpen,
    setBatchImportOpen,
  } = useVocabularyStore();

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [assessedCardId, setAssessedCardId] = useState<string | null>(null);
  const [rawScoreBp, setRawScoreBp] = useState<number | null>(null);
  const [lastAudioDurationMs, setLastAudioDurationMs] = useState<number>(1200);
  const [latestAssessment, setLatestAssessment] = useState<PronunciationAssessment | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ReviewLevel | null>(null);
  const [prevCardIndex, setPrevCardIndex] = useState(currentCardIndex);
  const [prevDeckId, setPrevDeckId] = useState(selectedDeckId);

  // Active items based on selected deck
  const activeDeckItems = useMemo(() => {
    let list: typeof allItems;
    if (selectedDeckId === "system:due") {
      list = dueItems;
    } else if (selectedDeckId === "system:today") {
      list = allItems.filter((i) => isSameDay(i.createdAt));
    } else if (selectedDeckId) {
      list = allItems.filter((i) => i.deckId === selectedDeckId);
    } else {
      list = allItems.length > 0 ? allItems : dueItems;
    }

    if (isRandomShuffle) {
      return shuffleArray(list);
    }
    return list;
  }, [allItems, dueItems, selectedDeckId, isRandomShuffle]);

  if (selectedDeckId !== prevDeckId) {
    setPrevDeckId(selectedDeckId);
    useVocabularyStore.setState({ currentCardIndex: 0, lastReviewResult: null, isFlipped: false });
  }

  // React recommended pattern: Adjust state when currentCardIndex changes during render
  if (currentCardIndex !== prevCardIndex) {
    setPrevCardIndex(currentCardIndex);
    setSelectedLevel(null);
    setLatestAssessment(null);
    setAssessedCardId(null);
  }

  const {
    isRecording,
    isEvaluating,
    analyser,
    recordedAudioUrl,
    isPlayingRecordedAudio,
    playRecordedAudio,
    startRecording,
    stopAndAssess,
  } = useVocabularyAudioRecorder();



  const currentItem = activeDeckItems[currentCardIndex];
  const lastAssessedScoreBp = assessedCardId === currentItem?.id ? rawScoreBp : null;

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
        setAssessedCardId(currentItem.id);
        setRawScoreBp(assessResult.pronunciationScoreBp);
        setLastAudioDurationMs(assessResult.durationMs);
        if (assessResult.assessment) {
          setLatestAssessment(assessResult.assessment);
        }

        // Submit default review
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
              `⚠️ Chưa đạt: ${Math.round(reviewResult.pronunciationScoreBp / 100)}/100 (< 80). Chọn 🔴 Again để luyện lại ngay.`,
            );
          }
        }
      }
    } else {
      await startRecording();
    }
  };

  // Submit explicit 3-level Anki rating
  const handleSelectLevel = async (level: ReviewLevel) => {
    if (!currentItem) return;
    const scoreBp = lastAssessedScoreBp ?? (level === "again" ? 4500 : level === "good" ? 8500 : 9500);

    const reviewResult = await submitSpeakingReview({
      vocabularyItemId: currentItem.id,
      pronunciationScoreBp: scoreBp,
      audioDurationMs: lastAudioDurationMs,
      reviewLevel: level,
    });

    if (reviewResult) {
      setSelectedLevel(level);
      if (level === "again") {
        toast.error("🔴 Again: Thẻ giữ ở Cấp 1, sẽ ôn lại ngay trong phiên này!");
      } else if (level === "good") {
        toast.success(`🟡 Good: Cấp 2 (+15 XP). Nhắc lại sau ${reviewResult.intervalDaysAfter} ngày!`);
      } else {
        toast.success(`🟢 Easy: Cấp 3 (+25 XP). Giãn cách hẳn ${reviewResult.intervalDaysAfter} ngày!`);
      }
      // Giữ nguyên thẻ hiện tại theo yêu cầu người dùng, không tự động chuyển thẻ
    }
  };

  if (!currentItem || activeDeckItems.length === 0) {
    if (selectedDeckId === "system:due") {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-amber-500/20 bg-surface shadow-xs">
          <span className="text-5xl mb-4">🎉</span>
          <h3 className="text-xl font-bold text-ink mb-2">
            Hôm nay không còn thẻ nào cần ôn!
          </h3>
          <p className="text-xs text-ink-muted max-w-md mb-6 leading-relaxed">
            Thuật toán SM-2 ghi nhận bạn đã hoàn thành tất cả các thẻ đến hạn. Bạn có thể chọn &quot;Mục tiêu hôm nay&quot; hoặc &quot;Tất cả các bộ&quot; ở danh sách chọn bộ từ để tiếp tục luyện tập.
          </p>
        </div>
      );
    }

    if (selectedDeckId === "system:today") {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-emerald-500/20 bg-surface shadow-xs">
          <span className="text-5xl mb-4">🎯</span>
          <h3 className="text-xl font-bold text-ink mb-2">
            Hôm nay bạn chưa thêm từ mới nào!
          </h3>
          <p className="text-xs text-ink-muted max-w-md mb-6 leading-relaxed">
            Hãy thêm từ vựng mới qua tính năng thêm nhanh hoặc nhập hàng loạt để tự động kích hoạt bộ từ &quot;Mục tiêu hôm nay&quot;.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-canvas shadow-xs hover:bg-primary-hover transition cursor-pointer"
            >
              + Thêm 1 từ nhanh
            </button>
            <button
              type="button"
              onClick={() => setBatchImportOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-raised border border-border-subtle text-ink shadow-xs hover:border-primary/40 transition cursor-pointer"
            >
              📥 Nhập hàng loạt
            </button>
          </div>
        </div>
      );
    }

    const currentDeck = decks.find((d) => d.id === selectedDeckId);
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border-subtle bg-surface">
        <span className="text-5xl mb-4">📚</span>
        <h3 className="text-xl font-bold text-ink mb-2">
          {currentDeck ? `Bộ từ "${currentDeck.name}" chưa có từ vựng nào!` : "Kho từ vựng hiện đang trống!"}
        </h3>
        <p className="text-xs text-ink-muted max-w-md mb-6">
          Vui lòng chọn bộ từ khác ở mục &quot;Bộ từ&quot; phía trên hoặc thêm từ mới để bắt đầu luyện tập.
        </p>
      </div>
    );
  }

  const isPassed = lastReviewResult?.isPassed;
  const scorePercent = lastReviewResult ? Math.round(lastReviewResult.pronunciationScoreBp / 100) : null;

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto gap-5">
      {/* Session Progress Header */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 px-2 text-sm text-ink-muted">
        <div className="flex items-center gap-2">
          {selectedDeckId === "system:due" && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
              <span>🔥</span> Cần Ôn Hôm Nay
            </span>
          )}
          {selectedDeckId === "system:today" && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
              <span>⚡</span> Mục Tiêu Hôm Nay
            </span>
          )}
          <span className="font-semibold text-ink">
            Thẻ {currentCardIndex + 1} / {activeDeckItems.length}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-raised border border-border-subtle">
            Chu kỳ SM-2: {currentItem.sm2IntervalDays} ngày
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleShuffle();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              isRandomShuffle
                ? "bg-primary/10 border-primary text-primary"
                : "bg-surface-raised border-border-subtle text-ink-muted hover:text-ink"
            }`}
            title="Xáo trộn ngẫu nhiên thứ tự các thẻ (chống học vẹt)"
          >
            <span>🔀</span>
            <span>{isRandomShuffle ? "Đang xáo trộn" : "Xáo trộn"}</span>
          </button>
          <span className="text-xs text-ink-muted hidden sm:inline">Nhấn [Space] để lật thẻ</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-surface-raised rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentCardIndex + 1) / (activeDeckItems.length || 1)) * 100}%` }}
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
                /{currentItem.ipa.replace(/^\/+|\/+$/g, "")}/
              </span>
            </div>


          </div>

          {/* BACK OF CARD */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col justify-between p-7 bg-surface-raised rounded-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-surface border border-border-subtle text-ink-muted">
                  {currentItem.partOfSpeech || "Định nghĩa"}
                </span>
                <span className="ipa text-sm text-primary font-medium">/{currentItem.ipa.replace(/^\/+|\/+$/g, "")}/</span>
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


          </div>
        </div>
      </div>

      {/* Speaking-Verified Mastery Microphone Action Bar */}
      <div className="w-full flex flex-col items-center gap-3 p-5 rounded-2xl border border-border-subtle bg-surface">
        {/* Real-time Waveform display */}
        <VocabWaveform analyser={analyser} isRecording={isRecording} />

        {/* Review Result Banner */}
        {lastReviewResult && (
          <div
            className={`w-full p-3 rounded-xl border text-center text-xs font-bold transition-all ${
              isPassed
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500"
                : "bg-red-500/10 border-red-500/40 text-red-500"
            }`}
          >
            <div className="font-bold text-sm">
              {isPassed ? "✅ ĐÃ THUỘC & ĐẠT CHUẨN PHÁT ÂM (≥ 80 ĐIỂM)" : "❌ CHƯA ĐẠT CHUẨN (< 80 ĐIỂM)"}
            </div>
          </div>
        )}

        {/* AI Tutor Diagnostic & Articulatory Tips Breakdown */}
        {latestAssessment && assessedCardId === currentItem.id && (
          <div className="w-full flex flex-col gap-3 p-4 rounded-xl border border-primary/30 bg-surface-raised shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Chẩn Đoán Âm Vị & Gợi Ý Sửa Lỗi (Llama 3.1 8B)
                </span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface border border-border-subtle text-ink">
                Độ chính xác: {Math.round(latestAssessment.accuracyBp / 100)}%
              </span>
            </div>

            {/* Phoneme Breakdown Chips */}
            {latestAssessment.words?.[0]?.phonemes && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-ink-muted">Chi tiết từng âm vị:</span>
                <div className="flex flex-wrap gap-2">
                  {latestAssessment.words[0].phonemes.map((p, idx) => {
                    const isCorrect = p.errorType === "correct" && p.severity === "good";
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col items-center px-3 py-1.5 rounded-lg border text-xs font-medium ${
                          isCorrect
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-coral-500/15 border-coral-500/50 text-coral-300"
                        }`}
                      >
                        <div className="flex items-center gap-1 font-bold ipa text-sm">
                          <span>/{p.expectedIpa}/</span>
                          {!isCorrect && (
                            <>
                              <span>→</span>
                              <span className="underline decoration-coral-400">/{p.actualIpa || "Ø"}/</span>
                            </>
                          )}
                        </div>
                        <span className="text-[10px] opacity-80 mt-0.5">
                          {isCorrect ? "✓ Chuẩn" : p.errorType === "deletion" ? "Nuốt âm" : "Lệch âm"} ({Math.round(p.gopScoreBp / 100)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Tutor Summary */}
            <div className="p-3 rounded-lg bg-surface border border-border-subtle text-xs text-ink leading-relaxed">
              <strong className="text-primary block mb-0.5">Nhận xét của gia sư:</strong>
              {latestAssessment.feedback.summaryVi}
            </div>

            {/* Specific Articulatory Tips */}
            {latestAssessment.feedback.tipsVi && latestAssessment.feedback.tipsVi.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-ink-muted uppercase">
                  Mẹo đặt khẩu hình & vị trí lưỡi:
                </span>
                <div className="flex flex-col gap-1.5">
                  {latestAssessment.feedback.tipsVi.map((tip, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-ink leading-relaxed"
                    >
                      <span className="text-primary mt-0.5">💡</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3-Level Anki Rating Buttons with Active Border State */}
        <div className="w-full mt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
            {/* 🔴 Again */}
            <button
              type="button"
              onClick={() => handleSelectLevel("again")}
              disabled={isSubmittingReview || isRecording}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                selectedLevel === "again" || (lastReviewResult && !isPassed && selectedLevel === null)
                  ? "bg-coral-500/20 border-coral-500 ring-3 ring-coral-500/70 shadow-md"
                  : "bg-surface-raised border-border-subtle hover:border-coral-500/60 hover:bg-coral-500/10"
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-coral-400 text-sm">
                <span>🔴</span> Again (Sai / Quên)
              </div>
              <span className="text-[11px] text-ink font-medium mt-0.5">Về Cấp độ 1</span>
              <span className="text-[10px] text-ink-muted mt-0.5">Nhắc lại ngay trong vài phút</span>
            </button>

            {/* 🟡 Good */}
            <button
              type="button"
              onClick={() => handleSelectLevel("good")}
              disabled={isSubmittingReview || isRecording}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                selectedLevel === "good" || (lastReviewResult && isPassed && (scorePercent ?? 0) < 90 && selectedLevel === null)
                  ? "bg-amber-500/20 border-amber-500 ring-3 ring-amber-500/70 shadow-md"
                  : "bg-surface-raised border-border-subtle hover:border-amber-500/60 hover:bg-amber-500/10"
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-amber-400 text-sm">
                <span>🟡</span> Good (Tạm ổn)
              </div>
              <span className="text-[11px] text-ink font-medium mt-0.5">Giữ Cấp độ 2 (+15 XP)</span>
              <span className="text-[10px] text-ink-muted mt-0.5">Nhắc lại sau 1 - 3 ngày</span>
            </button>

            {/* 🟢 Easy */}
            <button
              type="button"
              onClick={() => handleSelectLevel("easy")}
              disabled={isSubmittingReview || isRecording}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                selectedLevel === "easy" || (lastReviewResult && isPassed && (scorePercent ?? 0) >= 90 && selectedLevel === null)
                  ? "bg-emerald-500/20 border-emerald-500 ring-3 ring-emerald-500/70 shadow-md"
                  : "bg-surface-raised border-border-subtle hover:border-emerald-500/60 hover:bg-emerald-500/10"
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-emerald-400 text-sm">
                <span>🟢</span> Easy (Quá dễ)
              </div>
              <span className="text-[11px] text-ink font-medium mt-0.5">Lên Cấp độ 3 (+25 XP)</span>
              <span className="text-[10px] text-ink-muted mt-0.5">Giãn cách 7 - 14 ngày</span>
            </button>
          </div>
        </div>

        {/* User Voice Playback Button if recorded */}
        {recordedAudioUrl && (
          <div className="w-full flex justify-center pt-2">
            <button
              type="button"
              onClick={playRecordedAudio}
              disabled={isPlayingRecordedAudio}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer"
              title="Nghe lại bản thu âm của chính bạn"
            >
              <span>🎧</span>
              <span>{isPlayingRecordedAudio ? "Đang phát giọng bạn..." : "Nghe lại bản ghi của mình"}</span>
            </button>
          </div>
        )}

        {/* Microphone Button Controls */}
        <div className="flex items-center gap-4 mt-1">
          <button
            onClick={() => {
              if (currentCardIndex > 0) {
                useVocabularyStore.setState({
                  currentCardIndex: currentCardIndex - 1,
                  isFlipped: false,
                  lastReviewResult: null,
                });
              }
            }}
            disabled={currentCardIndex === 0 || isRecording || isEvaluating}
            className="p-3 rounded-xl bg-surface-raised border border-border-subtle hover:border-primary/40 disabled:opacity-40 text-ink transition cursor-pointer"
            title="Thẻ trước [Phím mũi tên trái]"
          >
            ←
          </button>

          <button
            onClick={handleToggleRecord}
            disabled={isEvaluating || isSubmittingReview}
            className={`relative flex items-center justify-center gap-2.5 px-8 py-3 rounded-2xl font-extrabold text-sm transition-all shadow-lg cursor-pointer ${
              isRecording
                ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                : "bg-primary text-canvas hover:brightness-110 active:scale-95"
            }`}
          >
            {isRecording ? (
              <>
                <span className="w-3.5 h-3.5 rounded-xs bg-white" />
                <span className="text-white font-extrabold text-sm tracking-wider">STOP</span>
              </>
            ) : isEvaluating || isSubmittingReview ? (
              <span>Đang đánh giá phát âm...</span>
            ) : (
              <>
                <span className="text-lg">🎙️</span>
                <span>Bấm Mic để nói</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              if (currentCardIndex + 1 < activeDeckItems.length) {
                useVocabularyStore.setState({
                  currentCardIndex: currentCardIndex + 1,
                  isFlipped: false,
                  lastReviewResult: null,
                });
              } else {
                toast.success("Bạn đã xem hết các thẻ trong bộ từ này!");
              }
            }}
            disabled={currentCardIndex + 1 >= activeDeckItems.length || isRecording || isEvaluating}
            className="p-3 rounded-xl bg-surface-raised border border-border-subtle hover:border-primary/40 disabled:opacity-40 text-ink transition cursor-pointer"
            title="Thẻ tiếp theo [Phím mũi tên phải]"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
