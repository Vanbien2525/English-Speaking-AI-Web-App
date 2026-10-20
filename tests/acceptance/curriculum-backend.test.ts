import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryCurriculumRepository } from "@/core/repositories/curriculum-repository";
import { CurriculumService } from "@/core/services/curriculum-service";
import {
  IpaPhonemeItemSchema,
  LessonCardSchema,
  PhonemeDetailDrawerSchema,
} from "@/core/dto/curriculum.dto";

describe("Curriculum Backend Acceptance & Integration Suite (FEAT-IPA-MAP-AND-LESSONS)", () => {
  let repository: InMemoryCurriculumRepository;
  let service: CurriculumService;

  const TEST_USER_ID = "019488a0-7b24-789a-bcde-000000000001";
  const UNPRACTICED_USER_ID = "019488a0-7b24-789a-bcde-000000000099";

  beforeEach(() => {
    repository = new InMemoryCurriculumRepository();
    service = new CurriculumService(repository);

    // Seed test user phoneme mastery
    repository.seedUserPhonemeMastery([
      {
        userId: TEST_USER_ID,
        phonemeIpa: "θ",
        attemptsCount: 10,
        correctCount: 2,
        scoreSumBp: 35000n, // Avg: 3500 (Coral)
        lastPracticedAt: new Date("2026-10-20T10:00:00Z"),
      },
      {
        userId: TEST_USER_ID,
        phonemeIpa: "iː",
        attemptsCount: 8,
        correctCount: 7,
        scoreSumBp: 70400n, // Avg: 8800 (Emerald)
        lastPracticedAt: new Date("2026-10-20T11:00:00Z"),
      },
      {
        userId: TEST_USER_ID,
        phonemeIpa: "ɪ",
        attemptsCount: 5,
        correctCount: 3,
        scoreSumBp: 34000n, // Avg: 6800 (Amber)
        lastPracticedAt: new Date("2026-10-20T12:00:00Z"),
      },
    ]);

    // Seed test user lesson progress
    repository.seedUserLessonProgress([
      {
        userId: TEST_USER_ID,
        lessonSlug: "dental-fricatives-th-dh",
        bestScoreBp: 4200,
        attemptsCount: 3,
        completedAt: null,
      },
      {
        userId: TEST_USER_ID,
        lessonSlug: "vowel-contrast-long-short-i",
        bestScoreBp: 8800,
        attemptsCount: 5,
        completedAt: new Date("2026-10-19T15:30:00Z"),
      },
    ]);
  });

  // ===========================================================================
  // 1. IPA HEATMAP 44 PHONEMES INVENTORY & HEATMAP COLOR GRADING
  // ===========================================================================
  describe("Kịch bản 1: Bản đồ nhiệt 44 âm vị IPA & Phân loại màu Design DNA", () => {
    it("trả về đủ chính xác 44 âm vị chuẩn quốc tế phân bố theo 3 phân khu", async () => {
      const phonemes = await service.getPhonemesWithMastery(TEST_USER_ID);

      expect(phonemes).toHaveLength(44);

      // Verify category distribution
      const monophthongs = phonemes.filter((p) => p.category === "monophthong");
      const diphthongs = phonemes.filter((p) => p.category === "diphthong");
      const consonants = phonemes.filter((p) => p.category === "consonant");

      expect(monophthongs).toHaveLength(12);
      expect(diphthongs).toHaveLength(8);
      expect(consonants).toHaveLength(24);

      // Validate every single item against Zod schema
      for (const phoneme of phonemes) {
        expect(() => IpaPhonemeItemSchema.parse(phoneme)).not.toThrow();
      }
    });

    it("phân loại đúng màu nhiệt OKLCH cho học viên đã luyện tập", async () => {
      const phonemes = await service.getPhonemesWithMastery(TEST_USER_ID);

      const thPhoneme = phonemes.find((p) => p.ipaSymbol === "θ");
      expect(thPhoneme).toBeDefined();
      expect(thPhoneme?.averageScoreBp).toBe(3500);
      expect(thPhoneme?.statusColor).toBe("coral"); // < 6000

      const iLongPhoneme = phonemes.find((p) => p.ipaSymbol === "iː");
      expect(iLongPhoneme).toBeDefined();
      expect(iLongPhoneme?.averageScoreBp).toBe(8800);
      expect(iLongPhoneme?.statusColor).toBe("emerald"); // >= 8000

      const iShortPhoneme = phonemes.find((p) => p.ipaSymbol === "ɪ");
      expect(iShortPhoneme).toBeDefined();
      expect(iShortPhoneme?.averageScoreBp).toBe(6800);
      expect(iShortPhoneme?.statusColor).toBe("amber"); // 6000..7999
    });

    it("gán trạng thái Neutral Slate cho học viên chưa từng luyện tập âm đó", async () => {
      const phonemes = await service.getPhonemesWithMastery(UNPRACTICED_USER_ID);

      expect(phonemes).toHaveLength(44);
      for (const p of phonemes) {
        expect(p.attemptsCount).toBe(0);
        expect(p.correctCount).toBe(0);
        expect(p.averageScoreBp).toBeNull();
        expect(p.statusColor).toBe("neutral");
      }
    });
  });

  // ===========================================================================
  // 2. LESSON CATALOG & MULTI-DIMENSIONAL FILTERING
  // ===========================================================================
  describe("Kịch bản 2: Danh mục bài học CEFR & Lọc theo nhóm tật người Việt", () => {
    it("trả về danh sách bài học kèm tiến độ cá nhân hóa của học viên", async () => {
      const lessons = await service.getLessonsWithProgress(TEST_USER_ID, {
        cefr: "all",
        categorySlug: "all",
        errorGroup: "all",
      });

      expect(lessons.length).toBeGreaterThanOrEqual(4);

      // Validate every lesson with Zod Schema
      for (const lesson of lessons) {
        expect(() => LessonCardSchema.parse(lesson)).not.toThrow();
      }

      // Check progress mapping
      const thLesson = lessons.find((l) => l.slug === "dental-fricatives-th-dh");
      expect(thLesson).toBeDefined();
      expect(thLesson?.userProgress?.bestScoreBp).toBe(4200);
      expect(thLesson?.userProgress?.isCompleted).toBe(false);

      const iLesson = lessons.find((l) => l.slug === "vowel-contrast-long-short-i");
      expect(iLesson).toBeDefined();
      expect(iLesson?.userProgress?.bestScoreBp).toBe(8800);
      expect(iLesson?.userProgress?.isCompleted).toBe(true);
    });

    it("lọc chính xác theo cấp độ CEFR", async () => {
      const b1Lessons = await service.getLessonsWithProgress(TEST_USER_ID, {
        cefr: "B1",
        categorySlug: "all",
        errorGroup: "all",
      });

      expect(b1Lessons.length).toBeGreaterThan(0);
      for (const lesson of b1Lessons) {
        expect(lesson.cefr).toBe("B1");
      }
    });

    it("lọc chính xác theo nhóm tật phát âm người Việt (Ví dụ: dental-fricatives)", async () => {
      const thLessons = await service.getLessonsWithProgress(TEST_USER_ID, {
        cefr: "all",
        categorySlug: "all",
        errorGroup: "dental-fricatives",
      });

      expect(thLessons.length).toBeGreaterThan(0);
      for (const lesson of thLessons) {
        expect(lesson.tags).toContain("dental-fricatives");
      }
    });

    it("lọc theo từ khóa tìm kiếm prompt hoặc tiêu đề", async () => {
      const searchResults = await service.getLessonsWithProgress(TEST_USER_ID, {
        cefr: "all",
        categorySlug: "all",
        errorGroup: "all",
        search: "Thirty-Three",
      });

      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0]!.titleEn).toContain("Thirty-Three");
    });

    it("lọc bài học theo âm vị trọng tâm (phonemeId)", async () => {
      const allPhonemes = await service.getPhonemesWithMastery(TEST_USER_ID);
      const thPhoneme = allPhonemes.find((p) => p.ipaSymbol === "θ")!;

      const filtered = await service.getLessonsWithProgress(TEST_USER_ID, {
        cefr: "all",
        categorySlug: "all",
        errorGroup: "all",
        phonemeId: thPhoneme.id,
      });

      expect(filtered.length).toBeGreaterThan(0);
      for (const lesson of filtered) {
        const hasPhoneme = lesson.focusPhonemes.some((p) => p.id === thPhoneme.id);
        expect(hasPhoneme).toBe(true);
      }
    });
  });

  // ===========================================================================
  // 3. SLIDE-OVER DRAWER PHONEME DETAILS
  // ===========================================================================
  describe("Kịch bản 3: Chi tiết âm vị cho Slide-over Drawer (Mẹo tiếng Việt & Audio)", () => {
    it("trả về thông tin chi tiết đầy đủ của âm vị kèm danh sách bài học liên quan", async () => {
      const allPhonemes = await service.getPhonemesWithMastery(TEST_USER_ID);
      const thPhoneme = allPhonemes.find((p) => p.ipaSymbol === "θ")!;

      const details = await service.getPhonemeDetails(thPhoneme.id, TEST_USER_ID);

      expect(() => PhonemeDetailDrawerSchema.parse(details)).not.toThrow();
      expect(details.ipaSymbol).toBe("θ");
      expect(details.articulationGuideVi).toContain("lưỡi");
      expect(details.commonVnSubstitutions).toContain("s");
      expect(details.commonVnSubstitutions).toContain("t");
      expect(details.relatedLessons.length).toBeGreaterThan(0);
    });

    it("ném lỗi hoặc trả về null khi phoneme ID không tồn tại", async () => {
      const nonExistentId = "019488a0-7b24-789a-bcde-999999999999";
      await expect(service.getPhonemeDetails(nonExistentId, TEST_USER_ID)).rejects.toThrow(
        /Phoneme not found/i,
      );
    });
  });

  // ===========================================================================
  // 4. SMART PEDAGOGICAL RECOMMENDATION
  // ===========================================================================
  describe("Kịch bản 4: Gợi ý sư phạm cá nhân hóa (Smart Pedagogical Advisor)", () => {
    it("tìm đúng âm vị yếu nhất và gợi ý bài học tương ứng cho học viên", async () => {
      const recommendation = await service.getPedagogicalRecommendation(TEST_USER_ID);

      expect(recommendation).not.toBeNull();
      // Test user's weakest practiced is /θ/ (3500 BP)
      expect(recommendation?.weakestPhoneme.ipaSymbol).toBe("θ");
      expect(recommendation?.weakestPhoneme.statusColor).toBe("coral");
      expect(recommendation?.reasonVi).toContain("/θ/");
      expect(recommendation?.recommendedLesson).toBeDefined();
    });
  });

  // ===========================================================================
  // 5. VALIDATION & EDGE CASES
  // ===========================================================================
  describe("Kịch bản 5: DTO Validation & Xử lý ngoại lệ", () => {
    it("xử lý an toàn khi học viên chưa có lượt thực hành nào", async () => {
      const recommendation = await service.getPedagogicalRecommendation(UNPRACTICED_USER_ID);
      // In cold start, system suggests default high-priority Vietnamese error phoneme (e.g. /θ/)
      expect(recommendation?.weakestPhoneme.ipaSymbol).toBe("θ");
    });
  });
});
