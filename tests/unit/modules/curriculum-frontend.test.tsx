import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IpaPhonemeCell } from "@/modules/curriculum/components/IpaPhonemeCell";
import { WeakPhonemeBanner } from "@/modules/curriculum/components/WeakPhonemeBanner";
import { LessonCard } from "@/modules/curriculum/components/LessonCard";
import { LessonFilterBar } from "@/modules/curriculum/components/LessonFilterBar";
import type { IpaPhonemeItemDto, LessonCardDto, PedagogicalRecommendationDto } from "@/core/dto/curriculum.dto";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams("view=lessons"),
}));

describe("Curriculum Frontend Micro-Components Suite", () => {
  const mockPhoneme: IpaPhonemeItemDto = {
    id: "019488a0-7b24-789a-8003-000000000031",
    ipaSymbol: "θ",
    arpabet: "TH",
    category: "consonant",
    isVoiced: false,
    placeOfArticulation: "dental",
    mannerOfArticulation: "fricative",
    exampleWord: "think",
    sortOrder: 31,
    attemptsCount: 8,
    correctCount: 2,
    averageScoreBp: 3500,
    statusColor: "coral",
    lastPracticedAt: "2026-10-20T10:00:00Z",
  };

  const mockLesson: LessonCardDto = {
    id: "019488a0-7b24-789a-8020-000000000001",
    slug: "dental-fricatives-th-dh",
    titleEn: "Dental Fricatives: /θ/ vs /ð/",
    titleVi: "Phân biệt cặp âm xát răng Think & This",
    descriptionVi: "Làm chủ vị trí đầu lưỡi kẹp nhẹ giữa hai hàm răng.",
    cefr: "B1",
    estimatedMinutes: 12,
    xpReward: 50,
    tags: ["dental-fricatives", "b1"],
    categoryTitleVi: "Chuyên Đề Âm Xát Răng",
    focusPhonemes: [
      { id: "019488a0-7b24-789a-8003-000000000031", ipaSymbol: "θ" },
      { id: "019488a0-7b24-789a-8003-000000000032", ipaSymbol: "ð" },
    ],
    userProgress: {
      bestScoreBp: 4200,
      attemptsCount: 3,
      isCompleted: false,
      completedAt: null,
    },
  };

  describe("IpaPhonemeCell", () => {
    it("renders IPA symbol, example word and average score percentage", () => {
      const handleSelect = vi.fn();
      render(<IpaPhonemeCell phoneme={mockPhoneme} onSelect={handleSelect} />);

      expect(screen.getByText("/θ/")).toBeDefined();
      expect(screen.getByText("think")).toBeDefined();
      expect(screen.getByText("35%")).toBeDefined();

      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(handleSelect).toHaveBeenCalledTimes(1);
    });

    it("displays 'Chưa luyện' when attemptsCount is 0", () => {
      const unpracticed: IpaPhonemeItemDto = {
        ...mockPhoneme,
        attemptsCount: 0,
        averageScoreBp: null,
        statusColor: "neutral",
      };
      render(<IpaPhonemeCell phoneme={unpracticed} onSelect={vi.fn()} />);

      expect(screen.getByText("Chưa luyện")).toBeDefined();
    });
  });

  describe("WeakPhonemeBanner", () => {
    it("renders pedagogical message and CTA link", () => {
      const recommendation: PedagogicalRecommendationDto = {
        weakestPhoneme: mockPhoneme,
        recommendedLesson: mockLesson,
        reasonVi: "Điểm phát âm âm /θ/ của bạn hiện đạt 35%. Luyện ngay bài học đề xuất!",
      };

      render(<WeakPhonemeBanner recommendation={recommendation} />);

      expect(screen.getByText("Gợi Ý Sư Phạm Cá Nhân Hóa (AI Advisor)")).toBeDefined();
      expect(screen.getByText("/θ/")).toBeDefined();
      expect(screen.getByText(/Điểm phát âm âm \/θ\/ của bạn hiện đạt 35%/)).toBeDefined();
      expect(screen.getByText("Khắc phục ngay")).toBeDefined();
    });
  });

  describe("LessonCard", () => {
    it("renders CEFR badge, XP reward, and titles correctly", () => {
      render(<LessonCard lesson={mockLesson} />);

      expect(screen.getByText("B1")).toBeDefined();
      expect(screen.getByText("+50 XP")).toBeDefined();
      expect(screen.getByText("Dental Fricatives: /θ/ vs /ð/")).toBeDefined();
      expect(screen.getByText("Phân biệt cặp âm xát răng Think & This")).toBeDefined();
      expect(screen.getByText("42%")).toBeDefined();
      expect(screen.getByText("12p")).toBeDefined();
    });
  });

  describe("LessonFilterBar", () => {
    it("renders search input and CEFR filter buttons", () => {
      render(
        <LessonFilterBar
          activeCefr="B1"
          activeErrorGroup="dental-fricatives"
          searchQuery="think"
        />,
      );

      expect(screen.getByPlaceholderText(/Tìm bài học/i)).toBeDefined();
      expect(screen.getByText("B1")).toBeDefined();
      expect(screen.getByText("#Xát_Răng_/θ/-/ð/")).toBeDefined();
    });
  });
});
