import { z } from "zod";
import { ScoreBpSchema, DurationMsSchema } from "./shared.dto";

// -----------------------------------------------------------------------------
// Core Vocabulary Item & Deck Schemas
// -----------------------------------------------------------------------------
export const VocabularyDeckSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  name: z.string().min(1).max(120),
  description: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
  itemCount: z.int().min(0).default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateVocabularyDeckSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().nullable().optional(),
  tags: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
});

export const VocabularyItemSchema = z.object({
  id: z.uuid(),
  deckId: z.uuid(),
  userId: z.uuid(),
  word: z.string().min(1).max(100),
  ipa: z.string().min(1).max(100),
  partOfSpeech: z.string().min(1).max(30).default("noun"),
  definitionVi: z.string().min(1),
  exampleSentenceEn: z.string().min(1),
  exampleSentenceVi: z.string().min(1),
  articulatoryTipVi: z.string().nullable().default(null),
  referenceAudioUrl: z.string().nullable().default(null),

  // SM-2 Spaced Repetition Parameters
  sm2Repetition: z.int().min(0).default(0),
  sm2IntervalDays: z.int().min(1).default(1),
  sm2EaseFactorBp: z.int().min(1300).default(2500),
  sm2NextReviewAt: z.string().datetime(),
  sm2LastReviewedAt: z.string().datetime().nullable().default(null),

  // Speaking-Verified Mastery
  lastMasteryScoreBp: ScoreBpSchema.nullable().default(null),
  isMastered: z.boolean().default(false),
  masteryAttemptsCount: z.int().min(0).default(0),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// -----------------------------------------------------------------------------
// Smart Quick-Add Importer Payloads
// -----------------------------------------------------------------------------
export const QuickAddEnrichRequestSchema = z.object({
  word: z.string().trim().min(1).max(64),
});

export const QuickAddEnrichResponseSchema = z.object({
  word: z.string().min(1),
  ipa: z.string().min(1),
  partOfSpeech: z.string().min(1),
  definitionVi: z.string().min(1),
  exampleSentenceEn: z.string().min(1),
  exampleSentenceVi: z.string().min(1),
  articulatoryTipVi: z.string().nullable().default(null),
  referenceAudioUrl: z.string().nullable().default(null),
});

export const CreateVocabularyItemSchema = z.object({
  deckId: z.uuid(),
  word: z.string().trim().min(1).max(100),
  ipa: z.string().trim().min(1).max(100),
  partOfSpeech: z.string().trim().min(1).max(30).default("noun"),
  definitionVi: z.string().trim().min(1),
  exampleSentenceEn: z.string().trim().min(1),
  exampleSentenceVi: z.string().trim().min(1),
  articulatoryTipVi: z.string().trim().nullable().optional(),
  referenceAudioUrl: z.string().trim().nullable().optional(),
});

// -----------------------------------------------------------------------------
// Batch Multi-Word Importer Payloads
// -----------------------------------------------------------------------------
export const BatchImportRequestSchema = z.object({
  deckId: z.uuid(),
  rawText: z.string().trim().min(1).max(10_000),
});

export const BatchImportResultItemSchema = z.object({
  word: z.string(),
  status: z.enum(["success", "error"]),
  item: VocabularyItemSchema.nullable().default(null),
  errorMessage: z.string().nullable().default(null),
});

export const BatchImportResponseSchema = z.object({
  totalProcessed: z.int().min(0),
  successCount: z.int().min(0),
  errorCount: z.int().min(0),
  results: z.array(BatchImportResultItemSchema),
});

// -----------------------------------------------------------------------------
// Speaking-Verified Flashcard Review Payloads
// -----------------------------------------------------------------------------
export const ReviewLevelSchema = z.enum(["again", "good", "easy"]);

export const SubmitFlashcardSpeakingReviewSchema = z.object({
  vocabularyItemId: z.uuid(),
  idempotencyKey: z.uuid(),
  pronunciationScoreBp: ScoreBpSchema,
  audioDurationMs: DurationMsSchema,
  reviewLevel: ReviewLevelSchema.optional(),
});

export const FlashcardReviewResultSchema = z.object({
  reviewId: z.uuid(),
  vocabularyItemId: z.uuid(),
  qualityGrade: z.int().min(0).max(5),
  pronunciationScoreBp: ScoreBpSchema,
  isPassed: z.boolean(),
  repetitionCountAfter: z.int().min(0),
  intervalDaysAfter: z.int().min(1),
  easeFactorAfterBp: z.int().min(1300),
  nextReviewAt: z.string().datetime(),
  xpAwarded: z.int().min(0),
  feedbackVi: z.string(),
  masteryLevel: z.int().min(1).max(3).optional(),
});

export const VocabularyMetricsSchema = z.object({
  totalWords: z.int().min(0),
  dueCardsCount: z.int().min(0),
  masteredWordsCount: z.int().min(0),
  retentionRateBp: ScoreBpSchema,
});

// -----------------------------------------------------------------------------
// Interactive Practice Modes (Listening Quiz & Cloze Fill-in)
// -----------------------------------------------------------------------------
export const ListeningQuizQuestionSchema = z.object({
  id: z.uuid(),
  targetWord: z.string(),
  ipa: z.string(),
  audioUrl: z.string().nullable(),
  definitionVi: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
});

export const ClozeSpellingQuestionSchema = z.object({
  id: z.uuid(),
  targetWord: z.string(),
  sentenceWithBlank: z.string(),
  sentenceVi: z.string(),
  hintIpa: z.string(),
  audioUrl: z.string().nullable().optional(),
  hintDefinitionVi: z.string().nullable().optional(),
});

// -----------------------------------------------------------------------------
// Inferred Types
// -----------------------------------------------------------------------------
export type VocabularyDeck = z.infer<typeof VocabularyDeckSchema>;
export type CreateVocabularyDeck = z.infer<typeof CreateVocabularyDeckSchema>;
export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;
export type QuickAddEnrichRequest = z.infer<typeof QuickAddEnrichRequestSchema>;
export type QuickAddEnrichResponse = z.infer<typeof QuickAddEnrichResponseSchema>;
export type CreateVocabularyItem = z.infer<typeof CreateVocabularyItemSchema>;
export type BatchImportRequest = z.infer<typeof BatchImportRequestSchema>;
export type BatchImportResultItem = z.infer<typeof BatchImportResultItemSchema>;
export type BatchImportResponse = z.infer<typeof BatchImportResponseSchema>;
export type ReviewLevel = z.infer<typeof ReviewLevelSchema>;
export type SubmitFlashcardSpeakingReview = z.infer<typeof SubmitFlashcardSpeakingReviewSchema>;
export type FlashcardReviewResult = z.infer<typeof FlashcardReviewResultSchema>;
export type VocabularyMetrics = z.infer<typeof VocabularyMetricsSchema>;
export type ListeningQuizQuestion = z.infer<typeof ListeningQuizQuestionSchema>;
export type ClozeSpellingQuestion = z.infer<typeof ClozeSpellingQuestionSchema>;
