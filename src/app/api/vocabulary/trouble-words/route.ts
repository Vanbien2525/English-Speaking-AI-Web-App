import { NextResponse } from "next/server";
import {
  VocabularyService,
  getVocabularyDependencies,
} from "@/core/services/vocabulary-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") || 10)));

    const deps = getVocabularyDependencies();
    const service = new VocabularyService(deps.vocabRepo, deps.defaultUserId);
    const words = await service.getTroubleWords(limit);

    return NextResponse.json({ words }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: { code: "FETCH_TROUBLE_WORDS_FAILED", message: error.message } },
      { status: 500 },
    );
  }
}
