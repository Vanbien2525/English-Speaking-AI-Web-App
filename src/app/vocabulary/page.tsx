"use client";

import { useEffect } from "react";
import { useVocabularyStore } from "@/modules/vocabulary/stores/useVocabularyStore";
import { VocabularyHeader } from "@/modules/vocabulary/components/VocabularyHeader";
import { FlashcardReviewDeck } from "@/modules/vocabulary/components/FlashcardReviewDeck";
import { VocabularyTable } from "@/modules/vocabulary/components/VocabularyTable";
import { QuickAddModal } from "@/modules/vocabulary/components/QuickAddModal";
import { BatchImportModal } from "@/modules/vocabulary/components/BatchImportModal";

export default function VocabularyPage() {
  const { isReviewing, fetchInitialData } = useVocabularyStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <main className="min-h-screen bg-canvas px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Navigation & Metrics Header */}
        <VocabularyHeader />

        {/* Dynamic Studio Workspace */}
        <section aria-label="Vocabulary Workspace">
          {isReviewing ? (
            <div className="flex flex-col gap-4 py-4 animate-fade-in">
              <FlashcardReviewDeck />
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-fade-in">
              <VocabularyTable />
            </div>
          )}
        </section>

        {/* Interactive Modals */}
        <QuickAddModal />
        <BatchImportModal />
      </div>
    </main>
  );
}
