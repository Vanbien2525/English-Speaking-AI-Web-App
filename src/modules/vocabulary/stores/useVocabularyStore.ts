import { create } from "zustand";
import type {
  VocabularyDeck,
  VocabularyItem,
  VocabularyMetrics,
  FlashcardReviewResult,
  QuickAddEnrichResponse,
  BatchImportResponse,
} from "@/core/dto/vocabulary.dto";

export interface VocabularyState {
  // Data
  decks: VocabularyDeck[];
  selectedDeckId: string | null;
  items: VocabularyItem[];
  dueItems: VocabularyItem[];
  metrics: VocabularyMetrics;

  // Flashcard review session
  currentCardIndex: number;
  isFlipped: boolean;
  isReviewing: boolean;
  lastReviewResult: FlashcardReviewResult | null;

  // UI Modals
  isQuickAddOpen: boolean;
  isBatchImportOpen: boolean;
  isLoading: boolean;
  isEnriching: boolean;
  isSubmittingReview: boolean;
  errorMessage: string | null;

  // Actions
  setSelectedDeckId: (deckId: string | null) => void;
  setQuickAddOpen: (open: boolean) => void;
  setBatchImportOpen: (open: boolean) => void;
  setIsReviewing: (reviewing: boolean) => void;
  flipCard: () => void;
  nextCard: () => void;
  prevCard: () => void;
  resetReviewSession: () => void;

  // API Async Actions
  fetchInitialData: () => Promise<void>;
  fetchDueItems: () => Promise<void>;
  fetchItems: (deckId?: string) => Promise<void>;
  enrichWord: (word: string) => Promise<QuickAddEnrichResponse | null>;
  createItem: (item: {
    deckId: string;
    word: string;
    ipa: string;
    partOfSpeech?: string;
    definitionVi: string;
    exampleSentenceEn?: string;
    exampleSentenceVi?: string;
    articulatoryTipVi?: string;
    referenceAudioUrl?: string | null;
  }) => Promise<boolean>;
  batchImport: (deckId: string, rawText: string) => Promise<BatchImportResponse | null>;
  submitSpeakingReview: (params: {
    vocabularyItemId: string;
    pronunciationScoreBp: number;
    audioDurationMs: number;
  }) => Promise<FlashcardReviewResult | null>;
}

