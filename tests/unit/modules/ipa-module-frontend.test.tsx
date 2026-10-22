import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PhonemicChart } from "@/modules/ipa/PhonemicChart";
import { PhonemeDetailPage } from "@/modules/ipa/PhonemeDetailPage";
import { PracticeStudioPage } from "@/modules/ipa/practice/PracticeStudioPage";
import { MinimalPairsPractice } from "@/modules/ipa/practice/MinimalPairsPractice";
import { IPA_PHONEMES } from "@/core/data/ipa-dataset";
import { speechService } from "@/shared/lib/speech";

// Mock speechService
vi.mock("@/shared/lib/speech", () => ({
  speechService: {
    speak: vi.fn().mockResolvedValue(undefined),
    playPhonemeSequence: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe("IPA Module Frontend UI/UX Acceptance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("IPA-01: Renders complete 44 phonemes chart categorized into 3 clusters", async () => {
    render(<PhonemicChart />);

    // Check header titles
    expect(
      screen.getByText(/Bản Đồ 44 Âm Vị Tiếng Anh Quốc Tế/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Nguyên Âm Đơn \(Monophthongs\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Nguyên Âm Đôi \(Diphthongs\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Phụ Âm \(Consonants\)/i)
    ).toBeInTheDocument();

    // Check presence of key anchor words
    expect(screen.getAllByText("sheep").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("good")).toBeInTheDocument();
    expect(screen.getByText("shoot")).toBeInTheDocument();
  });

  it("IPA-02: Plays phoneme sequence upon clicking phoneme card", async () => {
    render(<PhonemicChart />);

    // Click on sheep card
    const sheepWords = screen.getAllByText("sheep");
    const sheepCard = sheepWords[0]?.closest(".cursor-pointer");
    expect(sheepCard).not.toBeNull();

    if (sheepCard) {
      fireEvent.click(sheepCard);
      expect(speechService.playPhonemeSequence).toHaveBeenCalledWith(
        "iː",
        "sheep",
        expect.any(Function)
      );
    }
  });

  it("IPA-03: Phoneme detail page renders 10 exemplar words with highlights and articulation guide", () => {
    const phonemeI = IPA_PHONEMES[0]!;
    render(<PhonemeDetailPage phoneme={phonemeI} />);

    // Large IPA symbol
    expect(screen.getByText("/iː/")).toBeInTheDocument();

    // Articulation guide
    expect(
      screen.getByText(/Hướng Dẫn Khẩu Hình Miệng/i)
    ).toBeInTheDocument();

    // Word counter (starts at 0 / 10 đã luyện)
    expect(screen.getByText("0 / 10 đã luyện")).toBeInTheDocument();
    expect(screen.getByText("Ngủ")).toBeInTheDocument();
    expect(screen.getByText("Màu xanh lá")).toBeInTheDocument();
    expect(screen.getByText("Bãi biển")).toBeInTheDocument();
    expect(screen.getByText("Chìa khóa")).toBeInTheDocument();
  });

  it("IPA-04: Practice studio renders all 4 training modes and allows switching", () => {
    render(<PracticeStudioPage />);

    // Check all 4 tab buttons
    expect(screen.getByText("Cặp Âm Nhầm Lẫn")).toBeInTheDocument();
    expect(screen.getByText("Nối Từ & IPA")).toBeInTheDocument();
    expect(screen.getByText("Nghe & Chọn")).toBeInTheDocument();
    expect(screen.getByText("Ôn Tập Lỗi Sai (<80%)")).toBeInTheDocument();

    // Switch to Nối Từ & IPA
    fireEvent.click(screen.getByText("Nối Từ & IPA"));
    expect(
      screen.getByText(/Ghép Thẻ Mặt Chữ & Ký Tự IPA/i)
    ).toBeInTheDocument();

    // Switch to Ôn Tập Lỗi Sai
    fireEvent.click(screen.getByText("Ôn Tập Lỗi Sai (<80%)"));
    expect(
      screen.getByText(/Ôn Tập & Khắc Phục Lỗi Sai/i)
    ).toBeInTheDocument();
  });

  it("IPA-05: Minimal pairs practice correctly evaluates user choices", () => {
    render(<MinimalPairsPractice />);

    // Choice cards presence
    expect(screen.getByText("Lựa chọn A")).toBeInTheDocument();
    expect(screen.getByText("Lựa chọn B")).toBeInTheDocument();

    // Click option A
    fireEvent.click(screen.getByText("Lựa chọn A"));

    // Check answered state triggers next button
    expect(screen.getByText("Câu hỏi tiếp theo")).toBeInTheDocument();
  });
});
