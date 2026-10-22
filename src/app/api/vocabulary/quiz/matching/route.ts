import { NextResponse } from "next/server";
import {
  VocabularyService,
  getVocabularyDependencies,
} from "@/core/services/vocabulary-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get("deckId") || undefined;
    const limit = Math.min(20, Math.max(2, Number(searchParams.get("limit") || 6)));

    const deps = getVocabularyDependencies();
    const service = new VocabularyService(deps.vocabRepo, deps.defaultUserId);
    const pairs = await service.getMatchingQuiz(deckId, limit);

    return NextResponse.json({ pairs }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: { code: "FETCH_MATCHING_QUIZ_FAILED", message: error.message } },
      { status: 500 },
    );
  }
}
