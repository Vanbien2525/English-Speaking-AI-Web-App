import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { VocabularyHeader } from "@/modules/vocabulary/components/VocabularyHeader";
import { VocabularyTable } from "@/modules/vocabulary/components/VocabularyTable";
import { DailyProgressBar } from "@/modules/vocabulary/components/DailyProgressBar";
import { AppNavbar } from "@/components/navigation/AppNavbar";
import { useVocabularyStore } from "@/modules/vocabulary/stores/useVocabularyStore";

describe("Vocabulary Frontend Micro-Components Suite", () => {
  it("renders VocabularyHeader with initial metrics and triggers review mode toggle", () => {
    // Seed store state for test
    useVocabularyStore.setState({
      metrics: {
        totalWords: 15,
        dueCardsCount: 3,
        masteredWordsCount: 8,
        retentionRateBp: 8500,
      },
      dueItems: [
        {
          id: "019488a0-7b24-789a-bcde-000000000021",
          deckId: "019488a0-7b24-789a-bcde-000000000010",
          userId: "019488a0-7b24-789a-bcde-000000000001",
          word: "articulation",
          ipa: "/ɑːˌtɪk.jəˈleɪ.ʃən/",
          partOfSpeech: "noun",
          definitionVi: "Sự phát âm rõ ràng, chuẩn xác các âm vị",
          exampleSentenceEn: "Clear articulation is vital for effective presentations.",
          exampleSentenceVi: "Phát âm rõ ràng là điều tối quan trọng.",
          articulatoryTipVi: "Nâng nhẹ đầu lưỡi chạm ngạc cứng.",
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
      isReviewing: false,
    });

    render(<VocabularyHeader />);

    expect(screen.getByText("Active Vocabulary & Speaking Mastery")).toBeDefined();
    expect(screen.getByText("15")).toBeDefined(); // Total words
    expect(screen.getByText("8")).toBeDefined(); // Mastered words
    expect(screen.queryByText("Tỷ lệ duy trì (SM-2)")).toBeNull(); // Đã xóa theo yêu cầu 4

    // Requirement 5: Khi ở chế độ luyện tập bỏ hoàn toàn tab xem danh sách từ
    expect(screen.queryByText("Xem Danh Sách Từ")).toBeNull();
    expect(screen.queryByText("+ Tạo Bộ Từ")).toBeNull(); // Đã xóa khỏi header theo yêu cầu 3
    expect(screen.getByText("Nhập 1-Chạm")).toBeDefined();
  });

  it("renders VocabularyTable with word list and British RP button", () => {
    useVocabularyStore.setState({
      decks: [
        {
          id: "019488a0-7b24-789a-bcde-000000000010",
          userId: "019488a0-7b24-789a-bcde-000000000001",
          name: "Bộ Từ Oxford Academic 3000",
          description: "Bộ từ vựng học thuật chuẩn Oxford",
          tags: ["academic"],
          isDefault: true,
          itemCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      selectedDeckId: "019488a0-7b24-789a-bcde-000000000010",
      items: [
        {
          id: "019488a0-7b24-789a-bcde-000000000021",
          deckId: "019488a0-7b24-789a-bcde-000000000010",
          userId: "019488a0-7b24-789a-bcde-000000000001",
          word: "articulation",
          ipa: "ɑːˌtɪk.jəˈleɪ.ʃən",
          partOfSpeech: "noun",
          definitionVi: "Sự phát âm rõ ràng, chuẩn xác các âm vị",
          exampleSentenceEn: "Clear articulation is vital for effective presentations.",
          exampleSentenceVi: "Phát âm rõ ràng là điều tối quan trọng.",
          articulatoryTipVi: "Nâng nhẹ đầu lưỡi chạm ngạc cứng.",
          referenceAudioUrl: null,
          sm2Repetition: 2,
          sm2IntervalDays: 6,
          sm2EaseFactorBp: 2600,
          sm2NextReviewAt: new Date().toISOString(),
          sm2LastReviewedAt: new Date().toISOString(),
          lastMasteryScoreBp: 8900,
          isMastered: true,
          masteryAttemptsCount: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
    });

    render(<VocabularyTable />);

    expect(screen.getByText("articulation")).toBeDefined();
    expect(screen.getByText("/ɑːˌtɪk.jəˈleɪ.ʃən/")).toBeDefined();
    expect(screen.getByText("89/100")).toBeDefined();
    expect(screen.getByTitle("Tự chọn cấp độ")).toBeDefined();
    expect(screen.getByText("🟡 Good (Cấp 2)")).toBeDefined();
    expect(screen.getByText("🔊 Nghe")).toBeDefined();
  });

  it("renders DailyProgressBar with daily progress and smart review button", () => {
    useVocabularyStore.setState({
      dailyPracticedCount: 12,
      dailyGoalCount: 20,
      troubleWords: [
        {
          id: "019488a0-7b24-789a-bcde-000000000021",
          word: "articulation",
          ipa: "/ɑːˌtɪk.jəˈleɪ.ʃən/",
          definitionVi: "Sự phát âm rõ ràng",
          lastMasteryScoreBp: 6500,
          masteryAttemptsCount: 3,
        },
      ],
    });

    render(<DailyProgressBar />);

    expect(screen.getByText("Mục Tiêu Luyện Tập Hàng Ngày")).toBeDefined();
    expect(screen.getByText("(12/20 từ)")).toBeDefined();
    expect(screen.getByText("60%")).toBeDefined();
    // Requirement 4: Bỏ hoàn toàn chức năng ôn tập từ sai nhiều nhất
    expect(screen.queryByText(/Ôn tập từ sai nhiều nhất/)).toBeNull();
  });

  it("renders AppNavbar with 'Từ vựng' navigation and '3D Model (Coming Soon)'", () => {
    render(<AppNavbar />);

    const vocabLinks = screen.getAllByText("Từ vựng");
    expect(vocabLinks.length).toBeGreaterThan(0);

    const comingSoonBadges = screen.getAllByText("Coming Soon");
    expect(comingSoonBadges.length).toBeGreaterThan(0);
  });
});
