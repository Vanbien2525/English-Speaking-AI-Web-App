import { describe, it, expect } from "vitest";
import {
  QuickAddEnrichRequestSchema,
  QuickAddEnrichResponseSchema,
  SubmitFlashcardSpeakingReviewSchema,
  FlashcardReviewResultSchema,
  BatchImportRequestSchema,
} from "@/core/dto/vocabulary.dto";

describe("Vocabulary DTO Schemas Validation", () => {
  it("validates QuickAddEnrichRequestSchema correctly", () => {
    const valid = QuickAddEnrichRequestSchema.safeParse({ word: "articulation" });
    expect(valid.success).toBe(true);

    const empty = QuickAddEnrichRequestSchema.safeParse({ word: "   " });
    expect(empty.success).toBe(false);
  });

  it("validates QuickAddEnrichResponseSchema correctly", () => {
    const valid = QuickAddEnrichResponseSchema.safeParse({
      word: "articulation",
      ipa: "/ɑːˌtɪk.jəˈleɪ.ʃən/",
      partOfSpeech: "noun",
      definitionVi: "Sự phát âm rõ ràng, chuẩn xác các âm vị trong giao tiếp.",
      exampleSentenceEn: "Clear articulation is essential for an effective presenter.",
      exampleSentenceVi: "Phát âm rõ ràng là điều cốt yếu đối với một người thuyết trình hiệu quả.",
      articulatoryTipVi: "Đầu lưỡi nâng chạm ngạc cứng cho âm /l/, mở rộng khẩu hình cho nguyên âm.",
      referenceAudioUrl: "https://api.dictionaryapi.dev/media/pronunciations/en/articulation-uk.mp3",
      referenceAudioBase64: null,
    });
    expect(valid.success).toBe(true);
  });

  it("validates SubmitFlashcardSpeakingReviewSchema correctly", () => {
    const valid = SubmitFlashcardSpeakingReviewSchema.safeParse({
      vocabularyItemId: "019488a0-7b24-789a-bcde-000000000001",
      idempotencyKey: "019488a0-7b24-789a-bcde-000000000002",
      pronunciationScoreBp: 8800,
      audioDurationMs: 1400,
    });
    expect(valid.success).toBe(true);

    const invalidScore = SubmitFlashcardSpeakingReviewSchema.safeParse({
      vocabularyItemId: "019488a0-7b24-789a-bcde-000000000001",
      idempotencyKey: "019488a0-7b24-789a-bcde-000000000002",
      pronunciationScoreBp: 12000, // Invalid: exceeds 10000 bp
      audioDurationMs: 1400,
    });
    expect(invalidScore.success).toBe(false);
  });

  it("validates BatchImportRequestSchema with max length", () => {
    const valid = BatchImportRequestSchema.safeParse({
      deckId: "019488a0-7b24-789a-bcde-000000000001",
      rawText: "articulation, resilience, eloquence, ubiquitous",
    });
    expect(valid.success).toBe(true);
  });

  it("validates FlashcardReviewResultSchema with integer XP", () => {
    const valid = FlashcardReviewResultSchema.safeParse({
      reviewId: "019488a0-7b24-789a-bcde-000000000001",
      vocabularyItemId: "019488a0-7b24-789a-bcde-000000000002",
      qualityGrade: 4,
      pronunciationScoreBp: 8500,
      isPassed: true,
      repetitionCountAfter: 1,
      intervalDaysAfter: 1,
      easeFactorAfterBp: 2500,
      nextReviewAt: "2026-10-22T00:00:00.000Z",
      xpAwarded: 15,
      feedbackVi: "Phát âm đạt chuẩn! Thẻ được đánh dấu đã thuộc.",
    });
    expect(valid.success).toBe(true);
  });
});
