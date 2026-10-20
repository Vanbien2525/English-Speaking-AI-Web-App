import type {
  IpaPhonemeItemDto,
  IpaStatusColor,
  LessonCardDto,
  LessonCatalogFilterDto,
  PhonemeDetailDrawerDto,
  PedagogicalRecommendationDto,
} from "@/core/dto/curriculum.dto";
import type { CurriculumRepository } from "@/core/repositories/curriculum-repository";
import { InMemoryCurriculumRepository } from "@/core/repositories/curriculum-repository";
import { DEFAULT_SEVERITY_THRESHOLDS } from "@/core/domain/scoring";

// -----------------------------------------------------------------------------
// Pure Domain Helper Functions
// -----------------------------------------------------------------------------

/**
 * Calculates the OKLCH semantic status color based on attempts count and average score.
 * - attemptsCount === 0: "neutral" (unpracticed)
 * - score >= 8000: "emerald" (proficient)
 * - 6000 <= score < 8000: "amber" (minor drift)
 * - score < 6000: "coral" (major error/needs improvement)
 */
export function calculateIpaStatusColor(
  attemptsCount: number,
  averageScoreBp: number | null,
): IpaStatusColor {
  if (attemptsCount === 0 || averageScoreBp === null) {
    return "neutral";
  }
  if (averageScoreBp >= DEFAULT_SEVERITY_THRESHOLDS.goodMinBp) {
    return "emerald";
  }
  if (averageScoreBp >= DEFAULT_SEVERITY_THRESHOLDS.minorMinBp) {
    return "amber";
  }
  return "coral";
}

/**
 * Computes average score in basis points (0..10000) using integer math.
 * Avoids any floating point inaccuracies.
 */
export function calculateAverageScoreBp(
  scoreSumBp: bigint,
  attemptsCount: number,
): number | null {
  if (attemptsCount <= 0) {
    return null;
  }
  const avg = scoreSumBp / BigInt(attemptsCount);
  return Number(avg);
}

/**
 * Finds the practiced phoneme with the lowest average score for targeted remediation.
 * If user is in cold-start (0 attempts across all phonemes), falls back to high-friction
 * Vietnamese phonetic hurdle (/θ/ or first consonant).
 */
export function findWeakestPhoneme(phonemes: IpaPhonemeItemDto[]): IpaPhonemeItemDto | null {
  if (phonemes.length === 0) return null;

  const practiced = phonemes.filter(
    (p) => p.attemptsCount > 0 && p.averageScoreBp !== null,
  );

  if (practiced.length > 0) {
    // Sort ascending by score
    practiced.sort((a, b) => (a.averageScoreBp ?? 0) - (b.averageScoreBp ?? 0));
    return practiced[0] ?? null;
  }

  // Cold start fallback: find dental fricative /θ/ or first phoneme
  const thFallback = phonemes.find((p) => p.ipaSymbol === "θ");
  return thFallback ?? phonemes[0] ?? null;
}

// -----------------------------------------------------------------------------
// Curriculum Service Implementation
// -----------------------------------------------------------------------------

export class CurriculumService {
  constructor(private readonly repository: CurriculumRepository) {}

  async getPhonemesWithMastery(userId: string): Promise<IpaPhonemeItemDto[]> {
    return this.repository.getPhonemesWithMastery(userId);
  }

  async getLessonsWithProgress(
    userId: string,
    filter: LessonCatalogFilterDto,
  ): Promise<LessonCardDto[]> {
    return this.repository.getLessonsWithProgress(userId, filter);
  }

  async getPhonemeDetails(phonemeId: string, userId: string): Promise<PhonemeDetailDrawerDto> {
    return this.repository.getPhonemeDetails(phonemeId, userId);
  }

  async getPedagogicalRecommendation(
    userId: string,
  ): Promise<PedagogicalRecommendationDto | null> {
    const phonemes = await this.getPhonemesWithMastery(userId);
    const weakest = findWeakestPhoneme(phonemes);

    if (!weakest) {
      return null;
    }

    // Find a lesson that targets this weak phoneme
    const matchingLessons = await this.getLessonsWithProgress(userId, {
      cefr: "all",
      categorySlug: "all",
      errorGroup: "all",
      phonemeId: weakest.id,
    });

    const recommendedLesson = matchingLessons[0] ?? null;

    let reasonVi: string;
    if (weakest.attemptsCount > 0 && weakest.averageScoreBp !== null) {
      const displayScore = Math.round(weakest.averageScoreBp / 100);
      reasonVi = `Điểm phát âm âm /${weakest.ipaSymbol}/ của bạn hiện đạt ${displayScore}%. Hãy luyện ngay bài học đề xuất để nâng cao độ chuẩn xác khẩu hình!`;
    } else {
      reasonVi = `Khởi đầu lộ trình với âm xát răng /${weakest.ipaSymbol}/ - điểm nghẽn phát âm phổ biến nhất của người học Việt Nam!`;
    }

    return {
      weakestPhoneme: weakest,
      recommendedLesson,
      reasonVi,
    };
  }
}

// -----------------------------------------------------------------------------
// Singleton Provider for Server Components & Runtime
// -----------------------------------------------------------------------------

let globalCurriculumService: CurriculumService | null = null;

export function getCurriculumService(repository?: CurriculumRepository): CurriculumService {
  if (repository) {
    return new CurriculumService(repository);
  }
  if (!globalCurriculumService) {
    globalCurriculumService = new CurriculumService(new InMemoryCurriculumRepository());
  }
  return globalCurriculumService;
}
