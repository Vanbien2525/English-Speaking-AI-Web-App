import { NextResponse } from "next/server";
import {
  VocabularyService,
  getVocabularyDependencies,
} from "@/core/services/vocabulary-service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const deps = getVocabularyDependencies();
    const service = new VocabularyService(deps.vocabRepo, deps.defaultUserId);
    const dueItems = await service.getDueCards(deps.defaultUserId);
    const metrics = await service.getMetrics(deps.defaultUserId);

    return NextResponse.json({ dueItems, metrics }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: { code: "FETCH_DUE_FAILED", message: error.message } },
      { status: 500 },
    );
  }
}
