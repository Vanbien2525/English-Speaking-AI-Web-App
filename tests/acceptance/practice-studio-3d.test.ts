import { describe, expect, it, beforeEach } from "vitest";
import { POST } from "@/app/api/practice/assess/route";
import { InMemoryPracticeRepository } from "@/core/repositories/practice-repository";
import { MockAiEngineClient } from "@/core/adapters/ai-engine-client";
import { setAssessmentDependencies } from "@/core/services/assessment-service";
import type { CreateAttemptMeta } from "@/core/dto/shared.dto";

describe("Practice Studio 3D - Backend Acceptance & Integration Suite (POST /api/practice/assess)", () => {
  let repository: InMemoryPracticeRepository;
  let aiClient: MockAiEngineClient;

  const TEST_USER_ID = "019488a0-7b24-789a-bcde-000000000001";
  const TEST_SESSION_ID = "019488a0-7b24-789a-bcde-000000000002";
  const TEST_LESSON_ITEM_ID = "019488a0-7b24-789a-bcde-000000000003";

  beforeEach(() => {
    repository = new InMemoryPracticeRepository();
    aiClient = new MockAiEngineClient();

    // Seed test user stats
    repository.seedUserStats({
      userId: TEST_USER_ID,
      totalXp: 1000n,
      currentStreakDays: 3,
      longestStreakDays: 5,
      lastActiveDate: "2026-10-19",
      lessonsCompleted: 2,
      version: 0,
      updatedAt: new Date(),
    });

    // Inject test dependencies into route service
    setAssessmentDependencies({
      repository,
      aiClient,
      defaultUserId: TEST_USER_ID,
    });
  });

  function createValidMultipartFormData(overrides?: {
    meta?: Partial<CreateAttemptMeta>;
    audioBytes?: Uint8Array;
    omitAudio?: boolean;
    omitMeta?: boolean;
    rawMetaString?: string;
  }): FormData {
    const formData = new FormData();

    if (!overrides?.omitMeta) {
      if (overrides?.rawMetaString !== undefined) {
        formData.append("metadata", overrides.rawMetaString);
      } else {
        const meta: CreateAttemptMeta = {
          sessionId: TEST_SESSION_ID,
          lessonItemId: TEST_LESSON_ITEM_ID,
          idempotencyKey: "019488a0-7b24-789a-bcde-111111111111",
          audioDurationMs: 2500,
          accent: "en-GB-RP",
          ...overrides?.meta,
        };
        formData.append("metadata", JSON.stringify(meta));
      }
    }

    if (!overrides?.omitAudio) {
      const audioBytes = overrides?.audioBytes ?? new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00]);
      const blob = new Blob([audioBytes.buffer as ArrayBuffer], { type: "audio/wav" });
      formData.append("audio", blob, "recording.wav");
    }

    return formData;
  }

  function createMockRequest(formData: FormData): Request {
    return {
      formData: async () => formData,
    } as unknown as Request;
  }

  // ---------------------------------------------------------------------------
  // TC-01: Happy Path
  // ---------------------------------------------------------------------------
  it("TC-01 (Happy Path): returns 200 OK with structured assessment and commits ACID transaction", async () => {
    const idempotencyKey = "019488a0-7b24-789a-bcde-000000000101";
    const formData = createValidMultipartFormData({
      meta: { idempotencyKey, audioDurationMs: 2800 },
    });

    const request = createMockRequest(formData);

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("attemptId");
    expect(body.overallScoreBp).toBeGreaterThanOrEqual(0);
    expect(body.accuracyBp).toBeGreaterThanOrEqual(0);
    expect(body.feedback).toBeDefined();
    expect(body.feedback.visemeTimeline).toBeInstanceOf(Array);
    expect(body.words).toBeInstanceOf(Array);

    // Verify DB transaction atomicity
    const attempt = await repository.findAttemptByIdempotencyKey(TEST_USER_ID, idempotencyKey);
    expect(attempt).not.toBeNull();
    expect(attempt?.status).toBe("scored");
    expect(attempt?.overallScoreBp).toBe(body.overallScoreBp);

    // Verify user_stats XP update & xp_ledger
    const stats = await repository.getUserStats(TEST_USER_ID);
    expect(stats?.totalXp).toBeGreaterThan(1000n);

    const ledgerEntries = await repository.getXpLedger(TEST_USER_ID);
    expect(ledgerEntries.length).toBe(1);
    expect(ledgerEntries[0]!.idempotencyKey).toBe(`attempt:${idempotencyKey}`);
    expect(ledgerEntries[0]!.amount).toBe(stats!.totalXp - 1000n);
  });

  // ---------------------------------------------------------------------------
  // TC-02: Missing Audio Payload
  // ---------------------------------------------------------------------------
  it("TC-02: returns 400 Bad Request when audio file is missing", async () => {
    const formData = createValidMultipartFormData({ omitAudio: true });
    const request = createMockRequest(formData);

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe("INVALID_PAYLOAD");
    expect(body.error.message).toContain("audio");

    // Ensure zero records created in DB
    const attempts = await repository.listAttempts(TEST_USER_ID);
    expect(attempts.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // TC-03: Invalid Metadata JSON
  // ---------------------------------------------------------------------------
  it("TC-03: returns 400 Bad Request when metadata is missing or invalid JSON", async () => {
    const formData = createValidMultipartFormData({ rawMetaString: "{ bad-json-payload" });
    const request = createMockRequest(formData);

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe("INVALID_PAYLOAD");
  });

  // ---------------------------------------------------------------------------
  // TC-04: Audio Duration Validation (< 500ms or > 15000ms)
  // ---------------------------------------------------------------------------
  it("TC-04: returns 422 Unprocessable Entity when audio duration is outside [500ms, 15000ms]", async () => {
    // Too short (200ms < 500ms)
    const shortFormData = createValidMultipartFormData({
      meta: { audioDurationMs: 200 },
    });
    const shortRequest = createMockRequest(shortFormData);
    const shortResponse = await POST(shortRequest);
    expect(shortResponse.status).toBe(422);
    const shortBody = await shortResponse.json();
    expect(shortBody.error.code).toBe("AUDIO_VALIDATION_FAILED");

    // Too long (20000ms > 15000ms)
    const longFormData = createValidMultipartFormData({
      meta: { audioDurationMs: 20000 },
    });
    const longRequest = createMockRequest(longFormData);
    const longResponse = await POST(longRequest);
    expect(longResponse.status).toBe(422);
    const longBody = await longResponse.json();
    expect(longBody.error.code).toBe("AUDIO_VALIDATION_FAILED");
  });

  // ---------------------------------------------------------------------------
  // TC-05: Idempotency Replay (Zero Duplicate XP & Same Result)
  // ---------------------------------------------------------------------------
  it("TC-05: returns 200 OK on duplicate idempotencyKey without double scoring or awarding duplicate XP", async () => {
    const idempotencyKey = "019488a0-7b24-789a-bcde-000000000505";
    const formData1 = createValidMultipartFormData({
      meta: { idempotencyKey, audioDurationMs: 3000 },
    });

    // First request (fresh attempt)
    const res1 = await POST(createMockRequest(formData1));
    expect(res1.status).toBe(200);
    const body1 = await res1.json();

    const statsAfterFirst = await repository.getUserStats(TEST_USER_ID);
    const firstTotalXp = statsAfterFirst!.totalXp;
    expect(firstTotalXp).toBeGreaterThan(1000n);

    // Second request with exact same idempotencyKey
    const formData2 = createValidMultipartFormData({
      meta: { idempotencyKey, audioDurationMs: 3000 },
    });
    const res2 = await POST(createMockRequest(formData2));
    expect(res2.status).toBe(200);
    const body2 = await res2.json();

    // Verify same attempt is returned
    expect(body2.attemptId).toBe(body1.attemptId);
    expect(body2.overallScoreBp).toBe(body1.overallScoreBp);

    // CRITICAL: Total XP and XP ledger must NOT change
    const statsAfterSecond = await repository.getUserStats(TEST_USER_ID);
    expect(statsAfterSecond!.totalXp).toBe(firstTotalXp);

    const ledgerEntries = await repository.getXpLedger(TEST_USER_ID);
    expect(ledgerEntries.length).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // TC-06: SLA Timeout (> 1500ms)
  // ---------------------------------------------------------------------------
  it("TC-06: returns 504 Gateway Timeout when AI Engine exceeds 1500ms SLA and records failed attempt without XP change", async () => {
    const idempotencyKey = "019488a0-7b24-789a-bcde-000000000606";
    // Configure mock AI engine to simulate timeout
    aiClient.setSimulateTimeout(true);

    const formData = createValidMultipartFormData({
      meta: { idempotencyKey, audioDurationMs: 3500 },
    });

    const request = createMockRequest(formData);

    const response = await POST(request);
    expect(response.status).toBe(504);

    const body = await response.json();
    expect(body.error.code).toBe("SCORING_TIMEOUT");

    // Verify attempt recorded with failed status and SCORING_TIMEOUT
    const attempt = await repository.findAttemptByIdempotencyKey(TEST_USER_ID, idempotencyKey);
    expect(attempt).not.toBeNull();
    expect(attempt?.status).toBe("failed");
    expect(attempt?.errorCode).toBe("SCORING_TIMEOUT");

    // Verify zero XP mutation
    const stats = await repository.getUserStats(TEST_USER_ID);
    expect(stats?.totalXp).toBe(1000n);

    const ledger = await repository.getXpLedger(TEST_USER_ID);
    expect(ledger.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // TC-07: ACID Rollback on Transaction Error
  // ---------------------------------------------------------------------------
  it("TC-07: rolls back database transaction completely when a downstream write fails", async () => {
    const idempotencyKey = "019488a0-7b24-789a-bcde-000000000707";
    // Inject failure during transaction write
    repository.setSimulateTransactionError(true);

    const formData = createValidMultipartFormData({
      meta: { idempotencyKey, audioDurationMs: 2500 },
    });

    const request = createMockRequest(formData);

    const response = await POST(request);
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error.code).toBe("INTERNAL_DATABASE_ERROR");

    // Verify complete rollback: no attempt, no phonemes, no XP mutation
    const attempt = await repository.findAttemptByIdempotencyKey(TEST_USER_ID, idempotencyKey);
    expect(attempt).toBeNull();

    const stats = await repository.getUserStats(TEST_USER_ID);
    expect(stats?.totalXp).toBe(1000n);

    const ledger = await repository.getXpLedger(TEST_USER_ID);
    expect(ledger.length).toBe(0);
  });
});
