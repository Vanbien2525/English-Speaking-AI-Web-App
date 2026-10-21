/**
 * SuperMemo SM-2 Spaced Repetition Algorithm Implementation.
 * Enforces integer arithmetic in basis points (1000 = 1.0x, 2500 = 2.5x).
 * 
 * Strict Mastery Rule:
 * Speaking verification requires pronunciationScoreBp >= 8000 (80.00%) to pass (q >= 4).
 * Any score < 8000 is treated as a failed repetition (q <= 2), resetting interval to 1 day.
 */

export const SM2_DEFAULT_EASE_FACTOR_BP = 2500; // 2.50
export const SM2_MIN_EASE_FACTOR_BP = 1300;     // 1.30
export const SPEAKING_MASTERY_THRESHOLD_BP = 8000; // 80.00%

export interface Sm2Input {
  qualityGrade: number;      // 0..5 (dựa trên điểm phát âm)
  repetitionCount: number;  // 0..N
  intervalDays: number;     // Số ngày hiện tại
  easeFactorBp: number;     // Basis points (1300..N, default 2500)
}

export interface Sm2Output {
  repetitionCount: number;
  intervalDays: number;
  easeFactorBp: number;
  isPassed: boolean;
  nextReviewDate: Date;
}

/**
 * Maps integer pronunciation score in basis points (0..10000) to SM-2 quality grade (0..5).
 * Speaking-Verified Mastery contract:
 * - >= 9000 bp (90%) -> q = 5 (Xuất sắc)
 * - >= 8000 bp (80%) -> q = 4 (Tốt - Đạt chuẩn làm chủ)
 * - >= 6000 bp (60%) -> q = 2 (Chưa đạt - Bắt buộc luyện lại)
 * - >= 4000 bp (40%) -> q = 1 (Kém)
 * - <  4000 bp (0%)  -> q = 0 (Sai hoàn toàn / im lặng)
 */
export function calculateQualityFromScore(pronunciationScoreBp: number): number {
  if (pronunciationScoreBp >= 9000) return 5;
  if (pronunciationScoreBp >= 8000) return 4;
  if (pronunciationScoreBp >= 6000) return 2;
  if (pronunciationScoreBp >= 4000) return 1;
  return 0;
}

/**
 * Calculates XP reward based on speaking quality grade.
 */
export function calculateXpFromQuality(qualityGrade: number): bigint {
  if (qualityGrade === 5) return 25n; // Xuất sắc
  if (qualityGrade === 4) return 15n; // Đạt chuẩn
  return 0n; // Trượt (< 8000 bp)
}

/**
 * Pure SM-2 Calculation Function.
 */
export function calculateSm2(input: Sm2Input, baseDate: Date = new Date()): Sm2Output {
  const { qualityGrade, repetitionCount, intervalDays, easeFactorBp } = input;
  const q = Math.max(0, Math.min(5, Math.floor(qualityGrade)));
  
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  // In basis points (* 1000):
  // deltaEfBp = 100 - (5 - q) * (80 + (5 - q) * 20)
  const qDiff = 5 - q;
  const deltaEfBp = Math.round(100 - qDiff * (80 + qDiff * 20));
  const newEaseFactorBp = Math.max(SM2_MIN_EASE_FACTOR_BP, easeFactorBp + deltaEfBp);

  if (q < 3) {
    // Phát âm không đạt (< 8000 bp): Reset về ban đầu
    const nextReviewDate = new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000);
    return {
      repetitionCount: 0,
      intervalDays: 1,
      easeFactorBp: newEaseFactorBp,
      isPassed: false,
      nextReviewDate,
    };
  }

  // Phát âm đạt chuẩn (>= 8000 bp): Tiến hành ngắt quãng
  const newRepetition = repetitionCount + 1;
  let newInterval = 1;

  if (newRepetition === 1) {
    newInterval = 1;
  } else if (newRepetition === 2) {
    newInterval = 6;
  } else {
    newInterval = Math.max(1, Math.round((intervalDays * newEaseFactorBp) / 1000));
  }

  const nextReviewDate = new Date(baseDate.getTime() + newInterval * 24 * 60 * 60 * 1000);

  return {
    repetitionCount: newRepetition,
    intervalDays: newInterval,
    easeFactorBp: newEaseFactorBp,
    isPassed: true,
    nextReviewDate,
  };
}
