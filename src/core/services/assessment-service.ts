import type {
  CreateAttemptMeta,
  PronunciationAssessment,
  TutorFeedback,
  WordResult,
} from "@/core/dto/shared.dto";
import type { PracticeRepository } from "@/core/repositories/practice-repository";
import type { AiEngineClient } from "@/core/adapters/ai-engine-client";
import { MockAiEngineClient, FastApiAiEngineClient } from "@/core/adapters/ai-engine-client";
import { InMemoryPracticeRepository } from "@/core/repositories/practice-repository";

// -----------------------------------------------------------------------------
// Domain Exceptions
// -----------------------------------------------------------------------------

export class ScoringTimeoutError extends Error {
  constructor(message = "Python AI Engine exceeded 1500ms SLA limit") {
    super(message);
    this.name = "ScoringTimeoutError";
  }
}

export class AudioValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudioValidationError";
  }
}

export class MissingAudioError extends Error {
  constructor(message = "Missing audio file in multipart payload") {
    super(message);
    this.name = "MissingAudioError";
  }
}

export class InvalidPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPayloadError";
  }
}

// -----------------------------------------------------------------------------
// Service Dependencies & Context
// -----------------------------------------------------------------------------

export interface AssessmentDependencies {
  repository: PracticeRepository;
  aiClient: AiEngineClient;
  defaultUserId: string;
}

function createDefaultAiClient(): AiEngineClient {
  if (
    process.env.NODE_ENV !== "test" &&
    (process.env.USE_REAL_AI_ENGINE === "true" || process.env.AI_ENGINE_PROVIDER === "local")
  ) {
    return new FastApiAiEngineClient(process.env.AI_ENGINE_URL ?? "http://127.0.0.1:8000");
  }
  return new MockAiEngineClient();
}

// Default singleton for development / runtime (overridable in tests)
let globalDeps: AssessmentDependencies = {
  repository: new InMemoryPracticeRepository(),
  aiClient: createDefaultAiClient(),
  defaultUserId: "019488a0-7b24-789a-bcde-000000000001",
};

export function setAssessmentDependencies(deps: Partial<AssessmentDependencies>): void {
  globalDeps = { ...globalDeps, ...deps };
}

export function getAssessmentDependencies(): AssessmentDependencies {
  return globalDeps;
}

// -----------------------------------------------------------------------------
// Core Assessment Application Service
// -----------------------------------------------------------------------------

export class AssessmentService {
  private readonly AI_SLA_TIMEOUT_MS = Number(process.env.AI_ENGINE_TIMEOUT_MS) || 1500;

  constructor(
    private readonly repository: PracticeRepository = globalDeps.repository,
    private readonly aiClient: AiEngineClient = globalDeps.aiClient,
    private readonly defaultUserId: string = globalDeps.defaultUserId,
  ) {}

  async execute(input: {
    audioBuffer: Uint8Array;
    meta: CreateAttemptMeta;
    userId?: string;
  }): Promise<PronunciationAssessment> {
    const userId = input.userId ?? this.defaultUserId;
    const { meta, audioBuffer } = input;

    // 1. Validate audio duration constraints (500ms <= duration <= 15000ms)
    if (meta.audioDurationMs < 500) {
      throw new AudioValidationError("Audio duration must be at least 500ms (0.5 seconds)");
    }
    if (meta.audioDurationMs > 15000) {
      throw new AudioValidationError("Audio duration cannot exceed 15000ms (15 seconds)");
    }

    // 2. Check Idempotency: Return existing scored attempt if already processed
    const existingAttempt = await this.repository.findAttemptByIdempotencyKey(userId, meta.idempotencyKey);
    if (existingAttempt) {
      if (existingAttempt.status === "scored") {
        return {
          attemptId: existingAttempt.id,
          engine: existingAttempt.engine,
          engineVersion: existingAttempt.engineVersion,
          recognizedText: existingAttempt.recognizedText ?? "",
          overallScoreBp: existingAttempt.overallScoreBp ?? 0,
          accuracyBp: existingAttempt.accuracyBp ?? 0,
          fluencyBp: existingAttempt.fluencyBp ?? 0,
          completenessBp: existingAttempt.completenessBp ?? 0,
          prosodyBp: existingAttempt.prosodyBp,
          scoringLatencyMs: existingAttempt.scoringLatencyMs ?? 0,
          words: existingAttempt.wordResults as WordResult[],
          feedback: existingAttempt.tutorFeedback as unknown as TutorFeedback,
        };
      }
    }

    // 3. Dispatch to AI Engine with SLA timeout guard (1500ms)
    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => {
      abortController.abort();
    }, this.AI_SLA_TIMEOUT_MS);

