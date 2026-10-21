import { describe, it, expect, beforeEach } from "vitest";
import { POST as enrichPost } from "@/app/api/vocabulary/enrich/route";
import { POST as batchImportPost } from "@/app/api/vocabulary/batch-import/route";
import { GET as getDueReview } from "@/app/api/vocabulary/review/due/route";
import { POST as submitReviewPost } from "@/app/api/vocabulary/review/submit/route";
import { InMemoryVocabularyRepository } from "@/core/repositories/vocabulary-repository";
import { setVocabularyDependencies } from "@/core/services/vocabulary-service";

describe("Active Vocabulary & 3D Flashcards Backend Acceptance Suite (FEAT-ACTIVE-VOCABULARY-3D)", () => {
  let vocabRepo: InMemoryVocabularyRepository;
  const defaultUserId = "019488a0-7b24-789a-bcde-000000000001";
  const defaultDeckId = "019488a0-7b24-789a-bcde-000000000010";

  beforeEach(() => {
    vocabRepo = new InMemoryVocabularyRepository();
    vocabRepo.seedUserStats(defaultUserId, 100n);
    setVocabularyDependencies({
      vocabRepo,
      defaultUserId,
    });
  });

  it("TC-VOCAB-01: Auto-enriches single word via POST /api/vocabulary/enrich", async () => {
    const request = new Request("http://localhost:3000/api/vocabulary/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: "articulation" }),
    });

    const response = await enrichPost(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.word).toBe("articulation");
    expect(data.ipa).toContain("tɪk");
    expect(data.definitionVi).toContain("phát âm");
    expect(data.exampleSentenceEn).toBeDefined();
    expect(data.articulatoryTipVi).toBeDefined();
  });

  it("TC-VOCAB-02: Rejects invalid or empty word payload with 400 Bad Request", async () => {
    const request = new Request("http://localhost:3000/api/vocabulary/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: "   " }),
    });

    const response = await enrichPost(request);
    expect(response.status).toBe(400);

    const errorData = await response.json();
    expect(errorData.error.code).toBe("INVALID_PAYLOAD");
  });

  it("TC-VOCAB-03: Processes batch multi-word import via POST /api/vocabulary/batch-import", async () => {
    const rawText = "1. eloquent, 2. resilience, 3. ubiquitous";
    const request = new Request("http://localhost:3000/api/vocabulary/batch-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deckId: defaultDeckId,
        rawText,
      }),
    });

    const response = await batchImportPost(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.totalProcessed).toBe(3);
    expect(data.successCount).toBe(3);
    expect(data.errorCount).toBe(0);
    expect(data.results.length).toBe(3);

    // Verify words stored in repo
    const items = await vocabRepo.findItemsByDeckId(defaultDeckId);
    expect(items.some((i) => i.word === "eloquent")).toBe(true);
    expect(items.some((i) => i.word === "ubiquitous")).toBe(true);
  });

  it("TC-VOCAB-04: Returns due cards and vocabulary metrics via GET /api/vocabulary/review/due", async () => {
    const response = await getDueReview();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("dueItems");
    expect(data).toHaveProperty("metrics");
    expect(data.metrics.totalWords).toBeGreaterThan(0);
    expect(data.dueItems.length).toBeGreaterThan(0);
    expect(data.dueItems[0].word).toBe("articulation"); // Seeded card due today
  });

  it("TC-VOCAB-05: Submits passing speaking review (score >= 8000 bp) and advances SM-2 interval", async () => {
    const itemId = "019488a0-7b24-789a-bcde-000000000021"; // "articulation"
    const idempotencyKey = "019488a0-7b24-789a-bcde-000000000099";

    const request = new Request("http://localhost:3000/api/vocabulary/review/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vocabularyItemId: itemId,
        idempotencyKey,
        pronunciationScoreBp: 8800, // 88% -> quality q = 4
        audioDurationMs: 1400,
      }),
    });

    const response = await submitReviewPost(request);
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.isPassed).toBe(true);
    expect(result.qualityGrade).toBe(4);
    expect(result.xpAwarded).toBe(15);
    expect(result.repetitionCountAfter).toBe(1);

    // Verify item updated in repository
    const updated = await vocabRepo.findItemById(itemId);
    expect(updated?.isMastered).toBe(true);
    expect(updated?.lastMasteryScoreBp).toBe(8800);

    // Verify XP ledger entry saved
    const ledger = await vocabRepo.getXpLedger(defaultUserId);
    expect(ledger.some((entry) => entry.source === "flashcard_mastery" && entry.amount === 15n)).toBe(true);
  });

  it("TC-VOCAB-06: Submits failing speaking review (score < 8000 bp) and resets SM-2 repetition", async () => {
    const itemId = "019488a0-7b24-789a-bcde-000000000022"; // "resilience", initial rep = 1
    const idempotencyKey = "019488a0-7b24-789a-bcde-000000000098";

    const request = new Request("http://localhost:3000/api/vocabulary/review/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vocabularyItemId: itemId,
        idempotencyKey,
        pronunciationScoreBp: 6500, // 65% < 80% threshold -> quality q = 2
        audioDurationMs: 1200,
      }),
    });

    const response = await submitReviewPost(request);
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.isPassed).toBe(false);
    expect(result.qualityGrade).toBe(2);
    expect(result.xpAwarded).toBe(0);
    expect(result.repetitionCountAfter).toBe(0); // Reset to 0
    expect(result.intervalDaysAfter).toBe(1); // Interval reset to 1 day

    // Verify item updated with failure
    const updated = await vocabRepo.findItemById(itemId);
    expect(updated?.sm2Repetition).toBe(0);
    expect(updated?.sm2IntervalDays).toBe(1);
    expect(updated?.lastMasteryScoreBp).toBe(6500);
  });

  it("TC-VOCAB-07: Idempotency protects against duplicate review submissions", async () => {
    const itemId = "019488a0-7b24-789a-bcde-000000000021";
    const idempotencyKey = "019488a0-7b24-789a-bcde-000000000077";

    const payload = {
      vocabularyItemId: itemId,
      idempotencyKey,
      pronunciationScoreBp: 9200, // q = 5 -> 25 XP
      audioDurationMs: 1500,
    };

    // First attempt
    const res1 = await submitReviewPost(
      new Request("http://localhost:3000/api/vocabulary/review/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    expect(res1.status).toBe(200);

    const ledgerAfter1 = await vocabRepo.getXpLedger(defaultUserId);
    const count1 = ledgerAfter1.filter((l) => l.source === "flashcard_mastery").length;

    // Duplicate attempt with exact same idempotency key
    const res2 = await submitReviewPost(
      new Request("http://localhost:3000/api/vocabulary/review/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    expect(res2.status).toBe(200);

    const ledgerAfter2 = await vocabRepo.getXpLedger(defaultUserId);
    const count2 = ledgerAfter2.filter((l) => l.source === "flashcard_mastery").length;

    // No duplicate XP entry was created
    expect(count2).toBe(count1);
  });
});
