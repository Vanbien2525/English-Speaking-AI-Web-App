/**
 * Shared DTO contracts between the Next.js frontend, the Next.js BFF route
 * handlers and the Python AI engine (FastAPI). Every payload crossing a process
 * boundary MUST be validated with these schemas (runtime) and typed with the
 * inferred types (compile time).
 */
import { z } from "zod";
import { SCORE_BP_MAX, SCORE_BP_MIN } from "@/core/domain/scoring";

// -----------------------------------------------------------------------------
// Primitives
// -----------------------------------------------------------------------------
export const ScoreBpSchema = z.int().min(SCORE_BP_MIN).max(SCORE_BP_MAX);
export const DurationMsSchema = z.int().min(0);
export const IpaSymbolSchema = z.string().min(1).max(8);

export const AccentCodeSchema = z.enum(["en-GB-RP", "en-US-GA"]);
export const FeedbackSeveritySchema = z.enum(["good", "minor", "major"]);
export const PhonemeErrorTypeSchema = z.enum(["correct", "substitution", "deletion", "insertion", "distortion"]);
export const EngineProviderSchema = z.enum(["local_whisperx_wav2vec2", "gemini_live", "azure_pronunciation"]);

// -----------------------------------------------------------------------------
// 3D viseme control (consumed by the Practice Studio GSAP/R3F timeline)
// -----------------------------------------------------------------------------
/** Morph target weights in per-mille (0..1000), keyed by glTF morph target name. */
export const MorphWeightsSchema = z.record(z.string().min(1), z.int().min(0).max(1000));

export const Vec3Schema = z.tuple([z.number(), z.number(), z.number()]);

export const CameraPresetSchema = z.object({
  position: Vec3Schema,
  target: Vec3Schema,
  fov: z.number().min(10).max(90),
});

export const VisemeCommandSchema = z.object({
  ipa: IpaSymbolSchema,
  startMs: DurationMsSchema,
  transitionMs: z.int().min(0).max(2000),
  holdMs: z.int().min(0).max(5000),
  morphWeights: MorphWeightsSchema,
  highlightParts: z.array(z.string().min(1)).default([]),
  camera: CameraPresetSchema.optional(),
});

// -----------------------------------------------------------------------------
// Pronunciation assessment (AI engine -> BFF -> UI)
// -----------------------------------------------------------------------------
export const PhonemeResultSchema = z
  .object({
    position: z.int().min(0),
    expectedIpa: IpaSymbolSchema.nullable(),
    actualIpa: IpaSymbolSchema.nullable(),
    errorType: PhonemeErrorTypeSchema,
    severity: FeedbackSeveritySchema,
    gopScoreBp: ScoreBpSchema,
    startMs: DurationMsSchema.nullable(),
    endMs: DurationMsSchema.nullable(),
  })
  .refine((p) => p.startMs === null || p.endMs === null || p.endMs >= p.startMs, {
    message: "endMs must be greater than or equal to startMs",
    path: ["endMs"],
  })
  .refine(
    (p) =>
      (p.errorType === "insertion" && p.expectedIpa === null && p.actualIpa !== null) ||
      (p.errorType === "deletion" && p.expectedIpa !== null && p.actualIpa === null) ||
      (["correct", "substitution", "distortion"].includes(p.errorType) &&
        p.expectedIpa !== null &&
        p.actualIpa !== null),
    { message: "expectedIpa/actualIpa are inconsistent with errorType", path: ["errorType"] },
  );

export const WordResultSchema = z.object({
  word: z.string().min(1),
  accuracyBp: ScoreBpSchema,
  startMs: DurationMsSchema,
  endMs: DurationMsSchema,
  phonemes: z.array(PhonemeResultSchema),
});

export const TutorFeedbackSchema = z.object({
  summaryVi: z.string().min(1),
  tipsVi: z.array(z.string().min(1)).max(5),
  visemeTimeline: z.array(VisemeCommandSchema),
});

export const PronunciationAssessmentSchema = z.object({
  attemptId: z.uuid(),
  engine: EngineProviderSchema,
  engineVersion: z.string().min(1).max(64),
  recognizedText: z.string(),
  overallScoreBp: ScoreBpSchema,
  accuracyBp: ScoreBpSchema,
  fluencyBp: ScoreBpSchema,
  completenessBp: ScoreBpSchema,
  prosodyBp: ScoreBpSchema.nullable(),
  scoringLatencyMs: DurationMsSchema,
  words: z.array(WordResultSchema),
  feedback: TutorFeedbackSchema,
});

/** Multipart metadata sent alongside the in-memory audio Blob. */
export const CreateAttemptMetaSchema = z.object({
  sessionId: z.uuid(),
  lessonItemId: z.uuid(),
  idempotencyKey: z.uuid(),
  audioDurationMs: z.int().min(1).max(60_000),
  accent: AccentCodeSchema,
});

// -----------------------------------------------------------------------------
// Standard API error envelope
// -----------------------------------------------------------------------------
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});

// -----------------------------------------------------------------------------
// Inferred types
// -----------------------------------------------------------------------------
export type AccentCode = z.infer<typeof AccentCodeSchema>;
export type PhonemeErrorType = z.infer<typeof PhonemeErrorTypeSchema>;
export type EngineProvider = z.infer<typeof EngineProviderSchema>;
export type MorphWeights = z.infer<typeof MorphWeightsSchema>;
export type CameraPreset = z.infer<typeof CameraPresetSchema>;
export type VisemeCommand = z.infer<typeof VisemeCommandSchema>;
export type PhonemeResult = z.infer<typeof PhonemeResultSchema>;
export type WordResult = z.infer<typeof WordResultSchema>;
export type TutorFeedback = z.infer<typeof TutorFeedbackSchema>;
export type PronunciationAssessment = z.infer<typeof PronunciationAssessmentSchema>;
export type CreateAttemptMeta = z.infer<typeof CreateAttemptMetaSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
