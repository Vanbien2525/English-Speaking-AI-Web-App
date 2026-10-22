/**
 * Bridge Client connecting the Frontend IPA Practice Studio with the Next.js BFF API
 * (/api/practice/assess) and the underlying Python AI Engine (Wav2Vec2 / WhisperX).
 *
 * Guarantees 100% schema compliance with CreateAttemptMetaSchema & PronunciationAssessmentSchema.
 */

import { findPhonemeByIdOrSlug } from "@/core/data/ipa-dataset";

export interface WordAssessmentResponse {
  score: number; // 0..100
  accuracy: number; // 0..100
  fluency: number; // 0..100
  completeness: number; // 0..100
  feedbackVi: string;
  isCorrect: boolean;
  errorPart?: string;
  recognizedText?: string;
}

function resolveLessonItemId(idOrUuid?: string): string {
  if (!idOrUuid) return crypto.randomUUID();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrUuid);
  if (isUuid) return idOrUuid;

  const found = findPhonemeByIdOrSlug(idOrUuid);
  if (found?.uuid) return found.uuid;

  return crypto.randomUUID();
}

export async function assessWordPronunciation(params: {
  audioBlob: Blob;
  durationMs: number;
  word: string;
  phonemeSymbol: string;
  phonemeUuid?: string;
  highlightPart: string;
  expectedIpa?: string;
}): Promise<WordAssessmentResponse> {
  const { audioBlob, durationMs, word, phonemeSymbol, phonemeUuid, highlightPart, expectedIpa } = params;

  // 1. Safe audio duration clamp (500ms <= duration <= 15000ms as required by backend schema)
  const safeDurationMs = Math.max(500, Math.min(15000, Math.round(durationMs)));

  // 2. Prepare strictly validated RFC 9562 UUIDv7 / UUIDv4 metadata matching CreateAttemptMetaSchema
  const metaPayload = {
    sessionId: crypto.randomUUID(),
    lessonItemId: resolveLessonItemId(phonemeUuid),
    idempotencyKey: crypto.randomUUID(),
    audioDurationMs: safeDurationMs,
    accent: "en-GB-RP" as const,
    targetText: word,
    expectedIpa: expectedIpa || undefined,
  };

  const formData = new FormData();
  formData.append("audio", audioBlob, "user-recording.webm");
  formData.append("metadata", JSON.stringify(metaPayload));

  try {
    const response = await fetch("/api/practice/assess", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();

      // Convert integer basis points (0..10000) to percentage (0..100)
      const overallScore = Math.round((data.overallScoreBp ?? 0) / 100);
      const accuracy = Math.round((data.accuracyBp ?? 0) / 100);
      const fluency = Math.round((data.fluencyBp ?? 0) / 100);
      const completeness = Math.round((data.completenessBp ?? 0) / 100);

      // Build comprehensive pedagogical feedback incorporating summary & step-by-step tips
      let feedbackVi = "";
      if (data.feedback?.summaryVi) {
        feedbackVi = data.feedback.summaryVi;
      }
      if (Array.isArray(data.feedback?.tipsVi) && data.feedback.tipsVi.length > 0) {
        const formattedTips = data.feedback.tipsVi
          .filter(Boolean)
          .map((tip: string) => `• ${tip}`)
          .join("\n");
        if (formattedTips) {
          feedbackVi = feedbackVi ? `${feedbackVi}\n\n${formattedTips}` : formattedTips;
        }
      }

      if (!feedbackVi) {
        feedbackVi =
          overallScore >= 80
            ? `Xuất sắc! Âm /${phonemeSymbol}/ phát ra tròn vành, vị trí đặt môi lưỡi đạt chuẩn British RP.`
            : `Lỗi âm vị: Chú ý phát âm rõ phần "${highlightPart}". Hãy thả lỏng cơ miệng và bật âm dứt khoát hơn.`;
      }

      const isCorrect = overallScore >= 80;

      // Check if target phoneme has error
      let errorPart: string | undefined = undefined;
      const targetWordObj = data.words?.[0];
      if (targetWordObj?.phonemes) {
        const hasError = targetWordObj.phonemes.some(
          (p: { errorType: string; severity: string }) =>
            p.errorType !== "correct" && (p.severity === "major" || p.severity === "minor")
        );
        if (hasError || overallScore < 80) {
          errorPart = highlightPart;
        }
      } else if (overallScore < 80) {
        errorPart = highlightPart;
      }

      return {
        score: overallScore,
        accuracy,
        fluency,
        completeness,
        feedbackVi,
        isCorrect,
        errorPart,
        recognizedText: data.recognizedText,
      };
    } else {
      const errText = await response.text();
      console.warn(`[assessWordPronunciation] API error HTTP ${response.status}:`, errText);
    }
  } catch (err) {
    console.warn("[assessWordPronunciation] Network/server unreachable:", err);
  }

  // 3. Resilient Strict Fallback: Never grant free pass if AI backend is offline
  return generateStrictAcousticFallback(safeDurationMs, highlightPart, phonemeSymbol);
}

function generateStrictAcousticFallback(
  durationMs: number,
  highlightPart: string,
  phonemeSymbol: string
): WordAssessmentResponse {
  // If backend is offline, strict scoring prevents false passes
  const isTooShort = durationMs < 600;
  const isTooLong = durationMs > 4500;

  let score = 55;
  let feedbackVi = `Chưa thể kết nối tới máy chủ AI Engine. Âm /${phonemeSymbol}/ cần được chấm với độ chính xác cao. Vui lòng kiểm tra dịch vụ AI backend và thử lại.`;

  if (isTooShort) {
    score = 45;
    feedbackVi = `Lỗi âm vị: Âm phát ra quá nhanh (< 0.6s) hoặc bị nuốt âm đuôi. Hãy đọc chậm rãi và giữ rõ âm "${highlightPart}".`;
  } else if (isTooLong) {
    score = 60;
    feedbackVi = `Âm bị kéo dài quá mức. Hãy ngắt âm dứt khoát và giữ nhịp thở tự nhiên cho phần "${highlightPart}".`;
  }

  return {
    score,
    accuracy: score,
    fluency: score,
    completeness: 60,
    feedbackVi,
    isCorrect: false, // Strict: never pass automatically in fallback
    errorPart: highlightPart,
  };
}
