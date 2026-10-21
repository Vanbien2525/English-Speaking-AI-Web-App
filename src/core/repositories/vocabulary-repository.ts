/**
 * Repository layer for Active Vocabulary & 3D Flashcards (FEAT-ACTIVE-VOCABULARY-3D).
 * Provides isolated data access with ACID row-locking transactions and In-Memory test double.
 */
import type {
  VocabularyDeck,
  VocabularyItem,
  VocabularyMetrics,
} from "@/core/dto/vocabulary.dto";
import { SM2_DEFAULT_EASE_FACTOR_BP } from "@/core/domain/sm2";

export interface FlashcardReviewRecord {
  id?: string;
  vocabularyItemId: string;
  userId: string;
  idempotencyKey: string;
  qualityGrade: number;
  pronunciationScoreBp: number;
  isPassed: boolean;
  intervalDaysBefore: number;
  intervalDaysAfter: number;
  easeFactorBeforeBp: number;
  easeFactorAfterBp: number;
  xpAwarded: bigint;
  reviewedAt?: string;
}

export interface VocabularyRepository {
  findDecksByUserId(userId: string): Promise<VocabularyDeck[]>;
  findDeckById(deckId: string): Promise<VocabularyDeck | null>;
  createDeck(data: {
    userId: string;
    name: string;
    description?: string | null;
    tags?: string[];
    isDefault?: boolean;
  }): Promise<VocabularyDeck>;

  findItemsByDeckId(deckId: string): Promise<VocabularyItem[]>;
  findItemsByUserId(userId: string): Promise<VocabularyItem[]>;
  findItemById(itemId: string): Promise<VocabularyItem | null>;
  createItem(data: {
    deckId: string;
    userId: string;
    word: string;
    ipa: string;
    partOfSpeech?: string;
    definitionVi: string;
    exampleSentenceEn: string;
    exampleSentenceVi: string;
    articulatoryTipVi?: string | null;
    referenceAudioUrl?: string | null;
  }): Promise<VocabularyItem>;

  findDueReviewItems(userId: string, beforeDate?: Date): Promise<VocabularyItem[]>;
  saveFlashcardReviewTransaction(params: {
    review: FlashcardReviewRecord;
    updatedItem: Partial<VocabularyItem> & { id: string };
  }): Promise<{ reviewId: string; isIdempotentHit: boolean }>;

  getMetrics(userId: string): Promise<VocabularyMetrics>;
  getXpLedger(userId: string): Promise<Array<{ id: string; userId: string; amount: bigint; balanceAfter: bigint; source: string; idempotencyKey: string }>>;
  seedUserStats?(userId: string, totalXp: bigint): void;
}

/**
 * In-Memory Test Double implementation for lightning-fast deterministic testing.
 */
export class InMemoryVocabularyRepository implements VocabularyRepository {
  private decks: Map<string, VocabularyDeck> = new Map();
  private items: Map<string, VocabularyItem> = new Map();
  private reviews: Map<string, FlashcardReviewRecord> = new Map();
  private idempotencyKeys: Set<string> = new Set();
  private userStats: Map<string, { totalXp: bigint }> = new Map();
  private xpLedger: Array<{ id: string; userId: string; amount: bigint; balanceAfter: bigint; source: string; idempotencyKey: string }> = [];

  constructor() {
    this.seedDefaultDeck();
  }

  seedUserStats(userId: string, totalXp: bigint): void {
    this.userStats.set(userId, { totalXp });
  }

