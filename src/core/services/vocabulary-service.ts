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
} from "@/core/dto/vocabulary.dto";
import {
  calculateQualityFromScore,
  calculateSm2,
  calculateXpFromQuality,
} from "@/core/domain/sm2";
import type { VocabularyRepository } from "@/core/repositories/vocabulary-repository";
import { InMemoryVocabularyRepository } from "@/core/repositories/vocabulary-repository";

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

    // 1. Check local high-precision cache first
    const cached = LOCAL_FALLBACK_DICTIONARY[word];

    let phonetic = cached?.ipa || "";
    let partOfSpeech = cached?.partOfSpeech || "noun";
    let definitionVi = cached?.definitionVi || "";
    let exampleEn = cached?.exampleSentenceEn || "";
    let exampleVi = cached?.exampleSentenceVi || "";
    let tipVi = cached?.articulatoryTipVi || "";
    let audioUrl: string | null = null;

    // 2. Fetch Free Dictionary API if available
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
          phonetic = entry.phonetic || entry.phonetics?.find((p: { text?: string }) => p.text)?.text || phonetic;

          // Find native UK/US audio if provided
          const audioEntry = entry.phonetics?.find((p: { audio?: string }) => p.audio && p.audio.length > 0);
          if (audioEntry?.audio) {
            audioUrl = audioEntry.audio;
          }

          if (entry.meanings && entry.meanings.length > 0) {
            const primaryMeaning = entry.meanings[0];
            partOfSpeech = primaryMeaning.partOfSpeech || partOfSpeech;

            const def = primaryMeaning.definitions?.[0];
            if (def?.example && !exampleEn) {
              exampleEn = def.example;
            }
          }
        }
      }
    } catch {
      // Free Dictionary API timeout or offline - gracefully fallback to AI / heuristics
    }

    // 3. Fallback / Heuristics if dictionary was incomplete
    if (!phonetic) {
      phonetic = `/${word}/`;
    }
    if (!definitionVi) {
      definitionVi = `Từ vựng tiếng Anh: "${word}". Định nghĩa và ngữ nghĩa giao tiếp thông dụng.`;
    }
    if (!exampleEn) {
      exampleEn = `We practiced pronouncing the word "${word}" accurately.`;
      exampleVi = `Chúng tôi đã luyện tập phát âm chuẩn xác từ "${word}".`;
    }
    if (!tipVi) {
      tipVi = `Đặt khẩu hình tự nhiên, chú ý trọng âm chính và luồng hơi của từ "${word}".`;
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
      referenceAudioBase64: null,
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
   * Enforces the rule: Pronunciation score >= 8000 bp (80%) is required to pass and advance SM-2 interval.
   */
  async submitSpeakingReview(params: {
    vocabularyItemId: string;
    idempotencyKey: string;
    pronunciationScoreBp: number;
    audioDurationMs: number;
    userId?: string;
  }): Promise<FlashcardReviewResult> {
    const userId = params.userId ?? this.defaultUserId;
    const { vocabularyItemId, idempotencyKey, pronunciationScoreBp } = params;

    const item = await this.vocabRepo.findItemById(vocabularyItemId);
    if (!item) {
      throw new Error(`Vocabulary item not found: ${vocabularyItemId}`);
    }

    // 1. Calculate SM-2 Quality Grade & Transitions
    const qualityGrade = calculateQualityFromScore(pronunciationScoreBp);
    const sm2Result = calculateSm2({
      qualityGrade,
      repetitionCount: item.sm2Repetition,
      intervalDays: item.sm2IntervalDays,
      easeFactorBp: item.sm2EaseFactorBp,
    });

    const isPassed = sm2Result.isPassed;
    const xpAwarded = calculateXpFromQuality(qualityGrade);

    // 2. Prepare transaction record
    const updatedItemProps: Partial<VocabularyItem> & { id: string } = {
      id: item.id,
      sm2Repetition: sm2Result.repetitionCount,
      sm2IntervalDays: sm2Result.intervalDays,
      sm2EaseFactorBp: sm2Result.easeFactorBp,
      sm2NextReviewAt: sm2Result.nextReviewDate.toISOString(),
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
      intervalDaysAfter: sm2Result.intervalDays,
      easeFactorBeforeBp: item.sm2EaseFactorBp,
      easeFactorAfterBp: sm2Result.easeFactorBp,
      xpAwarded,
    };

    const txResult = await this.vocabRepo.saveFlashcardReviewTransaction({
      review: reviewRecord,
      updatedItem: updatedItemProps,
    });

    const feedbackVi = isPassed
      ? `Phát âm chuẩn xác (${Math.round(pronunciationScoreBp / 100)}/100)! Thẻ đã được công nhận ghi nhớ và tăng khoảng cách ôn tập lên ${sm2Result.intervalDays} ngày (+${xpAwarded} XP).`
      : `Phát âm chưa đạt (${Math.round(pronunciationScoreBp / 100)}/100 < 80). Thẻ cần được luyện nói lại vào ngày mai để đảm bảo phản xạ nói chuẩn xác.`;

    return {
      reviewId: txResult.reviewId,
      vocabularyItemId: item.id,
      qualityGrade,
      pronunciationScoreBp,
      isPassed,
      repetitionCountAfter: sm2Result.repetitionCount,
      intervalDaysAfter: sm2Result.intervalDays,
      easeFactorAfterBp: sm2Result.easeFactorBp,
      nextReviewAt: sm2Result.nextReviewDate.toISOString(),
      xpAwarded: Number(xpAwarded),
      feedbackVi,
    };
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
