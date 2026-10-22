import { create } from "zustand";
import type {
  VocabularyDeck,
  VocabularyItem,
  VocabularyMetrics,
  FlashcardReviewResult,
  QuickAddEnrichResponse,
  BatchImportResponse,
  ReviewLevel,
  TroubleWordItem,
} from "@/core/dto/vocabulary.dto";

export type PracticeMode = "flashcard" | "sentence" | "spelling_cloze" | "matching" | "vi_to_en" | "listening_quiz";
export type VocabularyLevelFilter = "all" | "again" | "good" | "easy";

export interface VocabularyState {
  // Data
  decks: VocabularyDeck[];
  selectedDeckId: string | null;
  allItems: VocabularyItem[];
  items: VocabularyItem[];
  dueItems: VocabularyItem[];
  metrics: VocabularyMetrics;

  // Flashcard review session
  currentCardIndex: number;
  isFlipped: boolean;
  isReviewing: boolean;
  lastReviewResult: FlashcardReviewResult | null;
  activePracticeMode: PracticeMode;
  levelFilter: VocabularyLevelFilter;
  troubleWords: TroubleWordItem[];
  dailyPracticedCount: number;
  dailyGoalCount: number;
  incrementDailyPracticed: () => void;
  isDailyFocusMode: boolean;
  isRandomShuffle: boolean;
  startDailyPractice: () => void;
  exitDailyPractice: () => void;
  toggleShuffle: () => void;
  fetchTroubleWords: () => Promise<void>;
  startTroubleWordsReview: () => Promise<void>;
  updateItemLevelManual: (itemId: string, level: "new" | "learning" | "mastered") => Promise<void>;

  // UI Modals
  isQuickAddOpen: boolean;
  isBatchImportOpen: boolean;
  isCreateDeckModalOpen: boolean;
  isLoading: boolean;
  isEnriching: boolean;
  isSubmittingReview: boolean;
  errorMessage: string | null;

  // Actions
  setSelectedDeckId: (deckId: string | null) => void;
  setActivePracticeMode: (mode: PracticeMode) => void;
  setLevelFilter: (filter: VocabularyLevelFilter) => void;
  setQuickAddOpen: (open: boolean) => void;
  setBatchImportOpen: (open: boolean) => void;
  setCreateDeckModalOpen: (open: boolean) => void;
  setIsReviewing: (reviewing: boolean) => void;
  learnItemNow: (itemId: string) => void;
  flipCard: () => void;
  nextCard: () => void;
  prevCard: () => void;
  resetReviewSession: () => void;

  // API Async Actions
  fetchInitialData: () => Promise<void>;
  fetchDueItems: () => Promise<void>;
  fetchItems: (deckId?: string) => Promise<void>;
  createDeck: (params: { name: string; description?: string; tags?: string[] }) => Promise<boolean>;
  deleteDeck: (deckId: string) => Promise<boolean>;
  enrichWord: (word: string) => Promise<QuickAddEnrichResponse | null>;
  deleteItem: (itemId: string) => Promise<boolean>;
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
    reviewLevel?: ReviewLevel;
  }) => Promise<FlashcardReviewResult | null>;
}

