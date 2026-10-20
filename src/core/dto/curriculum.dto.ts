import { z } from "zod";
import { SCORE_BP_MAX, SCORE_BP_MIN } from "@/core/domain/scoring";

// -----------------------------------------------------------------------------
// Enums & Primitive Schemas
// -----------------------------------------------------------------------------

export const PhonemeCategoryEnum = z.enum(["monophthong", "diphthong", "consonant"]);
export type PhonemeCategory = z.infer<typeof PhonemeCategoryEnum>;

export const CefrLevelEnum = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export type CefrLevel = z.infer<typeof CefrLevelEnum>;

export const IpaStatusColorEnum = z.enum(["neutral", "coral", "amber", "emerald"]);
export type IpaStatusColor = z.infer<typeof IpaStatusColorEnum>;

export const VietnameseErrorGroupEnum = z.enum([
  "ending-consonants",
  "dental-fricatives",
  "palato-alveolar",
  "vowel-length",
  "regional-confusion",
]);
export type VietnameseErrorGroup = z.infer<typeof VietnameseErrorGroupEnum>;

// -----------------------------------------------------------------------------
// IPA Phoneme DTOs
// -----------------------------------------------------------------------------

export const IpaPhonemeItemSchema = z.object({
  id: z.string().uuid(),
  ipaSymbol: z.string().min(1).max(8),
  arpabet: z.string().nullable(),
  category: PhonemeCategoryEnum,
  isVoiced: z.boolean(),
  placeOfArticulation: z.string().nullable(),
  mannerOfArticulation: z.string().nullable(),
  exampleWord: z.string().min(1),
  sortOrder: z.int(),
  // Personal mastery fields (aggregated from user_phoneme_mastery)
  attemptsCount: z.int().min(0),
  correctCount: z.int().min(0),
  averageScoreBp: z.int().min(SCORE_BP_MIN).max(SCORE_BP_MAX).nullable(),
  statusColor: IpaStatusColorEnum,
  lastPracticedAt: z.string().nullable().optional(),
});
export type IpaPhonemeItemDto = z.infer<typeof IpaPhonemeItemSchema>;

export const RelatedLessonSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  titleEn: z.string(),
  titleVi: z.string(),
  cefr: CefrLevelEnum,
  xpReward: z.int().min(0),
});
export type RelatedLessonDto = z.infer<typeof RelatedLessonSchema>;

export const PhonemeDetailDrawerSchema = IpaPhonemeItemSchema.extend({
  articulationGuideVi: z.string(),
  commonVnSubstitutions: z.array(z.string()),
  referenceVoice: z.string().default("en-GB-SoniaNeural"),
  relatedLessons: z.array(RelatedLessonSchema),
});
export type PhonemeDetailDrawerDto = z.infer<typeof PhonemeDetailDrawerSchema>;

// -----------------------------------------------------------------------------
// Lesson Catalog & Filtering DTOs
// -----------------------------------------------------------------------------

export const LessonCatalogFilterSchema = z.object({
  cefr: z.union([CefrLevelEnum, z.literal("all")]).default("all"),
  categorySlug: z.string().default("all"),
  errorGroup: z.union([VietnameseErrorGroupEnum, z.literal("all")]).default("all"),
  search: z.string().optional(),
  phonemeId: z.string().uuid().optional(),
});
export type LessonCatalogFilterDto = z.infer<typeof LessonCatalogFilterSchema>;

export const FocusPhonemeSchema = z.object({
  id: z.string().uuid(),
  ipaSymbol: z.string().min(1).max(8),
});
export type FocusPhonemeDto = z.infer<typeof FocusPhonemeSchema>;

export const UserLessonProgressSchema = z.object({
  bestScoreBp: z.int().min(SCORE_BP_MIN).max(SCORE_BP_MAX),
  attemptsCount: z.int().min(0),
  isCompleted: z.boolean(),
  completedAt: z.string().nullable(),
});
export type UserLessonProgressDto = z.infer<typeof UserLessonProgressSchema>;

export const LessonCardSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  titleEn: z.string(),
  titleVi: z.string(),
  descriptionVi: z.string().nullable(),
  cefr: CefrLevelEnum,
  estimatedMinutes: z.int().positive(),
  xpReward: z.int().min(0),
  tags: z.array(z.string()),
  categoryTitleVi: z.string(),
  focusPhonemes: z.array(FocusPhonemeSchema),
  userProgress: UserLessonProgressSchema.nullable(),
});
export type LessonCardDto = z.infer<typeof LessonCardSchema>;

export const PedagogicalRecommendationSchema = z.object({
  weakestPhoneme: IpaPhonemeItemSchema,
  recommendedLesson: LessonCardSchema.nullable(),
  reasonVi: z.string(),
});
export type PedagogicalRecommendationDto = z.infer<typeof PedagogicalRecommendationSchema>;
