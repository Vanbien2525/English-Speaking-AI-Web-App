import { NextResponse } from "next/server";
import { SubmitFlashcardSpeakingReviewSchema } from "@/core/dto/vocabulary.dto";
import {
  VocabularyService,
  getVocabularyDependencies,
} from "@/core/services/vocabulary-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const validated = SubmitFlashcardSpeakingReviewSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PAYLOAD",
            message: "Dữ liệu kết quả ôn tập không hợp lệ",
            details: validated.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const deps = getVocabularyDependencies();
    const service = new VocabularyService(deps.vocabRepo, deps.defaultUserId);
    const result = await service.submitSpeakingReview({
      vocabularyItemId: validated.data.vocabularyItemId,
      idempotencyKey: validated.data.idempotencyKey,
      pronunciationScoreBp: validated.data.pronunciationScoreBp,
      audioDurationMs: validated.data.audioDurationMs,
      reviewLevel: validated.data.reviewLevel,
      userId: deps.defaultUserId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      {
        error: {
          code: "SUBMIT_REVIEW_FAILED",
          message: error.message || "Ghi nhận kết quả ôn tập thất bại",
        },
      },
      { status: 500 },
    );
  }
}
