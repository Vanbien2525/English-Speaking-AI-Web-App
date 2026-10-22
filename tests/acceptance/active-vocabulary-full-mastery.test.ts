/**
 * Acceptance & Integration Test Suite for Active Vocabulary Full Mastery (FEAT-VOCABULARY-FULL-MASTERY).
 * Verifies:
 * - 3 Default Decks initialization
 * - Trouble Words query (Top 10 mispronounced)
 * - Matching Quiz Generation
 * - Sentence Practice Generation
 * - Vietnamese-to-English Recall Quiz
 * - Manual Level Update (new, learning, mastered)
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  VocabularyService,
  setVocabularyDependencies,
} from "@/core/services/vocabulary-service";
import { InMemoryVocabularyRepository } from "@/core/repositories/vocabulary-repository";
import { GET as getTroubleWordsRoute } from "@/app/api/vocabulary/trouble-words/route";
import { GET as getMatchingQuizRoute } from "@/app/api/vocabulary/quiz/matching/route";
import { GET as getSentencePracticeRoute } from "@/app/api/vocabulary/practice/sentences/route";
import { GET as getViToEnQuizRoute } from "@/app/api/vocabulary/quiz/vi-to-en/route";
import { PATCH as patchItemLevelRoute } from "@/app/api/vocabulary/items/[id]/level/route";

describe("Active Vocabulary Full Mastery Suite (FEAT-VOCABULARY-FULL-MASTERY)", () => {
  let repo: InMemoryVocabularyRepository;
  let service: VocabularyService;
  const defaultUserId = "019488a0-7b24-789a-bcde-000000000001";

  beforeEach(() => {
    repo = new InMemoryVocabularyRepository();
    service = new VocabularyService(repo, defaultUserId);
    setVocabularyDependencies({ vocabRepo: repo, defaultUserId });
  });

  it("VFM-01: Initializes with default system decks including 'Từ mới', 'Đang học', 'Đã thuộc'", async () => {
    const decks = await service.getDecks();
    expect(decks.length).toBeGreaterThanOrEqual(3);
    const deckNames = decks.map((d) => d.name);
    expect(deckNames).toContain("Từ mới");
    expect(deckNames).toContain("Đang học");
    expect(deckNames).toContain("Đã thuộc");
  });

  it("VFM-02: Retrieves trouble words via service and GET /api/vocabulary/trouble-words", async () => {
    // 1. Service test
    const troubleWords = await service.getTroubleWords(5);
    expect(Array.isArray(troubleWords)).toBe(true);
    expect(troubleWords.length).toBeGreaterThan(0);
    expect(troubleWords[0]?.word).toBeDefined();

    // 2. API Route test
    const req = new Request("http://localhost:3000/api/vocabulary/trouble-words?limit=5");
    const res = await getTroubleWordsRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.words).toBeDefined();
    expect(Array.isArray(data.words)).toBe(true);
  });

  it("VFM-03: Generates matching quiz pairs via service and GET /api/vocabulary/quiz/matching", async () => {
    // 1. Service test
    const pairs = await service.getMatchingQuiz(undefined, 4);
    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs[0]).toHaveProperty("word");
    expect(pairs[0]).toHaveProperty("definitionVi");

    // 2. API Route test
    const req = new Request("http://localhost:3000/api/vocabulary/quiz/matching?limit=4");
    const res = await getMatchingQuizRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.pairs).toBeDefined();
    expect(data.pairs.length).toBeGreaterThan(0);
  });

  it("VFM-04: Generates sentence practice items via service and GET /api/vocabulary/practice/sentences", async () => {
    // 1. Service test
    const sentences = await service.getSentencePracticeList(undefined, 3);
    expect(sentences.length).toBeGreaterThan(0);
    expect(sentences[0]).toHaveProperty("sentenceEn");
    expect(sentences[0]).toHaveProperty("sentenceVi");

    // 2. API Route test
    const req = new Request("http://localhost:3000/api/vocabulary/practice/sentences?limit=3");
    const res = await getSentencePracticeRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sentences).toBeDefined();
    expect(data.sentences.length).toBeGreaterThan(0);
  });

  it("VFM-05: Generates Vietnamese-to-English quiz questions via GET /api/vocabulary/quiz/vi-to-en", async () => {
    const req = new Request("http://localhost:3000/api/vocabulary/quiz/vi-to-en?limit=3");
    const res = await getViToEnQuizRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.questions).toBeDefined();
    expect(data.questions.length).toBeGreaterThan(0);
    expect(data.questions[0]).toHaveProperty("targetWord");
    expect(data.questions[0]).toHaveProperty("definitionVi");
    expect(data.questions[0]).toHaveProperty("hintFirstLetter");
  });

  it("VFM-06: Updates item level manually via PATCH /api/vocabulary/items/[id]/level", async () => {
    const items = await service.getItems();
    expect(items.length).toBeGreaterThan(0);
    const targetItem = items[0]!;

    // Change to 'mastered'
    const patchReq = new Request(`http://localhost:3000/api/vocabulary/items/${targetItem.id}/level`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: "mastered" }),
    });

    const res = await patchItemLevelRoute(patchReq, {
      params: Promise.resolve({ id: targetItem.id }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.item.isMastered).toBe(true);
    expect(data.item.sm2IntervalDays).toBe(7);
  });
});
