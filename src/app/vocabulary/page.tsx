"use client";

import { useEffect } from "react";
import { useVocabularyStore } from "@/modules/vocabulary/stores/useVocabularyStore";
import { VocabularyHeader } from "@/modules/vocabulary/components/VocabularyHeader";
import { FlashcardReviewDeck } from "@/modules/vocabulary/components/FlashcardReviewDeck";
import { ListeningQuizStudio } from "@/modules/vocabulary/components/ListeningQuizStudio";
import { SpellingClozeStudio } from "@/modules/vocabulary/components/SpellingClozeStudio";
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink px-3 py-1">Chế Độ Luyện Tập:</span>
            <button
              type="button"
              onClick={() => {
                setActivePracticeMode("flashcard");
                setIsReviewing(true);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                isReviewing && activePracticeMode === "flashcard"
                  ? "bg-primary text-canvas"
                  : "bg-surface-raised text-ink hover:border-primary/40"
              }`}
            >
              <span>🎴</span>
              <span>Thẻ 3D SM-2</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePracticeMode("listening_quiz");
                setIsReviewing(true);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                isReviewing && activePracticeMode === "listening_quiz"
                  ? "bg-primary text-canvas"
                  : "bg-surface-raised text-ink hover:border-primary/40"
              }`}
            >
              <span>🎧</span>
              <span>Luyện Nghe Chọn Từ</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePracticeMode("spelling_cloze");
                setIsReviewing(true);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                isReviewing && activePracticeMode === "spelling_cloze"
                  ? "bg-primary text-canvas"
                  : "bg-surface-raised text-ink hover:border-primary/40"
              }`}
            >
              <span>✍️</span>
              <span>Gõ Từ Điền Chỗ Trống</span>
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

        {/* Dynamic Studio Workspace */}
        <section aria-label="Vocabulary Workspace">
          {isReviewing ? (
            <div className="flex flex-col gap-6 py-4 animate-fade-in">
              {activePracticeMode === "flashcard" && <FlashcardReviewDeck />}
              {activePracticeMode === "listening_quiz" && <ListeningQuizStudio />}
              {activePracticeMode === "spelling_cloze" && <SpellingClozeStudio />}
            </div>
          ) : null}

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
