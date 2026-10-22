"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVocabularyStore } from "@/modules/vocabulary/stores/useVocabularyStore";
import { VocabularyHeader } from "@/modules/vocabulary/components/VocabularyHeader";
import { FlashcardReviewDeck } from "@/modules/vocabulary/components/FlashcardReviewDeck";
import { ListeningQuizStudio } from "@/modules/vocabulary/components/ListeningQuizStudio";
import { SpellingClozeStudio } from "@/modules/vocabulary/components/SpellingClozeStudio";
import { MatchingQuizStudio } from "@/modules/vocabulary/components/MatchingQuizStudio";
import { RecallQuizStudio } from "@/modules/vocabulary/components/RecallQuizStudio";
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
  } = useVocabularyStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <main className="min-h-screen bg-canvas px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Navigation & Metrics Header */}
        <VocabularyHeader />

        {/* Practice Mode Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-surface border border-border-subtle shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink px-3 py-1">Chế Độ Luyện Tập:</span>
            <button
              type="button"
              onClick={() => {
                setActivePracticeMode("flashcard");
                setIsReviewing(true);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                isReviewing && activePracticeMode === "flashcard"
                  ? "bg-primary text-canvas"
                  : "bg-surface-raised text-ink hover:border-primary/40"
              }`}
            >
              <span>🎴</span>
              <span>Flashcard 3D</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePracticeMode("spelling_cloze");
                setIsReviewing(true);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                isReviewing && activePracticeMode === "spelling_cloze"
                  ? "bg-primary text-canvas"
                  : "bg-surface-raised text-ink hover:border-primary/40"
              }`}
            >
              <span>✍️</span>
              <span>Spelling Cloze</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePracticeMode("matching_quiz");
                setIsReviewing(true);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                isReviewing && activePracticeMode === "matching_quiz"
                  ? "bg-primary text-canvas"
                  : "bg-surface-raised text-ink hover:border-primary/40"
              }`}
            >
              <span>🧩</span>
              <span>Matching Quiz</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePracticeMode("recall_quiz");
                setIsReviewing(true);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                isReviewing && activePracticeMode === "recall_quiz"
                  ? "bg-primary text-canvas"
                  : "bg-surface-raised text-ink hover:border-primary/40"
              }`}
            >
              <span>🇻🇳 ➔ 🇬🇧</span>
              <span>VN-EN Recall</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePracticeMode("listening_quiz");
                setIsReviewing(true);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                isReviewing && activePracticeMode === "listening_quiz"
                  ? "bg-primary text-canvas"
                  : "bg-surface-raised text-ink hover:border-primary/40"
              }`}
            >
              <span>🎧</span>
              <span>Luyện Nghe</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsReviewing(!isReviewing)}
            className="text-xs font-semibold text-primary hover:underline px-3 py-1"
          >
            {isReviewing ? "Ẩn bài tập & xem danh sách" : "Mở phòng luyện tập →"}
          </button>
        </div>

        {/* Dynamic Studio Workspace with Luxury Motion Transitions */}
        <section aria-label="Vocabulary Workspace">
          <AnimatePresence mode="wait">
            {isReviewing ? (
              <motion.div
                key={activePracticeMode}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex flex-col gap-6 py-4"
              >
                {activePracticeMode === "flashcard" && <FlashcardReviewDeck />}
                {activePracticeMode === "spelling_cloze" && <SpellingClozeStudio />}
                {activePracticeMode === "matching_quiz" && <MatchingQuizStudio />}
                {activePracticeMode === "recall_quiz" && <RecallQuizStudio />}
                {activePracticeMode === "listening_quiz" && <ListeningQuizStudio />}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Vocabulary Table is always accessible */}
          <div className="flex flex-col gap-6 animate-fade-in mt-2">
            <VocabularyTable />
          </div>
        </section>

        {/* Interactive Modals */}
        <QuickAddModal />
        <BatchImportModal />
        <CreateDeckModal />
      </div>
    </main>
  );
}