export const useVocabularyStore = create<VocabularyState>((set, get) => ({
  decks: [],
  selectedDeckId: null,
  items: [],
  dueItems: [],
  metrics: {
    totalWords: 0,
    dueCardsCount: 0,
    masteredWordsCount: 0,
    retentionRateBp: 0,
  },

  currentCardIndex: 0,
  isFlipped: false,
  isReviewing: false,
  lastReviewResult: null,

  isQuickAddOpen: false,
  isBatchImportOpen: false,
  isLoading: false,
  isEnriching: false,
  isSubmittingReview: false,
  errorMessage: null,

  setSelectedDeckId: (deckId) => {
    set({ selectedDeckId: deckId });
    get().fetchItems(deckId ?? undefined);
  },

  setQuickAddOpen: (open) => set({ isQuickAddOpen: open }),
  setBatchImportOpen: (open) => set({ isBatchImportOpen: open }),
  setIsReviewing: (reviewing) =>
    set({
      isReviewing: reviewing,
      currentCardIndex: 0,
      isFlipped: false,
      lastReviewResult: null,
    }),

  flipCard: () => set((s) => ({ isFlipped: !s.isFlipped })),

  nextCard: () => {
    const { currentCardIndex, dueItems } = get();
    if (currentCardIndex + 1 < dueItems.length) {
      set({
        currentCardIndex: currentCardIndex + 1,
        isFlipped: false,
        lastReviewResult: null,
      });
    } else {
      // Completed session
      set({ isReviewing: false, isFlipped: false, lastReviewResult: null });
      get().fetchInitialData();
    }
  },

  prevCard: () => {
    const { currentCardIndex } = get();
    if (currentCardIndex > 0) {
      set({
        currentCardIndex: currentCardIndex - 1,
        isFlipped: false,
        lastReviewResult: null,
      });
    }
  },

  resetReviewSession: () =>
    set({
      currentCardIndex: 0,
      isFlipped: false,
      isReviewing: false,
      lastReviewResult: null,
    }),

  fetchInitialData: async () => {
    set({ isLoading: true, errorMessage: null });
    try {
      const [decksRes, dueRes] = await Promise.all([
        fetch("/api/vocabulary/decks"),
        fetch("/api/vocabulary/review/due"),
      ]);

      const decksData = decksRes.ok ? await decksRes.json() : { decks: [] };
      const dueData = dueRes.ok
        ? await dueRes.json()
        : {
            dueItems: [],
            metrics: {
              totalWords: 0,
              dueCardsCount: 0,
              masteredWordsCount: 0,
              retentionRateBp: 0,
            },
          };

      const decks = decksData.decks || [];
      const defaultDeckId = get().selectedDeckId || (decks.length > 0 ? decks[0].id : null);

      set({
        decks,
        selectedDeckId: defaultDeckId,
        dueItems: dueData.dueItems || [],
        metrics: dueData.metrics || get().metrics,
        isLoading: false,
      });

      if (defaultDeckId) {
        get().fetchItems(defaultDeckId);
      }
    } catch (err: unknown) {
      const error = err as Error;
      set({ isLoading: false, errorMessage: error.message });
    }
  },

  fetchDueItems: async () => {
    try {
      const res = await fetch("/api/vocabulary/review/due");
      if (res.ok) {
        const data = await res.json();
        set({
          dueItems: data.dueItems || [],
          metrics: data.metrics || get().metrics,
        });
      }
    } catch {
      // Silently keep previous state
    }
  },

  fetchItems: async (deckId?: string) => {
    try {
      const url = deckId ? `/api/vocabulary/items?deckId=${encodeURIComponent(deckId)}` : "/api/vocabulary/items";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        set({ items: data.items || [] });
      }
    } catch (err: unknown) {
      const error = err as Error;
      set({ errorMessage: error.message });
    }
  },

  enrichWord: async (word: string) => {
    set({ isEnriching: true, errorMessage: null });
    try {
      const res = await fetch("/api/vocabulary/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      const data = await res.json();
      set({ isEnriching: false });
      if (res.ok) {
        return data as QuickAddEnrichResponse;
      }
      set({ errorMessage: data.error?.message || "Không thể tra từ" });
      return null;
    } catch (err: unknown) {
      const error = err as Error;
      set({ isEnriching: false, errorMessage: error.message });
      return null;
    }
  },

  createItem: async (itemPayload) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await fetch("/api/vocabulary/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemPayload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Lỗi tạo từ vựng");
      }

      set({ isLoading: false });
      await Promise.all([get().fetchInitialData(), get().fetchItems(itemPayload.deckId)]);
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      set({ isLoading: false, errorMessage: error.message });
      return false;
    }
  },

  batchImport: async (deckId: string, rawText: string) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await fetch("/api/vocabulary/batch-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId, rawText }),
      });

      const data = await res.json();
      set({ isLoading: false });
      if (res.ok) {
        await Promise.all([get().fetchInitialData(), get().fetchItems(deckId)]);
        return data as BatchImportResponse;
      }
      set({ errorMessage: data.error?.message || "Lỗi nhập danh sách từ" });
      return null;
    } catch (err: unknown) {
      const error = err as Error;
      set({ isLoading: false, errorMessage: error.message });
      return null;
    }
  },

  submitSpeakingReview: async (params) => {
    set({ isSubmittingReview: true, errorMessage: null });
    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch("/api/vocabulary/review/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...params,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      set({ isSubmittingReview: false });

      if (res.ok) {
        const reviewResult = data as FlashcardReviewResult;
        set({ lastReviewResult: reviewResult });
        // Refresh due items and metrics in background
        get().fetchDueItems();
        return reviewResult;
      }

      set({ errorMessage: data.error?.message || "Lỗi nộp bài đánh giá" });
      return null;
    } catch (err: unknown) {
      const error = err as Error;
      set({ isSubmittingReview: false, errorMessage: error.message });
      return null;
    }
  },
}));