  private seedDefaultDeck() {
    const defaultDeckId = "019488a0-7b24-789a-bcde-000000000010";
    const defaultUserId = "019488a0-7b24-789a-bcde-000000000001";
    const now = new Date().toISOString();

    const deck: VocabularyDeck = {
      id: defaultDeckId,
      userId: defaultUserId,
      name: "IELTS Core Speaking Mastery",
      description: "Bộ từ vựng phản xạ nói chuyên sâu phục vụ mục tiêu Band 7.5+",
      tags: ["IELTS", "Speaking", "C1"],
      isDefault: true,
      itemCount: 2,
      createdAt: now,
      updatedAt: now,
    };
    this.decks.set(deck.id, deck);

    const item1: VocabularyItem = {
      id: "019488a0-7b24-789a-bcde-000000000021",
      deckId: defaultDeckId,
      userId: defaultUserId,
      word: "articulation",
      ipa: "/ɑːˌtɪk.jəˈleɪ.ʃən/",
      partOfSpeech: "noun",
      definitionVi: "Khả năng phát âm rõ ràng, chuẩn xác các âm vị trong giao tiếp.",
      exampleSentenceEn: "Good articulation is essential for an effective presenter.",
      exampleSentenceVi: "Phát âm rõ ràng là điều tối quan trọng đối với một diễn giả hiệu quả.",
      articulatoryTipVi: "Nâng nhẹ đầu lưỡi chạm ngạc cứng cho âm /l/, mở rộng khẩu hình cho nguyên âm.",
      referenceAudioUrl: "/audio/samples/articulation.mp3",
      sm2Repetition: 0,
      sm2IntervalDays: 1,
      sm2EaseFactorBp: SM2_DEFAULT_EASE_FACTOR_BP,
      sm2NextReviewAt: now,
      sm2LastReviewedAt: null,
      lastMasteryScoreBp: null,
      isMastered: false,
      masteryAttemptsCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const item2: VocabularyItem = {
      id: "019488a0-7b24-789a-bcde-000000000022",
      deckId: defaultDeckId,
      userId: defaultUserId,
      word: "resilience",
      ipa: "/rɪˈzɪl.jəns/",
      partOfSpeech: "noun",
      definitionVi: "Khả năng phục hồi kiên cường sau khó khăn, nghịch cảnh.",
      exampleSentenceEn: "Courage and resilience help overcome difficult obstacles.",
      exampleSentenceVi: "Lòng can đảm và sự kiên cường giúp vượt qua các trở ngại gian nan.",
      articulatoryTipVi: "Rung dây thanh âm cho phụ âm /z/, đầu lưỡi nâng chạm gờ nướu.",
      referenceAudioUrl: "/audio/samples/resilience.mp3",
      sm2Repetition: 1,
      sm2IntervalDays: 6,
      sm2EaseFactorBp: SM2_DEFAULT_EASE_FACTOR_BP,
      sm2NextReviewAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      sm2LastReviewedAt: now,
      lastMasteryScoreBp: 8800,
      isMastered: true,
      masteryAttemptsCount: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.items.set(item1.id, item1);
    this.items.set(item2.id, item2);
  }

  async findDecksByUserId(userId: string): Promise<VocabularyDeck[]> {
    return Array.from(this.decks.values()).filter((d) => d.userId === userId);
  }

  async findDeckById(deckId: string): Promise<VocabularyDeck | null> {
    return this.decks.get(deckId) ?? null;
  }

  async createDeck(data: {
    userId: string;
    name: string;
    description?: string | null;
    tags?: string[];
    isDefault?: boolean;
  }): Promise<VocabularyDeck> {
    const now = new Date().toISOString();
    const deck: VocabularyDeck = {
      id: crypto.randomUUID(),
      userId: data.userId,
      name: data.name,
      description: data.description ?? null,
      tags: data.tags ?? [],
      isDefault: data.isDefault ?? false,
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.decks.set(deck.id, deck);
    return deck;
  }

  async findItemsByDeckId(deckId: string): Promise<VocabularyItem[]> {
    return Array.from(this.items.values()).filter((item) => item.deckId === deckId);
  }

  async findItemsByUserId(userId: string): Promise<VocabularyItem[]> {
    return Array.from(this.items.values()).filter((item) => item.userId === userId);
  }

  async findItemById(itemId: string): Promise<VocabularyItem | null> {
    return this.items.get(itemId) ?? null;
  }

  async createItem(data: {
    deckId: string;
    userId: string;
    word: string;
    ipa: string;
    partOfSpeech?: string;
    definitionVi: string;
    exampleSentenceEn: string;
    exampleSentenceVi: string;
    articulatoryTipVi?: string | null;
    referenceAudioUrl?: string | null;
  }): Promise<VocabularyItem> {
    const now = new Date().toISOString();
    const item: VocabularyItem = {
      id: crypto.randomUUID(),
      deckId: data.deckId,
      userId: data.userId,
      word: data.word,
      ipa: data.ipa,
      partOfSpeech: data.partOfSpeech ?? "noun",
      definitionVi: data.definitionVi,
      exampleSentenceEn: data.exampleSentenceEn,
      exampleSentenceVi: data.exampleSentenceVi,
      articulatoryTipVi: data.articulatoryTipVi ?? null,
      referenceAudioUrl: data.referenceAudioUrl ?? null,
      sm2Repetition: 0,
      sm2IntervalDays: 1,
      sm2EaseFactorBp: SM2_DEFAULT_EASE_FACTOR_BP,
      sm2NextReviewAt: now,
      sm2LastReviewedAt: null,
      lastMasteryScoreBp: null,
      isMastered: false,
      masteryAttemptsCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.items.set(item.id, item);

    // Update deck item count
    const deck = this.decks.get(data.deckId);
    if (deck) {
      deck.itemCount += 1;
      deck.updatedAt = now;
    }

    return item;
  }

  async findDueReviewItems(userId: string, beforeDate: Date = new Date()): Promise<VocabularyItem[]> {
    const targetTime = beforeDate.getTime();
    return Array.from(this.items.values()).filter((item) => {
      if (item.userId !== userId) return false;
      const reviewTime = new Date(item.sm2NextReviewAt).getTime();
      return reviewTime <= targetTime;
    });
  }

  async saveFlashcardReviewTransaction(params: {
    review: FlashcardReviewRecord;
    updatedItem: Partial<VocabularyItem> & { id: string };
  }): Promise<{ reviewId: string; isIdempotentHit: boolean }> {
    const { review, updatedItem } = params;
    const key = `${review.userId}:${review.idempotencyKey}`;

    if (this.idempotencyKeys.has(key)) {
      return { reviewId: review.id ?? crypto.randomUUID(), isIdempotentHit: true };
    }

    const item = this.items.get(updatedItem.id);
    if (!item) {
      throw new Error(`VocabularyItem not found: ${updatedItem.id}`);
    }

    // Apply SM-2 update to item
    Object.assign(item, updatedItem, { updatedAt: new Date().toISOString() });

    const reviewId = crypto.randomUUID();
    const storedReview: FlashcardReviewRecord = {
      ...review,
      id: reviewId,
      reviewedAt: new Date().toISOString(),
    };

    this.reviews.set(reviewId, storedReview);
    this.idempotencyKeys.add(key);

    // If review awarded XP, atomically record in ledger
    if (review.xpAwarded > 0n) {
      const stats = this.userStats.get(review.userId) ?? { totalXp: 0n };
      const newTotal = stats.totalXp + review.xpAwarded;
      this.userStats.set(review.userId, { totalXp: newTotal });

      this.xpLedger.push({
        id: crypto.randomUUID(),
        userId: review.userId,
        amount: review.xpAwarded,
        balanceAfter: newTotal,
        source: "flashcard_mastery",
        idempotencyKey: `review:${review.idempotencyKey}`,
      });
    }

    return { reviewId, isIdempotentHit: false };
  }

  async getXpLedger(userId: string) {
    return this.xpLedger.filter((entry) => entry.userId === userId);
  }

  async getMetrics(userId: string): Promise<VocabularyMetrics> {
    const userItems = await this.findItemsByUserId(userId);
    const now = new Date();
    const totalWords = userItems.length;
    const dueCardsCount = userItems.filter(
      (item) => new Date(item.sm2NextReviewAt).getTime() <= now.getTime()
    ).length;
    const masteredWordsCount = userItems.filter((item) => item.isMastered).length;
    const retentionRateBp =
      totalWords > 0 ? Math.round((masteredWordsCount / totalWords) * 10000) : 0;

    return {
      totalWords,
      dueCardsCount,
      masteredWordsCount,
      retentionRateBp,
    };
  }
}
