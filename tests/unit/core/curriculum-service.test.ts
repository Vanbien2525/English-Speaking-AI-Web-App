import { describe, expect, it } from "vitest";
import {
  calculateIpaStatusColor,
  calculateAverageScoreBp,
  findWeakestPhoneme,
} from "@/core/services/curriculum-service";
import type { IpaPhonemeItemDto } from "@/core/dto/curriculum.dto";

describe("Curriculum Domain & Service Logic (tests/unit/core/curriculum-service.test.ts)", () => {
  describe("calculateIpaStatusColor", () => {
    it("returns 'neutral' when attemptsCount is 0", () => {
      expect(calculateIpaStatusColor(0, null)).toBe("neutral");
      expect(calculateIpaStatusColor(0, 8500)).toBe("neutral");
    });

    it("returns 'emerald' when averageScoreBp >= 8000 (80.00%)", () => {
      expect(calculateIpaStatusColor(5, 8000)).toBe("emerald");
      expect(calculateIpaStatusColor(1, 10000)).toBe("emerald");
      expect(calculateIpaStatusColor(3, 8500)).toBe("emerald");
    });

    it("returns 'amber' when 6000 <= averageScoreBp < 8000 (60.00% - 79.99%)", () => {
      expect(calculateIpaStatusColor(2, 6000)).toBe("amber");
      expect(calculateIpaStatusColor(10, 7999)).toBe("amber");
      expect(calculateIpaStatusColor(4, 7200)).toBe("amber");
    });

    it("returns 'coral' when averageScoreBp < 6000 (< 60.00%)", () => {
      expect(calculateIpaStatusColor(1, 5999)).toBe("coral");
      expect(calculateIpaStatusColor(3, 3500)).toBe("coral");
      expect(calculateIpaStatusColor(2, 0)).toBe("coral");
    });
  });

  describe("calculateAverageScoreBp (Integer Math)", () => {
    it("returns null when attemptsCount is 0", () => {
      expect(calculateAverageScoreBp(0n, 0)).toBeNull();
    });

    it("performs strict integer division without floating-point drift", () => {
      // 17500 / 2 = 8750
      expect(calculateAverageScoreBp(17500n, 2)).toBe(8750);
      // 10000 / 3 = 3333 (truncated/integer division)
      expect(calculateAverageScoreBp(10000n, 3)).toBe(3333);
      // 0 / 5 = 0
      expect(calculateAverageScoreBp(0n, 5)).toBe(0);
    });
  });

  describe("findWeakestPhoneme", () => {
    const mockPhonemes: IpaPhonemeItemDto[] = [
      {
        id: "019488a0-7b24-789a-bcde-000000000001",
        ipaSymbol: "iː",
        arpabet: "IY",
        category: "monophthong",
        isVoiced: true,
        placeOfArticulation: "palatal",
        mannerOfArticulation: "vowel",
        exampleWord: "see",
        sortOrder: 1,
        attemptsCount: 10,
        correctCount: 9,
        averageScoreBp: 8900,
        statusColor: "emerald",
      },
      {
        id: "019488a0-7b24-789a-bcde-000000000002",
        ipaSymbol: "θ",
        arpabet: "TH",
        category: "consonant",
        isVoiced: false,
        placeOfArticulation: "dental",
        mannerOfArticulation: "fricative",
        exampleWord: "think",
        sortOrder: 21,
        attemptsCount: 5,
        correctCount: 1,
        averageScoreBp: 3200,
        statusColor: "coral",
      },
      {
        id: "019488a0-7b24-789a-bcde-000000000003",
        ipaSymbol: "ð",
        arpabet: "DH",
        category: "consonant",
        isVoiced: true,
        placeOfArticulation: "dental",
        mannerOfArticulation: "fricative",
        exampleWord: "this",
        sortOrder: 22,
        attemptsCount: 4,
        correctCount: 2,
        averageScoreBp: 4500,
        statusColor: "coral",
      },
      {
        id: "019488a0-7b24-789a-bcde-000000000004",
        ipaSymbol: "eə",
        arpabet: null,
        category: "diphthong",
        isVoiced: true,
        placeOfArticulation: "centring",
        mannerOfArticulation: "vowel",
        exampleWord: "chair",
        sortOrder: 14,
        attemptsCount: 0,
        correctCount: 0,
        averageScoreBp: null,
        statusColor: "neutral",
      },
    ];

    it("identifies the practiced phoneme with the lowest averageScoreBp", () => {
      const weakest = findWeakestPhoneme(mockPhonemes);
      expect(weakest).not.toBeNull();
      expect(weakest?.ipaSymbol).toBe("θ");
      expect(weakest?.averageScoreBp).toBe(3200);
    });

    it("returns null or fallback if all phonemes are unpracticed", () => {
      const unpracticedList = mockPhonemes.map((p) => ({
        ...p,
        attemptsCount: 0,
        averageScoreBp: null,
        statusColor: "neutral" as const,
      }));
      const weakest = findWeakestPhoneme(unpracticedList);
      // In cold-start, can return null or default priority phoneme
      expect(weakest === null || weakest?.ipaSymbol === "θ").toBe(true);
    });
  });
});
