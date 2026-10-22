/**
 * Application service for Active Vocabulary & 3D Flashcards (FEAT-ACTIVE-VOCABULARY-3D).
 * Orchestrates Free Dictionary API lookup, AI enrichment, Batch Import, and SM-2 Speaking Verification.
 */
import type {
  VocabularyDeck,
  VocabularyItem,
  QuickAddEnrichResponse,
  BatchImportResponse,
  FlashcardReviewResult,
  VocabularyMetrics,
  ListeningQuizQuestion,
  ClozeSpellingQuestion,
  ReviewLevel,
} from "@/core/dto/vocabulary.dto";
import {
  calculateQualityFromScore,
  calculateSm2,
  calculateSm2Level,
  calculateXpFromQuality,
} from "@/core/domain/sm2";
import type { VocabularyRepository } from "@/core/repositories/vocabulary-repository";
import { InMemoryVocabularyRepository } from "@/core/repositories/vocabulary-repository";
import { lookupAcademicDictionary, generateArticulatoryTip } from "./dictionary-data";

// -----------------------------------------------------------------------------
// Fallback Dictionary Database for Offline / Fast Execution
// -----------------------------------------------------------------------------
const LOCAL_FALLBACK_DICTIONARY: Record<
  string,
  {
    ipa: string;
    partOfSpeech: string;
    definitionVi: string;
    exampleSentenceEn: string;
    exampleSentenceVi: string;
    articulatoryTipVi: string;
  }
> = {
  articulation: {
    ipa: "/ɑːˌtɪk.jəˈleɪ.ʃən/",
    partOfSpeech: "noun",
    definitionVi: "Sự phát âm rõ ràng, chuẩn xác các âm vị trong giao tiếp.",
    exampleSentenceEn: "Clear articulation is vital for effective presentations.",
    exampleSentenceVi: "Phát âm rõ ràng là điều tối quan trọng đối với một bài thuyết trình hiệu quả.",
    articulatoryTipVi: "Nâng nhẹ đầu lưỡi chạm ngạc cứng cho âm /l/, mở rộng khẩu hình cho nguyên âm.",
  },
  resilience: {
    ipa: "/rɪˈzɪl.jəns/",
    partOfSpeech: "noun",
    definitionVi: "Khả năng phục hồi kiên cường sau khó khăn, nghịch cảnh.",
    exampleSentenceEn: "Courage and resilience help overcome difficult obstacles.",
    exampleSentenceVi: "Lòng can đảm và sự kiên cường giúp vượt qua các trở ngại gian nan.",
    articulatoryTipVi: "Rung dây thanh âm cho phụ âm /z/, đầu lưỡi nâng chạm gờ nướu.",
  },
  eloquent: {
    ipa: "/ˈel.ə.kwənt/",
    partOfSpeech: "adjective",
    definitionVi: "Có tài hùng biện, diễn đạt lưu loát và đầy sức thuyết phục.",
    exampleSentenceEn: "She gave an eloquent speech that moved the entire audience.",
    exampleSentenceVi: "Cô ấy đã có một bài phát biểu hùng biện lay động toàn bộ khán giả.",
    articulatoryTipVi: "Chu tròn môi chuẩn bị cho âm /w/, hạ hàm tự nhiên cho nguyên âm đầu /e/.",
  },
  ubiquitous: {
    ipa: "/juːˈbɪk.wɪ.təs/",
    partOfSpeech: "adjective",
    definitionVi: "Có mặt ở khắp mọi nơi, phổ biến cùng lúc.",
    exampleSentenceEn: "Smartphones have become ubiquitous in modern society.",
    exampleSentenceVi: "Điện thoại thông minh đã trở nên phổ biến ở khắp mọi nơi trong xã hội hiện đại.",
    articulatoryTipVi: "Bắt đầu với bán nguyên âm /j/, kéo dài âm /uː/ rồi bật nhanh tổ hợp /kw/.",
  },
  meticulous: {
    ipa: "/məˈtɪk.jə.ləs/",
    partOfSpeech: "adjective",
    definitionVi: "Tỉ mỉ, cẩn thận, chăm chút đến từng chi tiết nhỏ.",
    exampleSentenceEn: "He was meticulous about keeping his laboratory notes accurate.",
    exampleSentenceVi: "Anh ấy rất tỉ mỉ trong việc giữ cho các ghi chép phòng thí nghiệm chính xác.",
    articulatoryTipVi: "Bật dứt khoát âm /t/ sau nguyên âm lướt /ə/, đầu lưỡi gõ nhẹ vào nướu răng trên.",
  },
};