    let scoringResult;
    try {
      scoringResult = await this.aiClient.assessAudio(audioBuffer, meta, {
        signal: abortController.signal,
      });
    } catch (err: unknown) {
      const isAbort = (err as { name?: string }).name === "AbortError";
      if (isAbort || abortController.signal.aborted) {
        // Record failed attempt with SCORING_TIMEOUT in database
        await this.repository.saveFailedAttempt({
          sessionId: meta.sessionId,
          userId,
          lessonItemId: meta.lessonItemId,
          idempotencyKey: meta.idempotencyKey,
          engine: "local_whisperx_wav2vec2",
          engineVersion: "whisperx-3.1.1",
          audioDurationMs: meta.audioDurationMs,
          errorCode: "SCORING_TIMEOUT",
        });

        throw new ScoringTimeoutError(
          `AI speech engine failed to respond within ${this.AI_SLA_TIMEOUT_MS}ms SLA limit`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutHandle);
    }

    // 4. Flatten phonemes for relational persistence
    const phonemesToSave = scoringResult.words.flatMap((w) =>
      w.phonemes.map((p) => ({
        position: p.position,
        expectedPhonemeId: p.expectedIpa ? `phoneme:${p.expectedIpa}` : null,
        actualPhonemeId: p.actualIpa ? `phoneme:${p.actualIpa}` : null,
        errorType: p.errorType,
        severity: p.severity,
        gopScoreBp: p.gopScoreBp,
        startMs: p.startMs,
        endMs: p.endMs,
      })),
    );

    // Calculate XP reward: minimum 10 XP, up to 100 XP based on overall score
    const xpAward = Math.max(10, Math.round(scoringResult.overallScoreBp / 100));

    // 5. ACID Transactional Save: Attempt + Phonemes + UserStats + XpLedger
    const { attempt } = await this.repository.saveScoredAttempt({
      sessionId: meta.sessionId,
      userId,
      lessonItemId: meta.lessonItemId,
      idempotencyKey: meta.idempotencyKey,
      engine: scoringResult.engine,
      engineVersion: scoringResult.engineVersion,
      recognizedText: scoringResult.recognizedText,
      overallScoreBp: scoringResult.overallScoreBp,
      accuracyBp: scoringResult.accuracyBp,
      fluencyBp: scoringResult.fluencyBp,
      completenessBp: scoringResult.completenessBp,
      prosodyBp: scoringResult.prosodyBp,
      audioDurationMs: meta.audioDurationMs,
      scoringLatencyMs: scoringResult.scoringLatencyMs,
      wordResults: scoringResult.words,
      tutorFeedback: scoringResult.feedback as unknown as Record<string, unknown>,
      phonemes: phonemesToSave,
      xpAward,
    });

    return {
      attemptId: attempt.id,
      engine: attempt.engine,
      engineVersion: attempt.engineVersion,
      recognizedText: attempt.recognizedText ?? "",
      overallScoreBp: attempt.overallScoreBp ?? 0,
      accuracyBp: attempt.accuracyBp ?? 0,
      fluencyBp: attempt.fluencyBp ?? 0,
      completenessBp: attempt.completenessBp ?? 0,
      prosodyBp: attempt.prosodyBp,
      scoringLatencyMs: attempt.scoringLatencyMs ?? 0,
      words: attempt.wordResults as WordResult[],
      feedback: attempt.tutorFeedback as unknown as TutorFeedback,
    };
  }
}
