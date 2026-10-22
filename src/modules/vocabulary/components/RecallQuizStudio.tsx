"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVocabularyStore } from "../stores/useVocabularyStore";

export function RecallQuizStudio() {
  const { items, selectedDeckId, decks, setSelectedDeckId } = useVocabularyStore();

  const [prevDeckId, setPrevDeckId] = useState(selectedDeckId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);

  if (prevDeckId !== selectedDeckId) {
    setPrevDeckId(selectedDeckId);
    setCurrentIndex(0);
    setUserInput("");
    setShowHint(false);
    setIsAnswered(false);
    setIsCorrect(false);
    setScore(0);
  }

  const currentItem = items[currentIndex];

  const playPronunciation = (url: string | null | undefined, wordText: string) => {
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(() => playWebSpeech(wordText));
    } else {
      playWebSpeech(wordText);
    }
  };

  const playWebSpeech = (wordText: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(wordText);
    utterance.lang = "en-GB";
    window.speechSynthesis.speak(utterance);
  };

  const handleCheck = () => {
    if (!currentItem || isAnswered) return;

    const target = currentItem.word.trim().toLowerCase();
    const input = userInput.trim().toLowerCase();
    const correct = target === input;

    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      setScore((s) => s + 1);
      playPronunciation(currentItem.referenceAudioUrl, currentItem.word);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < items.length) {
      setCurrentIndex((i) => i + 1);
      setUserInput("");
      setShowHint(false);
      setIsAnswered(false);
      setIsCorrect(false);
    } else {
      // Loop or finish
      setCurrentIndex(0);
      setUserInput("");
      setShowHint(false);
      setIsAnswered(false);
      setIsCorrect(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-6 rounded-3xl bg-surface border border-border-subtle shadow-xl">
      {/* Deck Selector Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <span>🇻🇳 ➔ 🇬🇧</span> Vietnamese to English Recall Studio
          </h2>
          <p className="text-xs text-ink-muted mt-1">
            Luyện phản xạ gõ từ tiếng Anh chuẩn xác dựa trên định nghĩa nghĩa tiếng Việt và ngữ cảnh ví dụ.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-ink-muted font-medium">Bộ từ:</label>
          <select
            value={selectedDeckId || ""}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-surface-raised border border-border-subtle text-ink text-xs focus:border-primary outline-none"
          >
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name} ({deck.itemCount} từ)
              </option>
            ))}
          </select>
        </div>
      </div>

      {!currentItem ? (
        <div className="p-12 text-center text-xs text-ink-muted">
          Không có từ vựng nào trong bộ này. Vui lòng chọn bộ từ khác!
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-6"
          >
            {/* Progress indicator */}
            <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
              <span>
                Thẻ {currentIndex + 1} / {items.length}
              </span>
              <span className="text-emerald-400 font-bold">
                Điểm phản xạ: {score} / {items.length}
              </span>
            </div>

            {/* Prompt Box */}
            <div className="p-6 rounded-2xl bg-surface-raised border border-border-subtle flex flex-col items-center text-center gap-3 shadow-inner">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Định nghĩa tiếng Việt:
              </span>
              <h3 className="text-xl font-bold text-ink">{currentItem.definitionVi}</h3>
              {currentItem.exampleSentenceVi && (
                <p className="text-xs text-ink-muted italic">
                  &ldquo;{currentItem.exampleSentenceVi}&rdquo;
                </p>
              )}
            </div>

            {/* Answer Input */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-ink">Gõ từ tiếng Anh tương ứng:</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (!isAnswered ? handleCheck() : handleNext())}
                  disabled={isAnswered}
                  placeholder="Nhập từ vựng tiếng Anh..."
                  className="flex-1 bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm font-mono text-ink outline-none focus:border-primary transition"
                />
                {!isAnswered ? (
                  <button
                    type="button"
                    onClick={handleCheck}
                    disabled={!userInput.trim()}
                    className="px-6 py-3 rounded-xl bg-primary text-canvas font-bold text-xs shadow hover:brightness-110 disabled:opacity-50 transition"
                  >
                    Kiểm Tra
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 rounded-xl bg-emerald-500 text-canvas font-bold text-xs shadow hover:brightness-110 transition"
                  >
                    Từ Tiếp Theo →
                  </button>
                )}
              </div>
            </div>

            {/* Hint toggle */}
            {!isAnswered && (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  <span>💡</span> {showHint ? "Ẩn gợi ý" : "Xem gợi ý phiên âm IPA"}
                </button>
                {showHint && (
                  <span className="text-xs font-mono text-primary font-bold animate-fade-in">
                    Gợi ý IPA: /{currentItem.ipa}/
                  </span>
                )}
              </div>
            )}

            {/* Feedback message */}
            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between ${
                  isCorrect
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-coral-500/10 border-coral-500/30 text-coral-400"
                }`}
              >
                <div>
                  <span className="font-bold text-sm block">
                    {isCorrect ? "✓ Chính xác tuyệt vời!" : "✕ Chưa chính xác"}
                  </span>
                  <span>
                    Đáp án đúng: <strong className="font-mono">{currentItem.word}</strong> (/{currentItem.ipa}/)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => playPronunciation(currentItem.referenceAudioUrl, currentItem.word)}
                  className="px-3 py-1.5 rounded-xl bg-surface border border-border-subtle text-ink text-xs hover:border-primary/50 transition flex items-center gap-1"
                >
                  <span>🔊 Nghe</span>
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