// -----------------------------------------------------------------------------
// Application Service Dependencies
// -----------------------------------------------------------------------------
export interface VocabularyServiceDependencies {
  vocabRepo: VocabularyRepository;
  defaultUserId: string;
}

let globalVocabDeps: VocabularyServiceDependencies = {
  vocabRepo: new InMemoryVocabularyRepository(),
  defaultUserId: "019488a0-7b24-789a-bcde-000000000001",
};

export function setVocabularyDependencies(deps: Partial<VocabularyServiceDependencies>) {
  globalVocabDeps = { ...globalVocabDeps, ...deps };
}

export function getVocabularyDependencies(): VocabularyServiceDependencies {
  return globalVocabDeps;
}

// -----------------------------------------------------------------------------
// Core Vocabulary Application Service
// -----------------------------------------------------------------------------
export class VocabularyService {
  constructor(
    private readonly vocabRepo: VocabularyRepository = globalVocabDeps.vocabRepo,
    private readonly defaultUserId: string = globalVocabDeps.defaultUserId,
  ) {}

  /**
   * Smart Quick-Add Importer (1-Touch Enrichment).
   * Queries Free Dictionary API and merges with AI pedagogical Vietnamese translation & 3D tips.
   */
  async enrichWord(rawWord: string): Promise<QuickAddEnrichResponse> {
    const word = rawWord.trim().toLowerCase();
    if (!word) {
      throw new Error("Word cannot be empty");
    }

    // 1. Check comprehensive academic dictionary first
    const academicEntry = lookupAcademicDictionary(word);
    const cached = academicEntry || LOCAL_FALLBACK_DICTIONARY[word];

    let phonetic = cached?.ipa ? (cached.ipa.startsWith("/") ? cached.ipa : `/${cached.ipa}/`) : "";
    let partOfSpeech = cached?.partOfSpeech || "noun";
    let definitionVi = cached?.definitionVi || "";
    let exampleEn = cached?.exampleSentenceEn || "";
    let exampleVi = cached?.exampleSentenceVi || "";
    let tipVi = cached?.articulatoryTipVi || "";
    let audioUrl: string | null = null;

    // 2. Fetch Free Dictionary API for native pronunciation audio and extra definitions
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const entry = data[0];
          if (!phonetic) {
            const apiPhonetic = entry.phonetic || entry.phonetics?.find((p: { text?: string }) => p.text)?.text;
            if (apiPhonetic) {
              phonetic = apiPhonetic.startsWith("/") ? apiPhonetic : `/${apiPhonetic}/`;
            }
          }

          // Prioritize British RP (UK) audio if available, falling back to any valid audio
          const ukAudioEntry = entry.phonetics?.find(
            (p: { audio?: string }) => p.audio && (p.audio.includes("-uk") || p.audio.includes("/uk/"))
          );
          const audioEntry = ukAudioEntry || entry.phonetics?.find((p: { audio?: string }) => p.audio && p.audio.length > 0);
          if (audioEntry?.audio) {
            audioUrl = audioEntry.audio;
          }

          if (entry.meanings && entry.meanings.length > 0) {
            const primaryMeaning = entry.meanings[0];
            if (!partOfSpeech || partOfSpeech === "noun") {
              partOfSpeech = primaryMeaning.partOfSpeech || partOfSpeech;
            }

            const def = primaryMeaning.definitions?.[0];
            if (def?.definition && !definitionVi) {
              definitionVi = `${def.definition} (Định nghĩa ngữ cảnh: ${word})`;
            }
            if (def?.example && !exampleEn) {
              exampleEn = def.example;
              exampleVi = `Ví dụ sử dụng từ "${word}" trong giao tiếp thực tế.`;
            }
          }
        }
      }
    } catch {
      // Free Dictionary API timeout or offline - gracefully proceed
    }

    // 3. Fallback / Heuristics if dictionary was incomplete
    if (!phonetic) {
      phonetic = `/${word}/`;
    }
    if (!definitionVi) {
      definitionVi = `Từ vựng "${word}" (${partOfSpeech}): Sử dụng trong văn cảnh giao tiếp và học thuật.`;
    }
    if (!exampleEn) {
      exampleEn = `We practiced pronouncing the word "${word}" accurately in daily conversation.`;
      exampleVi = `Chúng tôi đã luyện tập phát âm chuẩn xác từ "${word}" trong giao tiếp hằng ngày.`;
    }
    if (!tipVi) {
      tipVi = generateArticulatoryTip(word, phonetic);
    }

    return {
      word,
      ipa: phonetic,
      partOfSpeech,
      definitionVi,
      exampleSentenceEn: exampleEn,
      exampleSentenceVi: exampleVi,
      articulatoryTipVi: tipVi,
      referenceAudioUrl: audioUrl,
    };
  }

  /**
   * Batch Multi-Word Importer.
   * Splits up to 20 words from text blob, dedupes, enriches, and stores in the chosen deck.
   */
  async batchImport(params: {
    deckId: string;
    rawText: string;
    userId?: string;
  }): Promise<BatchImportResponse> {
    const userId = params.userId ?? this.defaultUserId;
    const { deckId, rawText } = params;

    // Split words by commas, newlines, semicolons, or numbered list bullets (e.g. "1. apple, 2. banana")
    const rawTokens = rawText
      .split(/[\r\n,;]+|\b\d+[\.\)]\s*/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0 && /^[a-z\s-]+$/i.test(t));

    // Deduplicate
    const uniqueTokens = Array.from(new Set(rawTokens)).slice(0, 20);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const token of uniqueTokens) {
      try {
        const enriched = await this.enrichWord(token);
        const item = await this.vocabRepo.createItem({
          deckId,
          userId,
          word: enriched.word,
          ipa: enriched.ipa,
          partOfSpeech: enriched.partOfSpeech,
          definitionVi: enriched.definitionVi,
          exampleSentenceEn: enriched.exampleSentenceEn,
          exampleSentenceVi: enriched.exampleSentenceVi,
          articulatoryTipVi: enriched.articulatoryTipVi,
          referenceAudioUrl: enriched.referenceAudioUrl,
        });

        results.push({
          word: token,
          status: "success" as const,
          item,
          errorMessage: null,
        });
        successCount++;
      } catch (err: unknown) {
        const error = err as Error;
        results.push({
          word: token,
          status: "error" as const,
          item: null,
          errorMessage: error.message || "Failed to enrich word",
        });
        errorCount++;
      }
    }

    return {
      totalProcessed: uniqueTokens.length,
      successCount,
      errorCount,
      results,
    };
  }

  /**
   * Speaking-Verified Flashcard Review Execution.
   * Enforces 3-Level Anki Transitions or score-based threshold (score >= 8000 bp).
   */
  async submitSpeakingReview(params: {
    vocabularyItemId: string;
    idempotencyKey: string;
    pronunciationScoreBp: number;
    audioDurationMs: number;
    reviewLevel?: ReviewLevel;
    userId?: string;
  }): Promise<FlashcardReviewResult> {
    const userId = params.userId ?? this.defaultUserId;
    const { vocabularyItemId, idempotencyKey, pronunciationScoreBp, reviewLevel } = params;

    const item = await this.vocabRepo.findItemById(vocabularyItemId);
    if (!item) {
      throw new Error(`Vocabulary item not found: ${vocabularyItemId}`);
    }

    let isPassed: boolean;
    let qualityGrade: number;
    let repetitionCountAfter: number;
    let intervalDaysAfter: number;
    let easeFactorAfterBp: number;
    let nextReviewDate: Date;
    let xpAwarded: bigint;
    let feedbackVi: string;
    let masteryLevel: 1 | 2 | 3;

    if (reviewLevel) {
      // User explicitly selected 3-Level Anki button: Again (Level 1) | Good (Level 2) | Easy (Level 3)
      const levelRes = calculateSm2Level({
        level: reviewLevel,
        repetitionCount: item.sm2Repetition,
        intervalDays: item.sm2IntervalDays,
        easeFactorBp: item.sm2EaseFactorBp,
      });

      isPassed = levelRes.isPassed;
      qualityGrade = reviewLevel === "again" ? 2 : reviewLevel === "easy" ? 5 : 4;
      repetitionCountAfter = levelRes.repetitionCount;
      intervalDaysAfter = levelRes.intervalDays;
      easeFactorAfterBp = levelRes.easeFactorBp;
      nextReviewDate = levelRes.nextReviewDate;
      xpAwarded = BigInt(levelRes.xpAwarded);
      feedbackVi = levelRes.feedbackVi;
      masteryLevel = levelRes.levelNumber;
    } else {
      // Automated SM-2 grade calculation from pronunciation score
      qualityGrade = calculateQualityFromScore(pronunciationScoreBp);
      const sm2Result = calculateSm2({
        qualityGrade,
        repetitionCount: item.sm2Repetition,
        intervalDays: item.sm2IntervalDays,
        easeFactorBp: item.sm2EaseFactorBp,
      });

      isPassed = sm2Result.isPassed;
      repetitionCountAfter = sm2Result.repetitionCount;
      intervalDaysAfter = sm2Result.intervalDays;
      easeFactorAfterBp = sm2Result.easeFactorBp;
      nextReviewDate = sm2Result.nextReviewDate;
      xpAwarded = calculateXpFromQuality(qualityGrade);
      masteryLevel = pronunciationScoreBp >= 9000 ? 3 : pronunciationScoreBp >= 8000 ? 2 : 1;

      feedbackVi = isPassed
        ? `Phát âm chuẩn xác (${Math.round(pronunciationScoreBp / 100)}/100)! Thẻ đã được công nhận ghi nhớ và tăng khoảng cách ôn tập lên ${intervalDaysAfter} ngày (+${xpAwarded} XP).`
        : `Phát âm chưa đạt (${Math.round(pronunciationScoreBp / 100)}/100 < 80). Thẻ cần được luyện nói lại vào ngày mai để đảm bảo phản xạ nói chuẩn xác.`;
    }

    // 2. Prepare transaction record
    const updatedItemProps: Partial<VocabularyItem> & { id: string } = {
      id: item.id,
      sm2Repetition: repetitionCountAfter,
      sm2IntervalDays: intervalDaysAfter,
      sm2EaseFactorBp: easeFactorAfterBp,
      sm2NextReviewAt: nextReviewDate.toISOString(),
      sm2LastReviewedAt: new Date().toISOString(),
      lastMasteryScoreBp: pronunciationScoreBp,
      isMastered: isPassed ? true : item.isMastered,
      masteryAttemptsCount: item.masteryAttemptsCount + 1,
    };

    const reviewRecord = {
      vocabularyItemId: item.id,
      userId,
      idempotencyKey,
      qualityGrade,
      pronunciationScoreBp,
      isPassed,
      intervalDaysBefore: item.sm2IntervalDays,
      intervalDaysAfter,
      easeFactorBeforeBp: item.sm2EaseFactorBp,
      easeFactorAfterBp,
      xpAwarded,
    };

    const txResult = await this.vocabRepo.saveFlashcardReviewTransaction({
      review: reviewRecord,
      updatedItem: updatedItemProps,
    });

    return {
      reviewId: txResult.reviewId,
      vocabularyItemId: item.id,
      qualityGrade,
      pronunciationScoreBp,
      isPassed,
      repetitionCountAfter,
      intervalDaysAfter,
      easeFactorAfterBp,
      nextReviewAt: nextReviewDate.toISOString(),
      xpAwarded: Number(xpAwarded),
      feedbackVi,
      masteryLevel,
    };
  }

  async createDeck(params: {
    name: string;
    description?: string | null;
    tags?: string[];
    isDefault?: boolean;
    userId?: string;
  }): Promise<VocabularyDeck> {
    const userId = params.userId ?? this.defaultUserId;
    return this.vocabRepo.createDeck({
      userId,
      name: params.name,
      description: params.description ?? null,
      tags: params.tags ?? [],
      isDefault: params.isDefault ?? false,
    });
  }

  /**
   * Generates Listening Multiple-Choice Quiz Questions for a Deck.
   */
  async getListeningQuiz(deckId?: string, limit: number = 5): Promise<ListeningQuizQuestion[]> {
    const items = await this.getItems(deckId);
    if (items.length === 0) {
      return [];
    }

    // Shuffle items
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, limit);

    return selected.map((item) => {
      // Pick 3 distractor words from other items, or generate fallback distractors
      const otherWords = items
        .filter((i) => i.id !== item.id)
        .map((i) => i.word)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const fallbackPool = ["fluent", "articulation", "confidence", "resilience", "eloquent", "ubiquitous"];
      while (otherWords.length < 3) {
        const candidate = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
        if (candidate && candidate !== item.word && !otherWords.includes(candidate)) {
          otherWords.push(candidate);
        }
      }

      const options = [item.word, ...otherWords].sort(() => 0.5 - Math.random());

      return {
        id: crypto.randomUUID(),
        targetWord: item.word,
        ipa: item.ipa,
        audioUrl: item.referenceAudioUrl,
        definitionVi: item.definitionVi,
        options,
        correctAnswer: item.word,
      };
    });
  }

  /**
   * Generates Fill-in-the-Blank Cloze Spelling Questions for a Deck.
   */
  async getClozeSpellingQuiz(deckId?: string, limit: number = 5): Promise<ClozeSpellingQuestion[]> {
    const items = await this.getItems(deckId);
    if (items.length === 0) {
      return [];
    }

    const shuffled = [...items].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, limit);

    return selected.map((item) => {
      // Replace target word in exampleSentenceEn with '_____'
      const regex = new RegExp(`\\b${item.word}\\b`, "gi");
      let sentenceWithBlank = item.exampleSentenceEn.replace(regex, "_____");

      if (!sentenceWithBlank.includes("_____")) {
        // If word wasn't matched directly, append blank placeholder
        sentenceWithBlank = `Fill in the blank: [ _____ ] - ${item.exampleSentenceEn}`;
      }

      return {
        id: crypto.randomUUID(),
        targetWord: item.word,
        sentenceWithBlank,
        sentenceVi: item.exampleSentenceVi,
        hintIpa: item.ipa,
        hintDefinitionVi: item.definitionVi,
        audioUrl: item.referenceAudioUrl ?? null,
      };
    });
  }

  async getDecks(userId?: string): Promise<VocabularyDeck[]> {
    return this.vocabRepo.findDecksByUserId(userId ?? this.defaultUserId);
  }

  async getItems(deckId?: string, userId?: string): Promise<VocabularyItem[]> {
    const uid = userId ?? this.defaultUserId;
    if (deckId) {
      return this.vocabRepo.findItemsByDeckId(deckId);
    }
    return this.vocabRepo.findItemsByUserId(uid);
  }

  async getDueCards(userId?: string): Promise<VocabularyItem[]> {
    return this.vocabRepo.findDueReviewItems(userId ?? this.defaultUserId);
  }

  async getMetrics(userId?: string): Promise<VocabularyMetrics> {
    return this.vocabRepo.getMetrics(userId ?? this.defaultUserId);
  }
}
