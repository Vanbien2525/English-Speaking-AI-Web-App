"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useVocabularyStore } from "@/modules/vocabulary/stores/useVocabularyStore";
import { isSameDay } from "@/modules/vocabulary/utils/date-helpers";
import { VocabularyHeader } from "@/modules/vocabulary/components/VocabularyHeader";
import { DailyProgressBar } from "@/modules/vocabulary/components/DailyProgressBar";
import { FlashcardReviewDeck } from "@/modules/vocabulary/components/FlashcardReviewDeck";
import { SpellingClozeStudio } from "@/modules/vocabulary/components/SpellingClozeStudio";
import { MatchingQuizStudio } from "@/modules/vocabulary/components/MatchingQuizStudio";
import { VietnameseToEnglishStudio } from "@/modules/vocabulary/components/VietnameseToEnglishStudio";
import { ListeningQuizStudio } from "@/modules/vocabulary/components/ListeningQuizStudio";
import { VocabularyTable } from "@/modules/vocabulary/components/VocabularyTable";
import { QuickAddModal } from "@/modules/vocabulary/components/QuickAddModal";
import { BatchImportModal } from "@/modules/vocabulary/components/BatchImportModal";
import { CreateDeckModal } from "@/modules/vocabulary/components/CreateDeckModal";

export default function VocabularyPage() {
  const {
    isReviewing,
    setIsReviewing,
    activePracticeMode,
    setActivePracticeMode,
    fetchInitialData,
    selectedDeckId,
    setSelectedDeckId,
    decks,
    allItems,
    items,
    isDailyFocusMode,
    exitDailyPractice,
  } = useVocabularyStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const todayWordsCount = allItems.filter((it) => isSameDay(it.createdAt)).length;

  return (
    <main className="min-h-screen bg-canvas px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Navigation & Metrics Header */}
        <VocabularyHeader />

        {/* Daily Goal & Trouble Words Smart Review Bar */}
        <DailyProgressBar />

        {/* Daily Focus Mode Header Banner */}
        {isDailyFocusMode && (
          <div className="w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-2 border-emerald-500/30 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-xl shadow-md">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-ink">
                    Phòng Luyện Tập 15 Từ Mới Hôm Nay
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 font-bold border border-emerald-500/30">
                    {todayWordsCount}/15 từ
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  Luyện tập chuyên sâu 4 kỹ năng cho các từ mới nạp hôm nay để củng cố phản xạ và nhớ lâu hơn.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => exitDailyPractice()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-surface border border-border-subtle text-ink hover:bg-surface-raised transition cursor-pointer shadow-xs"
            >
              <span>←</span>
              <span>Thoát về tất cả từ</span>
            </button>
          </div>
        )}

        {/* Practice Mode Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-surface border border-border-subtle shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink px-2 py-1">Chế Độ:</span>

            {/* 1. Flashcard */}
            <button
              type="button"
              onClick={() => {
                setActivePracticeMode("flashcard");
                setIsReviewing(true);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                isReviewing && activePracticeMode === "flashcard"
                  ? "bg-primary text-canvas"
                  : "bg-surface-raised text-ink hover:border-primary/40 border border-border-subtle"
              }`}
            >
              <span>🎴</span>
              <span>Thẻ Flashcard SM-2</span>
            </button>

            

            {/* 3. Spelling Cloze */}
            <button
              type="button"
              onClick={() => {
                setActivePracticeMode("spelling_cloze");
                setIsReviewing(true);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                isReviewing && activePracticeMode === "spelling_cloze"
                  ? "bg-primary text-canvas"
                  : "bg-surface-raised text-ink hover:border-primary/40 border border-border-subtle"
              }`}
            >
              <span>✍️</span>
              <span>Nghe Gõ Từ</span>
            </button>

            {/* 3. Matching Quiz */}
            <button
              type="button"
              onClick={() => {
                setActivePracticeMode("matching");
                setIsReviewing(true);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                isReviewing && activePracticeMode === "matching"
                  ? "bg-primary text-canvas"
                  : "bg-surface-raised text-ink hover:border-primary/40 border border-border-subtle"
              }`}
            >
              <span>🧩</span>
              <span>Nối Từ &amp; Nghĩa</span>
            </button>

            {/* 4. Vietnamese to English Recall */}
            <button
              type="button"
              onClick={() => {
                setActivePracticeMode("vi_to_en");
                setIsReviewing(true);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                isReviewing && activePracticeMode === "vi_to_en"
                  ? "bg-primary text-canvas"
                  : "bg-surface-raised text-ink hover:border-primary/40 border border-border-subtle"
              }`}
            >
              <span>🇻🇳</span>
              <span>Tiếng Việt → Tiếng Anh</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Deck Selector for All 4 Practice Modes */}
            {isDailyFocusMode ? (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <span>⚡</span> 15 từ mới hôm nay ({todayWordsCount} từ)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-surface-raised px-2.5 py-1.5 rounded-xl border border-border-subtle">
                <span className="text-xs font-semibold text-ink-muted">Bộ từ:</span>
                <select
                  value={selectedDeckId || ""}
                  onChange={(e) => setSelectedDeckId(e.target.value ? e.target.value : null)}
                  className="bg-transparent text-xs font-bold text-ink outline-none cursor-pointer"
                  title="Chọn bộ từ để luyện tập cho tất cả các chế độ"
                >
                  <option value="">Tất cả các bộ ({(allItems || items).length} từ)</option>
                  {decks.map((deck) => {
                    const count = (allItems || items).filter((it) => it.deckId === deck.id).length;
                    return (
                      <option key={deck.id} value={deck.id}>
                        {deck.name} ({count} từ)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsReviewing(!isReviewing)}
              className="text-xs font-bold text-primary hover:underline px-3.5 py-1.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition cursor-pointer flex items-center gap-1.5"
            >
              {isReviewing ? (
                <>
                  <span>📋</span>
                  <span>Xem danh sách từ</span>
                </>
              ) : (
                <>
                  <span>Mở phòng luyện tập</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Studio Workspace with Luxury Transitions */}
        <section aria-label="Vocabulary Workspace" className="overflow-hidden">
          <AnimatePresence mode="wait">
            {isReviewing ? (
              <motion.div
                key={`reviewing-${activePracticeMode}`}
                initial={{ opacity: 0, y: 12, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.995 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-6 py-2"
              >
                {activePracticeMode === "flashcard" && <FlashcardReviewDeck />}
                {activePracticeMode === "spelling_cloze" && <SpellingClozeStudio />}
                {activePracticeMode === "matching" && <MatchingQuizStudio />}
                {activePracticeMode === "vi_to_en" && <VietnameseToEnglishStudio />}
                {activePracticeMode === "listening_quiz" && <ListeningQuizStudio />}
              </motion.div>
            ) : (
              <motion.div
                key="vocab-table-view"
                initial={{ opacity: 0, y: 12, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.995 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-6 mt-2"
              >
                <VocabularyTable />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Interactive Modals */}
        <QuickAddModal />
        <BatchImportModal />
        <CreateDeckModal />
      </div>
    </main>
  );
}
