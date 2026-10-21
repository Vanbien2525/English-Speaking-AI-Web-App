"use client";

import { useState, useEffect, useCallback } from "react";
import type { ListeningQuizQuestion } from "@/core/dto/vocabulary.dto";
import { useVocabularyStore } from "../stores/useVocabularyStore";

export function ListeningQuizStudio() {
  const { selectedDeckId, decks } = useVocabularyStore();
  const [questions, setQuestions] = useState<ListeningQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentDeck = decks.find((d) => d.id === selectedDeckId);

  const playWebSpeech = useCallback((word: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-GB";
    utterance.rate = 0.85;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setSelectedOption(null);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);

    try {
      const url = selectedDeckId
        ? `/api/vocabulary/quiz/listening?deckId=${encodeURIComponent(selectedDeckId)}&limit=5`
        : "/api/vocabulary/quiz/listening?limit=5";

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
          ? `/api/vocabulary/quiz/listening?deckId=${encodeURIComponent(selectedDeckId)}&limit=5`
          : "/api/vocabulary/quiz/listening?limit=5";
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

  const playAudio = useCallback(() => {
    if (!currentQ) return;
    setIsPlaying(true);

    if (currentQ.audioUrl) {
      const audio = new Audio(currentQ.audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        playWebSpeech(currentQ.targetWord);
      };
      audio.play().catch(() => playWebSpeech(currentQ.targetWord));
    } else {
      playWebSpeech(currentQ.targetWord);
    }
  }, [currentQ, playWebSpeech]);

  // Auto-play audio when question appears
  useEffect(() => {
    if (currentQ) {
      const timer = setTimeout(() => {
        playAudio();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentQ, playAudio]);

  const handleSelectOption = (option: string) => {
    if (selectedOption !== null || !currentQ) return;
    setSelectedOption(option);

    if (option.toLowerCase() === currentQ.correctAnswer.toLowerCase()) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-xl mx-auto p-12 text-center rounded-2xl border border-border-subtle bg-surface animate-pulse text-xs text-ink-muted">
        Đang khởi tạo bài luyện nghe trắc nghiệm từ vựng...
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto p-8 text-center rounded-2xl border border-border-subtle bg-surface text-ink-muted flex flex-col items-center gap-3">
        <span className="text-3xl">🎧</span>
        <h3 className="text-base font-bold text-ink">Chưa có đủ từ vựng để tạo bài luyện nghe</h3>
        <p className="text-xs">Vui lòng thêm ít nhất 2 từ vựng vào bộ để bắt đầu luyện nghe chọn từ.</p>
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
        <span className="text-5xl">🏆</span>
        <h3 className="text-2xl font-bold text-ink">Hoàn Thành Bài Luyện Nghe!</h3>
        <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle w-full max-w-xs">
          <div className="text-3xl font-extrabold text-primary mb-1">
            {score} / {questions.length}
          </div>
          <p className="text-xs text-ink-muted">Tỉ lệ nghe chuẩn xác: {percent}%</p>
        </div>
        <p className="text-xs text-ink-muted max-w-sm">
          Phản xạ thính giác với âm chuẩn British RP giúp bạn nhận diện từ vựng tự nhiên hơn trong giao tiếp thực tế.
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
      {/* Quiz Header */}
      <div className="flex items-center justify-between text-xs text-ink-muted pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="font-bold text-ink">
            Câu {currentIndex + 1} / {questions.length}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-surface-raised border border-border-subtle">
            {currentDeck?.name || "Tất cả từ vựng"}
          </span>
        </div>
        <div className="font-semibold text-primary">Điểm: {score}</div>
      </div>

      {/* Audio Play Center */}
      <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-surface-raised border border-border-subtle gap-3 text-center">
        <span className="text-xs text-ink-muted font-medium">Bấm để nghe âm thanh chuẩn British RP:</span>
        <button
          type="button"
          onClick={playAudio}
          disabled={isPlaying}
          className="w-16 h-16 rounded-full bg-primary text-canvas text-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg disabled:opacity-60"
        >
          {isPlaying ? "🔊" : "▶️"}
        </button>
        <p className="text-xs text-ink-muted italic">
          {isPlaying ? "Đang phát âm thanh..." : "Nghe kỹ và chọn từ vựng khớp nhất"}
        </p>
      </div>

      {/* Multiple-Choice Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentQ.options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isCorrect = option.toLowerCase() === currentQ.correctAnswer.toLowerCase();

          let btnStyle = "bg-surface-raised border-border-subtle hover:border-primary/50 text-ink";
          if (selectedOption !== null) {
            if (isCorrect) {
              btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold";
            } else if (isSelected) {
              btnStyle = "bg-coral-500/20 border-coral-500 text-coral-400 font-bold";
            } else {
              btnStyle = "opacity-40 border-border-subtle text-ink-muted";
            }
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectOption(option)}
              disabled={selectedOption !== null}
              className={`p-4 rounded-xl border text-sm font-semibold transition flex items-center justify-between ${btnStyle}`}
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-surface border border-border-subtle flex items-center justify-center text-xs text-ink-muted">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{option}</span>
              </div>
              {selectedOption !== null && isCorrect && <span>✓</span>}
              {selectedOption !== null && isSelected && !isCorrect && <span>✗</span>}
            </button>
          );
        })}
      </div>

      {/* Answer Feedback & Explanation */}
      {selectedOption !== null && (
        <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle flex flex-col gap-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink">
              {selectedOption.toLowerCase() === currentQ.correctAnswer.toLowerCase()
                ? "🎉 Chính xác!"
                : "❌ Chưa đúng rồi!"}
            </span>
            <span className="ipa text-xs text-primary font-medium">/{currentQ.ipa}/</span>
          </div>
          <p className="text-xs text-ink-muted">
            <strong className="text-ink">{currentQ.correctAnswer}</strong>: {currentQ.definitionVi}
          </p>
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-primary text-canvas text-xs font-bold hover:brightness-110 transition shadow"
            >
              {currentIndex + 1 < questions.length ? "Câu tiếp theo →" : "Xem kết quả →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
