import fs from "node:fs";
import path from "node:path";
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
  deleteDeck(deckId: string, userId: string): Promise<boolean>;

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
  findTroubleWords(userId: string, limit?: number): Promise<VocabularyItem[]>;
  updateItemLevel(itemId: string, level: "new" | "learning" | "mastered"): Promise<VocabularyItem>;
  deleteItem(itemId: string, userId: string): Promise<boolean>;
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
    const loaded = this.loadFromDisk();
    if (!loaded) {
      this.seedDefaultDeck();
      this.persistToDisk();
    }
  }

  private isTestEnv(): boolean {
    return process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
  }

  private getStoreFilePath(): string {
    return path.join(process.cwd(), "database", "local_vocab_store.json");
  }

  private loadFromDisk(): boolean {
    if (this.isTestEnv()) return false;
    try {
      const filePath = this.getStoreFilePath();
      if (!fs.existsSync(filePath)) return false;
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data.decks)) {
        for (const d of data.decks) {
          this.decks.set(d.id, d);
        }
      }
      if (Array.isArray(data.items)) {
        for (const it of data.items) {
          this.items.set(it.id, it);
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  private persistToDisk(): void {
    if (this.isTestEnv()) return;
    try {
      const filePath = this.getStoreFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const payload = {
        decks: Array.from(this.decks.values()),
        items: Array.from(this.items.values()),
      };
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
    } catch {
      // Ignore in read-only / mock environment
    }
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

    const defaultDecks: VocabularyDeck[] = [
      {
        id: "019488a0-7b24-789a-bcde-000000000011",
        userId: defaultUserId,
        name: "Từ mới",
        description: "Các từ vựng mới tiếp nhận, chờ luyện phát âm",
        tags: ["Mới"],
        isDefault: true,
        itemCount: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "019488a0-7b24-789a-bcde-000000000012",
        userId: defaultUserId,
        name: "Đang học",
        description: "Các từ vựng đang trong chu kỳ lặp lại ngắt quãng SM-2",
        tags: ["Đang học"],
        isDefault: false,
        itemCount: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "019488a0-7b24-789a-bcde-000000000013",
        userId: defaultUserId,
        name: "Đã thuộc",
        description: "Các từ vựng đã phát âm chuẩn >= 80%",
        tags: ["Đã thuộc"],
        isDefault: false,
        itemCount: 1,
        createdAt: now,
        updatedAt: now,
      },
    ];
    for (const d of defaultDecks) {
      this.decks.set(d.id, d);
    }

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
    const itemNew: VocabularyItem = {
      id: "019488a0-7b24-789a-bcde-000000000023",
      deckId: "019488a0-7b24-789a-bcde-000000000011",
      userId: defaultUserId,
      word: "fluency",
      ipa: "/ˈfluː.ən.si/",
      partOfSpeech: "noun",
      definitionVi: "Khả năng nói hoặc viết một ngôn ngữ một cách trôi chảy, lưu loát.",
      exampleSentenceEn: "She speaks with great fluency.",
      exampleSentenceVi: "Cô ấy nói chuyện rất lưu loát.",
      articulatoryTipVi: "Mở tròn môi cho phụ âm /fl/ và kéo dài âm /uː/ vừa phải.",
      referenceAudioUrl: null,
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

    const itemLearning: VocabularyItem = {
      id: "019488a0-7b24-789a-bcde-000000000024",
      deckId: "019488a0-7b24-789a-bcde-000000000012",
      userId: defaultUserId,
      word: "intonation",
      ipa: "/ˌɪn.təˈneɪ.ʃən/",
      partOfSpeech: "noun",
      definitionVi: "Ngữ điệu trầm bổng của giọng nói khi phát âm câu từ.",
      exampleSentenceEn: "Pay attention to English intonation.",
      exampleSentenceVi: "Hãy chú ý đến ngữ điệu tiếng Anh.",
      articulatoryTipVi: "Hạ cao độ ở cuối câu trần thuật và nâng cao độ ở câu hỏi yes/no.",
      referenceAudioUrl: null,
      sm2Repetition: 1,
      sm2IntervalDays: 2,
      sm2EaseFactorBp: SM2_DEFAULT_EASE_FACTOR_BP,
      sm2NextReviewAt: now,
      sm2LastReviewedAt: now,
      lastMasteryScoreBp: 6500,
      isMastered: false,
      masteryAttemptsCount: 1,
      createdAt: now,
      updatedAt: now,
    };

    const itemMastered: VocabularyItem = {
      id: "019488a0-7b24-789a-bcde-000000000025",
      deckId: "019488a0-7b24-789a-bcde-000000000013",
      userId: defaultUserId,
      word: "rhythm",
      ipa: "/ˈrɪð.əm/",
      partOfSpeech: "noun",
      definitionVi: "Nhịp điệu đều đặn nhịp nhàng trong chuỗi lời nói.",
      exampleSentenceEn: "English has a stress-timed rhythm.",
      exampleSentenceVi: "Tiếng Anh có nhịp điệu theo trọng âm.",
      articulatoryTipVi: "Đặt đầu lưỡi giữa hai hàm răng nhẹ nhàng cho âm /ð/.",
      referenceAudioUrl: null,
      sm2Repetition: 3,
      sm2IntervalDays: 7,
      sm2EaseFactorBp: SM2_DEFAULT_EASE_FACTOR_BP,
      sm2NextReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      sm2LastReviewedAt: now,
      lastMasteryScoreBp: 9200,
      isMastered: true,
      masteryAttemptsCount: 2,
      createdAt: now,
      updatedAt: now,
    };

    this.items.set(itemNew.id, itemNew);
    this.items.set(itemLearning.id, itemLearning);
    this.items.set(itemMastered.id, itemMastered);

  }

  async findDecksByUserId(userId: string): Promise<VocabularyDeck[]> {
    const userDecks = Array.from(this.decks.values()).filter((d) => d.userId === userId);
    return userDecks.map((deck) => {
      const count = Array.from(this.items.values()).filter(
        (item) => item.deckId === deck.id && item.userId === userId
      ).length;
      return {
        ...deck,
        itemCount: count,
      };
    });
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
    this.persistToDisk();
    return deck;
  }

  async deleteDeck(deckId: string, userId: string): Promise<boolean> {
    const deck = this.decks.get(deckId);
    if (!deck || deck.userId !== userId) {
      return false;
    }
    this.decks.delete(deckId);
    // Cascade delete all items in this deck
    for (const [id, item] of Array.from(this.items.entries())) {
      if (item.deckId === deckId && item.userId === userId) {
        this.items.delete(id);
      }
    }
    this.persistToDisk();
    return true;
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
    const normalizedWord = data.word.trim().toLowerCase();
    const normalizedPos = (data.partOfSpeech ?? "noun").trim().toLowerCase();

    for (const existing of this.items.values()) {
      if (
        existing.userId === data.userId &&
        existing.word.trim().toLowerCase() === normalizedWord &&
        existing.partOfSpeech.trim().toLowerCase() === normalizedPos
      ) {
        throw new Error(`Từ "${data.word}" (${normalizedPos}) đã tồn tại trong danh sách từ vựng của bạn.`);
      }
    }

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

    this.persistToDisk();
    return item;
  }

  async deleteItem(itemId: string, userId: string): Promise<boolean> {
    const item = this.items.get(itemId);
    if (!item || item.userId !== userId) {
      return false;
    }
    this.items.delete(itemId);
    const deck = this.decks.get(item.deckId);
    if (deck && deck.itemCount > 0) {
      deck.itemCount -= 1;
    }
    this.persistToDisk();
    return true;
  }

  async findTroubleWords(userId: string, limit: number = 10): Promise<VocabularyItem[]> {
    const userItems = await this.findItemsByUserId(userId);
    const sorted = [...userItems].sort((a, b) => {
      const scoreA = a.lastMasteryScoreBp ?? 0;
      const scoreB = b.lastMasteryScoreBp ?? 0;
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      return b.masteryAttemptsCount - a.masteryAttemptsCount;
    });
    return sorted.slice(0, limit);
  }

  async updateItemLevel(itemId: string, level: "new" | "learning" | "mastered"): Promise<VocabularyItem> {
    const item = this.items.get(itemId);
    if (!item) {
      throw new Error(`Vocabulary item not found: ${itemId}`);
    }
    const now = new Date().toISOString();
    if (level === "new") {
      item.isMastered = false;
      item.sm2Repetition = 0;
      item.sm2IntervalDays = 1;
      item.lastMasteryScoreBp = null;
    } else if (level === "learning") {
      item.isMastered = false;
      item.sm2Repetition = 1;
      item.sm2IntervalDays = 2;
      item.lastMasteryScoreBp = 6500;
    } else {
      item.isMastered = true;
      item.sm2Repetition = 3;
      item.sm2IntervalDays = 7;
      item.lastMasteryScoreBp = 9000;
    }
    item.updatedAt = now;
    this.persistToDisk();
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

    this.persistToDisk();
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