export const useVocabularyStore = create<VocabularyState>((set, get) => ({
  decks: [],
  selectedDeckId: null,
  allItems: [],
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
  activePracticeMode: "flashcard",
  levelFilter: "all",
  troubleWords: [],
  dailyPracticedCount: 0,
  dailyGoalCount: 15,

  incrementDailyPracticed: () => set((state) => ({ dailyPracticedCount: state.dailyPracticedCount + 1 })),
  isDailyFocusMode: false,
  isRandomShuffle: false,
  startDailyPractice: () => {
    set({
      isDailyFocusMode: true,
      isReviewing: true,
      activePracticeMode: "flashcard",
      currentCardIndex: 0,
      lastReviewResult: null,
      isFlipped: false,
    });
  },
  exitDailyPractice: () => {
    set({
      isDailyFocusMode: false,
      currentCardIndex: 0,
      lastReviewResult: null,
      isFlipped: false,
    });
  },
  toggleShuffle: () => {
    set((state) => ({ isRandomShuffle: !state.isRandomShuffle }));
  },

  fetchTroubleWords: async () => {
    try {
      const res = await fetch("/api/vocabulary/trouble-words?limit=10");
      if (res.ok) {
        const data = await res.json();
        set({ troubleWords: data.words || [] });
      }
    } catch {
      // ignore
    }
  },

  startTroubleWordsReview: async () => {
    try {
      const res = await fetch("/api/vocabulary/trouble-words?limit=10");
      if (res.ok) {
        const data = await res.json();
        const troubleItems = (data.words || []) as TroubleWordItem[];
        set({
          troubleWords: troubleItems,
          dueItems: troubleItems.map((tw) => ({
            id: tw.id,
            deckId: "019488a0-7b24-789a-bcde-000000000010",
            userId: "019488a0-7b24-789a-bcde-000000000001",
            word: tw.word,
            ipa: tw.ipa,
            partOfSpeech: "noun",
            definitionVi: tw.definitionVi,
            exampleSentenceEn: `The word "${tw.word}" requires careful pronunciation.`,
            exampleSentenceVi: `Từ "${tw.word}" cần được luyện phát âm cẩn thận.`,
            articulatoryTipVi: "Chú ý đặt đúng vị trí môi, răng và luồng hơi.",
            referenceAudioUrl: tw.audioUrl ?? null,
            sm2Repetition: 0,
            sm2IntervalDays: 1,
            sm2EaseFactorBp: 2500,
            sm2NextReviewAt: new Date().toISOString(),
            sm2LastReviewedAt: null,
            lastMasteryScoreBp: tw.lastMasteryScoreBp,
            isMastered: false,
            masteryAttemptsCount: tw.masteryAttemptsCount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
          currentCardIndex: 0,
          isFlipped: false,
          isReviewing: true,
          activePracticeMode: "flashcard",
        });
      }
    } catch (err) {
      console.error(err);
    }
  },

  updateItemLevelManual: async (itemId, level) => {
    const isMastered = level === "mastered";
    const sm2IntervalDays = level === "mastered" ? 7 : level === "learning" ? 2 : 1;
    const lastMasteryScoreBp = level === "mastered" ? 9000 : level === "learning" ? 6500 : null;

    // Optimistic update for instant UI feedback
    set((state) => {
      const optimisticUpdate = (it: VocabularyItem) =>
        it.id === itemId
          ? {
              ...it,
              isMastered,
              sm2IntervalDays,
              lastMasteryScoreBp,
            }
          : it;

      const newAllItems = state.allItems.map(optimisticUpdate);
      const newItems = state.items.map(optimisticUpdate);
      const newDueItems = state.dueItems.map(optimisticUpdate);
      const masteredCount = newAllItems.filter((it) => it.isMastered).length;

      return {
        allItems: newAllItems,
        items: newItems,
        dueItems: newDueItems,
        metrics: {
          ...state.metrics,
          masteredWordsCount: masteredCount,
        },
      };
    });

    try {
      const res = await fetch(`/api/vocabulary/items/${itemId}/level`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.item as VocabularyItem;
        set((state) => {
          const newAllItems = state.allItems.map((it) => (it.id === itemId ? { ...it, ...updated } : it));
          const newItems = state.items.map((it) => (it.id === itemId ? { ...it, ...updated } : it));
          const newDueItems = state.dueItems.map((it) => (it.id === itemId ? { ...it, ...updated } : it));
          const masteredCount = newAllItems.filter((it) => it.isMastered).length;
          return {
            allItems: newAllItems,
            items: newItems,
            dueItems: newDueItems,
            metrics: {
              ...state.metrics,
              masteredWordsCount: masteredCount,
            },
          };
        });
      }
    } catch (err) {
      console.error(err);
    }
  },

  isQuickAddOpen: false,
  isBatchImportOpen: false,
  isCreateDeckModalOpen: false,
  isLoading: false,
  isEnriching: false,
  isSubmittingReview: false,
  errorMessage: null,

  setSelectedDeckId: (deckId) => {
    set({
      selectedDeckId: deckId,
      items: deckId ? get().allItems.filter((i) => i.deckId === deckId) : get().allItems,
    });
  },

  setActivePracticeMode: (mode) => set({ activePracticeMode: mode }),
  setLevelFilter: (filter) => set({ levelFilter: filter }),
  setQuickAddOpen: (open) => set({ isQuickAddOpen: open }),
  setBatchImportOpen: (open) => set({ isBatchImportOpen: open }),
  setCreateDeckModalOpen: (open) => set({ isCreateDeckModalOpen: open }),
  setIsReviewing: (reviewing) =>
    set({
      isReviewing: reviewing,
      currentCardIndex: 0,
      isFlipped: false,
      lastReviewResult: null,
    }),

  learnItemNow: (itemId) => {
    const { items, dueItems } = get();
    const targetItem = items.find((i) => i.id === itemId) || dueItems.find((i) => i.id === itemId);
    if (!targetItem) return;

    // Filter out item if already in dueItems, then prepend at index 0
    const filteredDue = dueItems.filter((i) => i.id !== itemId);
    set({
      dueItems: [targetItem, ...filteredDue],
      currentCardIndex: 0,
      isReviewing: true,
      activePracticeMode: "flashcard",
      isFlipped: false,
      lastReviewResult: null,
    });
  },

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
      const [decksRes, dueRes, itemsRes] = await Promise.all([
        fetch("/api/vocabulary/decks"),
        fetch("/api/vocabulary/review/due"),
        fetch("/api/vocabulary/items"),
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
      const itemsData = itemsRes.ok ? await itemsRes.json() : { items: [] };

      const decks = (decksData.decks || []) as VocabularyDeck[];
      const allItems = (itemsData.items || []) as VocabularyItem[];
      const selectedDeckId = get().selectedDeckId;

      set({
        decks,
        selectedDeckId,
        allItems,
        items: selectedDeckId ? allItems.filter((i) => i.deckId === selectedDeckId) : allItems,
        dueItems: dueData.dueItems || [],
        metrics: dueData.metrics || get().metrics,
        isLoading: false,
      });
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
      const res = await fetch("/api/vocabulary/items");
      if (res.ok) {
        const data = await res.json();
        const allItems = (data.items || []) as VocabularyItem[];
        const currentSelected = deckId !== undefined ? deckId : get().selectedDeckId;
        set({
          allItems,
          items: currentSelected ? allItems.filter((i) => i.deckId === currentSelected) : allItems,
        });
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

  deleteItem: async (itemId: string) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await fetch(`/api/vocabulary/items?id=${encodeURIComponent(itemId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Lỗi xóa từ vựng");
      }
      const targetItem = get().allItems.find((i) => i.id === itemId);
      const updatedAllItems = get().allItems.filter((i) => i.id !== itemId);
      const currentSelected = get().selectedDeckId;
      const updatedItems = currentSelected
        ? updatedAllItems.filter((i) => i.deckId === currentSelected)
        : updatedAllItems;
      const updatedDueItems = get().dueItems.filter((i) => i.id !== itemId);
      const updatedDecks = get().decks.map((d) => {
        if (targetItem && d.id === targetItem.deckId) {
          return { ...d, itemCount: Math.max(0, d.itemCount - 1) };
        }
        return d;
      });
      set({
        allItems: updatedAllItems,
        items: updatedItems,
        dueItems: updatedDueItems,
        decks: updatedDecks,
        metrics: {
          ...get().metrics,
          totalWords: updatedAllItems.length,
          masteredWordsCount: updatedAllItems.filter((i) => i.isMastered).length,
        },
        isLoading: false,
      });
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      set({ isLoading: false, errorMessage: error.message });
      return false;
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

  createDeck: async (params) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await fetch("/api/vocabulary/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Lỗi tạo bộ từ vựng mới");
      }

      const newDeck = (await res.json()) as VocabularyDeck;
      set({
        isLoading: false,
        isCreateDeckModalOpen: false,
        selectedDeckId: newDeck.id,
      });

      await get().fetchInitialData();
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      set({ isLoading: false, errorMessage: error.message });
      return false;
    }
  },

  deleteDeck: async (deckId: string) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await fetch(`/api/vocabulary/decks?id=${encodeURIComponent(deckId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Lỗi xóa bộ từ");
      }
      const remainingAll = get().allItems.filter((i) => i.deckId !== deckId);
      const currentSelected = get().selectedDeckId === deckId ? null : get().selectedDeckId;
      const remainingDecks = get().decks.filter((d) => d.id !== deckId);
      const remainingDueItems = get().dueItems.filter((i) => i.deckId !== deckId);
      set({
        decks: remainingDecks,
        allItems: remainingAll,
        items: currentSelected ? remainingAll.filter((i) => i.deckId === currentSelected) : remainingAll,
        dueItems: remainingDueItems,
        selectedDeckId: currentSelected,
        metrics: {
          ...get().metrics,
          totalWords: remainingAll.length,
          masteredWordsCount: remainingAll.filter((i) => i.isMastered).length,
        },
        isLoading: false,
      });
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      set({ isLoading: false, errorMessage: error.message });
      return false;
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
        // In-place update so card does not jump or disappear during review
        const isMasteredNow = params.reviewLevel ? params.reviewLevel === "easy" : reviewResult.isPassed;
        const updateItemState = (item: VocabularyItem): VocabularyItem => {
          if (item.id !== params.vocabularyItemId) return item;
          return {
            ...item,
            sm2IntervalDays: reviewResult.intervalDaysAfter,
            sm2Repetition: reviewResult.repetitionCountAfter,
            lastMasteryScoreBp: reviewResult.pronunciationScoreBp,
            isMastered: isMasteredNow,
            masteryAttemptsCount: item.masteryAttemptsCount + 1,
          };
        };

        const currentAllItems = get().allItems;
        const newAllItems = currentAllItems.map(updateItemState);
        const newMasteredCount = newAllItems.filter((i) => i.isMastered).length;

        set((state) => ({
          lastReviewResult: reviewResult,
          dueItems: state.dueItems.map(updateItemState),
          allItems: newAllItems,
          items: state.items.map(updateItemState),
          metrics: {
            ...state.metrics,
            masteredWordsCount: newMasteredCount,
          },
        }));

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
