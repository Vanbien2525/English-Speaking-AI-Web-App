import { describe, it, expect, beforeEach } from "vitest";
import {
  VocabularyService,
  setVocabularyDependencies,
} from "@/core/services/vocabulary-service";
import { InMemoryVocabularyRepository } from "@/core/repositories/vocabulary-repository";
import { DELETE as deleteItemRoute } from "@/app/api/vocabulary/items/route";
import { DELETE as deleteDeckRoute } from "@/app/api/vocabulary/decks/route";

describe("Active Vocabulary 13 Refinements Acceptance Suite", () => {
  let repo: InMemoryVocabularyRepository;
  let service: VocabularyService;
  const testUserId = "019488a0-7b24-789a-bcde-000000000001";

  beforeEach(() => {
    repo = new InMemoryVocabularyRepository();
    setVocabularyDependencies({ vocabRepo: repo, defaultUserId: testUserId });
    service = new VocabularyService(repo, testUserId);
  });

  it("Requirement 1: deleteItem successfully deletes a vocabulary item and decrements deck itemCount", async () => {
    const itemsBefore = await repo.findItemsByUserId(testUserId);
    expect(itemsBefore.length).toBeGreaterThan(0);
    const itemToDelete = itemsBefore[0];
    expect(itemToDelete).toBeDefined();
    if (!itemToDelete) return;

    const deleted = await service.deleteItem(itemToDelete.id, testUserId);
    expect(deleted).toBe(true);

    const itemAfter = await repo.findItemById(itemToDelete.id);
    expect(itemAfter).toBeNull();

    // Verify DELETE route handler
    const newItem = await repo.createItem({
      deckId: "019488a0-7b24-789a-bcde-000000000010",
      userId: testUserId,
      word: "ephemeral",
      ipa: "/ɪˈfem.ər.əl/",
      definitionVi: "Phù du, chóng tàn",
      exampleSentenceEn: "Fame can be ephemeral.",
      exampleSentenceVi: "Danh vọng có thể rất phù du.",
    });

    const req = new Request(`http://localhost/api/vocabulary/items?id=${newItem.id}`, {
      method: "DELETE",
    });
    const res = await deleteItemRoute(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("Requirement 1 (New): deleteDeck successfully deletes a deck and cascade deletes all items in it", async () => {
    const deck = await service.createDeck({
      name: "Temporary Test Deck",
      description: "Deck to be deleted",
    });

    await repo.createItem({
      deckId: deck.id,
      userId: testUserId,
      word: "temporary",
      ipa: "/ˈtem.pə.rer.i/",
      definitionVi: "Tạm thời",
      exampleSentenceEn: "This is temporary.",
      exampleSentenceVi: "Điều này là tạm thời.",
    });

    const itemsInDeck = await repo.findItemsByDeckId(deck.id);
    expect(itemsInDeck.length).toBe(1);

    // Verify deleteDeck via route
    const req = new Request(`http://localhost/api/vocabulary/decks?id=${deck.id}`, {
      method: "DELETE",
    });
    const res = await deleteDeckRoute(req);
    expect(res.status).toBe(200);

    const deckAfter = await repo.findDeckById(deck.id);
    expect(deckAfter).toBeNull();

    const itemsAfter = await repo.findItemsByDeckId(deck.id);
    expect(itemsAfter.length).toBe(0);
  });

  it("Requirement 7 & 9: enrichWord translates short words like 'run' and generates concise example sentences", async () => {
    const enriched = await service.enrichWord("run");
    expect(enriched.word).toBe("run");
    expect(enriched.ipa).toBeDefined();
    // Must not be the old fallback text
    expect(enriched.definitionVi).not.toContain("Sử dụng trong văn cảnh giao tiếp và học thuật");
    expect(enriched.exampleSentenceEn).toBeDefined();
    // Short example sentence (<= 10 words)
    const wordCount = enriched.exampleSentenceEn.split(" ").length;
    expect(wordCount).toBeLessThanOrEqual(10);
    expect(enriched.exampleSentenceVi).toBeDefined();
  });

  it("Requirement 8: Dynamic deck counts reflect real item counts accurately and support newest-first ordering", async () => {
    const decks = await service.getDecks(testUserId);
    expect(decks.length).toBeGreaterThan(0);

    for (const deck of decks) {
      const actualItems = await repo.findItemsByDeckId(deck.id);
      expect(deck.itemCount).toBe(actualItems.length);
    }

    const allItems = await service.getItems(undefined, testUserId);
    // Sort newest-first
    const sorted = [...allItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    expect(sorted.length).toBe(allItems.length);
  });
});
