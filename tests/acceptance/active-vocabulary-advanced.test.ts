import { describe, it, expect, beforeEach } from "vitest";
import { VocabularyService } from "@/core/services/vocabulary-service";
import { InMemoryVocabularyRepository } from "@/core/repositories/vocabulary-repository";
import { generateArticulatoryTip } from "@/core/services/dictionary-data";
import { GET as getListeningQuiz } from "@/app/api/vocabulary/quiz/listening/route";
import { GET as getClozeQuiz } from "@/app/api/vocabulary/quiz/cloze/route";
import { setVocabularyDependencies } from "@/core/services/vocabulary-service";
import { useVocabularyStore } from "@/modules/vocabulary/stores/useVocabularyStore";

describe("Active Vocabulary & Speaking Mastery Advanced Suite (FEAT-VOCABULARY-6-ENHANCEMENTS)", () => {
  let repo: InMemoryVocabularyRepository;
  let service: VocabularyService;
  const userId = "019488a0-7b24-789a-bcde-000000000001";
  const defaultDeckId = "019488a0-7b24-789a-bcde-000000000010";

  beforeEach(() => {
    repo = new InMemoryVocabularyRepository();
    service = new VocabularyService(repo, userId);
    setVocabularyDependencies({ vocabRepo: repo, defaultUserId: userId });
  });

  it("ADV-01: Correctly enriches words from academic dictionary with authentic Vietnamese definitions and IPA", async () => {
    // Test 'power'
    const powerResult = await service.enrichWord("power");
    expect(powerResult.word).toBe("power");
    expect(powerResult.ipa).toContain("paʊ");
    expect(powerResult.definitionVi).toContain("Sức mạnh");
    expect(powerResult.exampleSentenceVi).toBeDefined();
    expect(powerResult.articulatoryTipVi).toBeDefined();

    // Test 'good'
    const goodResult = await service.enrichWord("good");
    expect(goodResult.word).toBe("good");
    expect(goodResult.ipa).toContain("ɡʊd");
    expect(goodResult.definitionVi).toContain("Tốt");
  });

  it("ADV-02: Enforces 3-Level Anki SM-2 transitions for Again, Good, and Easy", async () => {
    const item = await repo.createItem({
      deckId: defaultDeckId,
      userId,
      word: "power",
      ipa: "ˈpaʊ.ər",
      definitionVi: "Sức mạnh, quyền lực",
      exampleSentenceEn: "Knowledge is power.",
      exampleSentenceVi: "Tri thức là sức mạnh.",
    });

    // 1. Again (Level 1)
    const againResult = await service.submitSpeakingReview({
      vocabularyItemId: item.id,
      idempotencyKey: "019488a0-7b24-789a-bcde-000000000101",
      pronunciationScoreBp: 5000,
      audioDurationMs: 1200,
      reviewLevel: "again",
    });
    expect(againResult.masteryLevel).toBe(1);
    expect(againResult.isPassed).toBe(false);
    expect(againResult.intervalDaysAfter).toBe(1);
    expect(againResult.xpAwarded).toBe(0);

    // 2. Good (Level 2)
    const goodResult = await service.submitSpeakingReview({
      vocabularyItemId: item.id,
      idempotencyKey: "019488a0-7b24-789a-bcde-000000000102",
      pronunciationScoreBp: 8500,
      audioDurationMs: 1200,
      reviewLevel: "good",
    });
    expect(goodResult.masteryLevel).toBe(2);
    expect(goodResult.isPassed).toBe(true);
    expect(goodResult.intervalDaysAfter).toBeGreaterThanOrEqual(1);
    expect(goodResult.xpAwarded).toBe(15);

    // 3. Easy (Level 3)
    const easyResult = await service.submitSpeakingReview({
      vocabularyItemId: item.id,
      idempotencyKey: "019488a0-7b24-789a-bcde-000000000103",
      pronunciationScoreBp: 9500,
      audioDurationMs: 1200,
      reviewLevel: "easy",
    });
    expect(easyResult.masteryLevel).toBe(3);
    expect(easyResult.isPassed).toBe(true);
    expect(easyResult.intervalDaysAfter).toBeGreaterThanOrEqual(7);
    expect(easyResult.xpAwarded).toBe(25);
  });

  it("ADV-03: Creates and isolates vocabulary decks with folders", async () => {
    const newDeck = await service.createDeck({
      name: "IELTS Part 2 Cue Cards",
      description: "Thư mục các từ vựng mô tả sự kiện và trải nghiệm",
      tags: ["IELTS", "Speaking"],
    });

    expect(newDeck.id).toBeDefined();
    expect(newDeck.name).toBe("IELTS Part 2 Cue Cards");

    const decks = await service.getDecks();
    expect(decks.some((d) => d.id === newDeck.id)).toBe(true);
  });

  it("ADV-04: Generates Listening Multiple-Choice Quiz questions with distractors", async () => {
    // Seed extra words into default deck
    await service.batchImport({
      deckId: defaultDeckId,
      rawText: "fluent, confidence, practice",
    });

    const request = new Request(`http://localhost:3000/api/vocabulary/quiz/listening?deckId=${defaultDeckId}&limit=3`);
    const response = await getListeningQuiz(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.questions.length).toBeGreaterThanOrEqual(2);
    expect(data.questions[0].options.length).toBe(4);
    expect(data.questions[0].options).toContain(data.questions[0].correctAnswer);
  });

  it("ADV-05: Generates Fill-in-the-Blank Cloze Spelling Questions with IPA hints", async () => {
    const request = new Request(`http://localhost:3000/api/vocabulary/quiz/cloze?deckId=${defaultDeckId}&limit=2`);
    const response = await getClozeQuiz(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.questions.length).toBeGreaterThanOrEqual(1);
    expect(data.questions[0].sentenceWithBlank).toContain("_____");
    expect(data.questions[0].hintIpa).toBeDefined();
  });

  it("ADV-06: Prioritizes British RP IPA transcriptions and produces dynamic articulatory tips", async () => {
    const exampleRes = await service.enrichWord("example");
    expect(exampleRes.ipa).toBe("/ɪɡˈzɑːm.pəl/");

    const danceRes = await service.enrichWord("dance");
    expect(danceRes.ipa).toBe("/dɑːns/");

    const carRes = await service.enrichWord("car");
    expect(carRes.ipa).toBe("/kɑː/");

    const waterRes = await service.enrichWord("water");
    expect(waterRes.ipa).toBe("/ˈwɔː.tə/");

    // Verify generateArticulatoryTip for dental fricatives and open jaw
    const tip = generateArticulatoryTip("think", "/θɪŋk/");
    expect(tip).toContain("xát răng");
    expect(tip).not.toBe("Đặt khẩu hình tự nhiên...");
  });

  it("ADV-07: Enforces duplicate prevention rule (word, partOfSpeech) while allowing different parts of speech", async () => {
    await repo.createItem({
      deckId: defaultDeckId,
      userId,
      word: "run",
      partOfSpeech: "verb",
      ipa: "rʌn",
      definitionVi: "Chạy, di chuyển nhanh",
      exampleSentenceEn: "I run every morning.",
      exampleSentenceVi: "Tôi chạy mỗi sáng.",
    });

    // Allowing same word with DIFFERENT part of speech (noun)
    const runNoun = await repo.createItem({
      deckId: defaultDeckId,
      userId,
      word: "run",
      partOfSpeech: "noun",
      ipa: "rʌn",
      definitionVi: "Chuyến chạy, đợt vận hành",
      exampleSentenceEn: "He went for a 5km run.",
      exampleSentenceVi: "Anh ấy đi chạy 5km.",
    });
    expect(runNoun.id).toBeDefined();

    // Rejecting duplicate entry with identical (word, partOfSpeech)
    await expect(
      repo.createItem({
        deckId: defaultDeckId,
        userId,
        word: "run",
        partOfSpeech: "verb",
        ipa: "rʌn",
        definitionVi: "Chạy",
        exampleSentenceEn: "She can run fast.",
        exampleSentenceVi: "Cô ấy có thể chạy nhanh.",
      })
    ).rejects.toThrow(/đã tồn tại trong bộ từ này/);
  });

  it("ADV-08: Performs 0ms real-time state synchronization on manual level updates and deletions", () => {
    const store = useVocabularyStore.getState();

    // Initialize store state
    useVocabularyStore.setState({
      items: [
        {
          id: "item-1",
          deckId: defaultDeckId,
          userId,
          word: "practice",
          ipa: "ˈpræk.tɪs",
          partOfSpeech: "noun",
          definitionVi: "Luyện tập",
          exampleSentenceEn: "Practice makes perfect.",
          exampleSentenceVi: "Luyện tập tạo nên sự hoàn hảo.",
          articulatoryTipVi: null,
          referenceAudioUrl: null,
          sm2Repetition: 0,
          sm2IntervalDays: 1,
          sm2EaseFactorBp: 2500,
          sm2NextReviewAt: new Date().toISOString(),
          sm2LastReviewedAt: null,
          lastMasteryScoreBp: null,
          isMastered: false,
          masteryAttemptsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      metrics: {
        totalWords: 1,
        dueCardsCount: 1,
        masteredWordsCount: 0,
        retentionRateBp: 0,
      },
    });

    // 1. Update level manually to mastered
    store.updateItemLevelManual("item-1", true, 8500);

    let updatedState = useVocabularyStore.getState();
    expect(updatedState.items[0]?.isMastered).toBe(true);
    expect(updatedState.metrics.masteredWordsCount).toBe(1);
    expect(updatedState.metrics.retentionRateBp).toBe(10000);

    // 2. Delete item
    store.deleteItem("item-1");

    updatedState = useVocabularyStore.getState();
    expect(updatedState.items.length).toBe(0);
    expect(updatedState.metrics.totalWords).toBe(0);
    expect(updatedState.metrics.masteredWordsCount).toBe(0);
  });
});
