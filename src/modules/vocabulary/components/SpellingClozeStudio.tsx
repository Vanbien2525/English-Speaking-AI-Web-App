"use client";

import { useState, useEffect, useCallback } from "react";
import type { ClozeSpellingQuestion } from "@/core/dto/vocabulary.dto";
import { useVocabularyStore } from "../stores/useVocabularyStore";

export function SpellingClozeStudio() {
  const { selectedDeckId, decks, incrementDailyPracticed } = useVocabularyStore();
  const [isShaking, setIsShaking] = useState(false);
  const [questions, setQuestions] = useState<ClozeSpellingQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputAnswer, setInputAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showIpaHint, setShowIpaHint] = useState(false);

  const currentDeck = decks.find((d) => d.id === selectedDeckId);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setInputAnswer("");
    setIsAnswered(false);
    setIsCorrect(false);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setShowIpaHint(false);

    try {
      const url = selectedDeckId
        ? `/api/vocabulary/quiz/cloze?deckId=${encodeURIComponent(selectedDeckId)}&limit=5`
        : "/api/vocabulary/quiz/cloze?limit=5";

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
  }, [selectedDeckId]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const url = selectedDeckId
          ? `/api/vocabulary/quiz/cloze?deckId=${encodeURIComponent(selectedDeckId)}&limit=5`
          : "/api/vocabulary/quiz/cloze?limit=5";

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
  }, [selectedDeckId]);

  const currentQ = questions[currentIndex];

  const handleCheckAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentQ || !inputAnswer.trim() || isAnswered) return;

    const trimmedInput = inputAnswer.trim().toLowerCase();
    const correctTarget = currentQ.targetWord.trim().toLowerCase();

    const correct = trimmedInput === correctTarget;
    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      setScore((s) => s + 1);
      incrementDailyPracticed();
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setInputAnswer("");
      setIsAnswered(false);
      setIsCorrect(false);
      setShowIpaHint(false);
    } else {
      setIsFinished(true);
    }
  };

  const playPronunciation = (word: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-GB";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-xl mx-auto p-12 text-center rounded-2xl border border-border-subtle bg-surface animate-pulse text-xs text-ink-muted">
        Đang khởi tạo bài tập gõ từ điền vào chỗ trống...
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto p-8 text-center rounded-2xl border border-border-subtle bg-surface text-ink-muted flex flex-col items-center gap-3">
        <span className="text-3xl">✍️</span>
        <h3 className="text-base font-bold text-ink">Chưa có câu ví dụ để tạo bài tập điền từ</h3>
        <p className="text-xs">Vui lòng thêm từ vựng mới vào bộ từ để kích hoạt chế độ này.</p>
        <button
          onClick={fetchQuestions}
          className="px-4 py-2 rounded-xl bg-primary text-canvas text-xs font-semibold hover:brightness-110 transition"
        >
          Thử Lại
        </button>
      </div>
    );
  }

  if (isFinished) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className="w-full max-w-xl mx-auto p-8 text-center rounded-2xl border border-border-subtle bg-surface flex flex-col items-center gap-4 shadow-xl">
        <span className="text-5xl">🎯</span>
        <h3 className="text-2xl font-bold text-ink">Hoàn Thành Bài Tập Gõ Từ!</h3>
        <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle w-full max-w-xs">
          <div className="text-3xl font-extrabold text-primary mb-1">
            {score} / {questions.length}
          </div>
          <p className="text-xs text-ink-muted">Chính tả chuẩn xác: {percent}%</p>
        </div>
        <p className="text-xs text-ink-muted max-w-sm">
          Việc kết hợp gõ từ đúng chính tả với phiên âm IPA giúp khắc sâu trí nhớ từ vựng và tránh nhầm lẫn khi giao tiếp.
        </p>
        <button
          onClick={fetchQuestions}
          className="px-6 py-2.5 rounded-xl bg-primary text-canvas font-bold text-xs hover:brightness-110 transition shadow active:scale-95"
        >
          Luyện Tập Lại Lần Nữa
        </button>
      </div>
    );
  }

  if (!currentQ) {
    return null;
  }

  return (
    <div className="w-full max-w-xl mx-auto p-6 rounded-2xl border border-border-subtle bg-surface shadow-xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-ink-muted pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="font-bold text-ink">
            Câu {currentIndex + 1} / {questions.length}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-surface-raised border border-border-subtle">
            {currentDeck?.name || "Bộ từ vựng"}
          </span>
        </div>
        <div className="font-semibold text-primary">Điểm: {score}</div>
      </div>

      {/* Sentence with Blank */}
      <div className="p-6 rounded-xl bg-surface-raised border border-border-subtle flex flex-col gap-3">
        <span className="text-xs font-semibold text-primary uppercase">Điền từ còn thiếu vào chỗ trống:</span>
        <p className="text-lg font-bold text-ink leading-relaxed">
          &ldquo;{currentQ.sentenceWithBlank}&rdquo;
        </p>
        {currentQ.sentenceVi && (
          <p className="text-xs text-ink-muted italic border-t border-border-subtle/50 pt-2">
            Ý nghĩa: {currentQ.sentenceVi}
          </p>
        )}
      </div>

      {/* Phonetic & Meaning Hints (Requirement 10: Toggle IPA Hint) */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-border-subtle text-xs">
        <div className="flex items-center gap-2">
          {showIpaHint ? (
            <div className="flex items-center gap-1.5 animate-fade-in">
              <span className="text-ink-muted">Gợi ý IPA:</span>
              <span className="ipa font-bold text-primary text-sm">/{currentQ.hintIpa}/</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowIpaHint(true)}
              className="text-primary hover:underline font-semibold flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/25 hover:bg-primary/20 transition cursor-pointer"
              title="Bấm để hiển thị gợi ý phiên âm IPA"
            >
              <span>💡</span> Xem gợi ý IPA
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => playPronunciation(currentQ.targetWord)}
          className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span>🔊</span> Nghe phát âm
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleCheckAnswer} className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputAnswer}
            onChange={(e) => setInputAnswer(e.target.value)}
            disabled={isAnswered}
            placeholder="Gõ từ tiếng Anh chính xác vào đây..."
            className={`flex-1 px-4 py-3 rounded-xl bg-surface-raised border text-base font-semibold outline-hidden transition ${
              isAnswered
                ? isCorrect
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-300"
                  : "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300"
                : isShaking
                  ? "animate-shake border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300"
                  : "border-border-subtle text-ink focus:border-primary"
            }`}
            autoFocus
          />
          {!isAnswered ? (
            <button
              type="submit"
              disabled={!inputAnswer.trim()}
              className="px-6 py-3 rounded-xl bg-primary text-canvas font-bold text-sm hover:brightness-110 active:scale-95 transition shadow disabled:opacity-50"
            >
              Kiểm Tra
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 rounded-xl bg-primary text-canvas font-bold text-sm hover:brightness-110 active:scale-95 transition shadow"
            >
              Tiếp Tục →
            </button>
          )}
        </div>
      </form>

      {/* Answer Feedback */}
      {isAnswered && (
        <div
          className={`p-4 rounded-xl border text-xs flex flex-col gap-1.5 animate-fade-in ${
            isCorrect
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
              : "bg-coral-500/10 border-coral-500/40 text-coral-400"
          }`}
        >
          <div className="font-bold text-sm flex items-center justify-between">
            <span>{isCorrect ? "✅ Chính xác tuyệt đối!" : "❌ Chưa chính xác!"}</span>
            <span className="font-mono text-ink">
              Đáp án: <strong className="text-primary">{currentQ.targetWord}</strong>
            </span>
          </div>
          {currentQ.hintDefinitionVi && (
            <p className="text-ink-muted">Nghĩa: {currentQ.hintDefinitionVi}</p>
          )}
        </div>
      )}
    </div>
  );
}
