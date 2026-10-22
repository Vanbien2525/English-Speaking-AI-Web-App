"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { VietnameseToEnglishQuestion } from "@/core/dto/vocabulary.dto";
import { useVocabularyStore } from "../stores/useVocabularyStore";
import { Volume2, CheckCircle2, RotateCcw, HelpCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function VietnameseToEnglishStudio() {
  const { selectedDeckId, isDailyFocusMode, incrementDailyPracticed } = useVocabularyStore();
  const [questions, setQuestions] = useState<VietnameseToEnglishQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputAnswer, setInputAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    setCurrentIndex(0);
    setInputAnswer("");
    setIsAnswered(false);
    setIsCorrect(false);
    setShowHint(false);

    try {
      const effectiveDeckId = isDailyFocusMode ? "today" : selectedDeckId;
      const url = effectiveDeckId
        ? `/api/vocabulary/quiz/vi-to-en?deckId=${encodeURIComponent(effectiveDeckId)}&limit=15`
        : "/api/vocabulary/quiz/vi-to-en?limit=15";

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch {
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeckId, isDailyFocusMode]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const effectiveDeckId = isDailyFocusMode ? "today" : selectedDeckId;
      const url = effectiveDeckId
        ? `/api/vocabulary/quiz/vi-to-en?deckId=${encodeURIComponent(effectiveDeckId)}&limit=15`
        : "/api/vocabulary/quiz/vi-to-en?limit=15";

        const res = await fetch(url);
        if (!ignore && res.ok) {
          const data = await res.json();
          setQuestions(data.questions || []);
        }
      } catch {
        if (!ignore) setQuestions([]);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [selectedDeckId, isDailyFocusMode]);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [currentIndex, isLoading]);

  const currentQ = questions[currentIndex];

  const playPronunciation = useCallback((word: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-GB";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleCheckAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentQ || !inputAnswer.trim() || isAnswered) return;

    const trimmedInput = inputAnswer.trim().toLowerCase();
    const correctTarget = currentQ.targetWord.trim().toLowerCase();

    if (trimmedInput === correctTarget) {
      // Correct!
      setIsCorrect(true);
      setIsAnswered(true);
      playPronunciation(currentQ.targetWord);
      incrementDailyPracticed();
      toast.success("🎉 Chính xác tuyệt đối!");
    } else {
      // Wrong! Amber border + gentle shake animation
      setIsShaking(true);
      toast.error("Chưa chính xác! Thử lại hoặc bấm xem Gợi ý.");
      setTimeout(() => {
        setIsShaking(false);
      }, 500);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setInputAnswer("");
      setIsAnswered(false);
      setIsCorrect(false);
      setShowHint(false);
    } else {
      toast.success("🎉 Bạn đã hoàn thành tất cả câu hỏi dịch nghĩa!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border-subtle bg-surface">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-sm font-semibold text-ink-muted">Đang nạp câu hỏi...</span>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center rounded-2xl border border-border-subtle bg-surface">
        <span className="text-4xl mb-3">🇻🇳</span>
        <h4 className="text-lg font-bold text-ink mb-2">Chưa có câu hỏi dịch nghĩa trong bộ từ này</h4>
        <button
          onClick={loadQuestions}
          className="px-4 py-2 rounded-xl bg-primary text-canvas text-xs font-bold"
        >
          Tải lại
        </button>
      </div>
    );
  }

  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 p-6 rounded-2xl border border-border-subtle bg-surface shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-ink">
            Câu {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-raised border border-border-subtle text-ink-muted">
            Loại từ: <strong className="text-ink">{currentQ.partOfSpeech}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={loadQuestions}
          className="p-2 rounded-xl bg-surface-raised border border-border-subtle hover:border-primary/50 text-ink transition"
          title="Tải lại câu hỏi"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Prompt Card: Vietnamese Definition */}
      <div className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-surface-raised border border-border-subtle text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
          Định Nghĩa Tiếng Việt:
        </span>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-ink leading-snug">
          &ldquo;{currentQ.definitionVi}&rdquo;
        </h3>
        <span className="text-xs text-ink-muted">
          Hãy nhớ và gõ từ vựng tiếng Anh tương ứng bên dưới
        </span>
      </div>

      {/* Input Form with interactive color states */}
      <form onSubmit={handleCheckAnswer} className="flex flex-col gap-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputAnswer}
            onChange={(e) => setInputAnswer(e.target.value)}
            disabled={isAnswered}
            placeholder="Gõ từ tiếng Anh tại đây..."
            className={`w-full px-5 py-4 text-center text-xl font-bold rounded-2xl border transition-all outline-hidden shadow-xs ${
              isAnswered && isCorrect
                ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-300"
                : isShaking
                  ? "animate-shake bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-300"
                  : "bg-surface border-border-subtle hover:border-primary/60 focus:border-primary text-ink"
            }`}
          />
        </div>

        {/* Hint Display */}
        {showHint && !isAnswered && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-center animate-fade-in">
            Gợi ý: Từ bắt đầu bằng chữ cái <strong>&ldquo;{currentQ.hintFirstLetter}&rdquo;</strong> (Phiên âm: /{currentQ.ipa}/)
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {!isAnswered ? (
            <>
              <button
                type="button"
                onClick={() => setShowHint(true)}
                disabled={showHint}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-raised border border-border-subtle hover:border-primary/50 text-xs font-bold text-ink-muted hover:text-ink transition"
              >
                <HelpCircle className="h-4 w-4 text-amber-500" />
                <span>Xem Gợi Ý</span>
              </button>

              <button
                type="submit"
                disabled={!inputAnswer.trim()}
                className="flex-1 max-w-[200px] px-6 py-2.5 rounded-xl bg-primary text-canvas font-bold text-sm hover:brightness-110 disabled:opacity-40 transition shadow-sm active:scale-95 cursor-pointer ml-auto"
              >
                Kiểm Tra Đáp Án
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Chính xác: {currentQ.targetWord} (/{currentQ.ipa}/)</span>
                <button
                  type="button"
                  onClick={() => playPronunciation(currentQ.targetWord)}
                  className="p-1 rounded-lg hover:bg-emerald-100"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-primary text-canvas font-bold text-sm hover:brightness-110 transition shadow-sm active:scale-95"
              >
                <span>{isLastQuestion ? "Hoàn thành" : "Câu tiếp theo"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
