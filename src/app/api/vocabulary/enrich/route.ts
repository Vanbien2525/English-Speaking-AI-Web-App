import { NextResponse } from "next/server";
import { QuickAddEnrichRequestSchema } from "@/core/dto/vocabulary.dto";
import {
  VocabularyService,
  getVocabularyDependencies,
} from "@/core/services/vocabulary-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const validated = QuickAddEnrichRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PAYLOAD",
            message: "Tên từ vựng không hợp lệ",
            details: validated.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const deps = getVocabularyDependencies();
    const service = new VocabularyService(deps.vocabRepo, deps.defaultUserId);
    const result = await service.enrichWord(validated.data.word);

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      {
        error: {
          code: "ENRICH_FAILED",
          message: error.message || "Không thể làm giàu dữ liệu từ vựng",
        },
      },
      { status: 500 },
    );
  }
}
