import { NextResponse } from "next/server";
import { BatchImportRequestSchema } from "@/core/dto/vocabulary.dto";
import {
  VocabularyService,
  getVocabularyDependencies,
} from "@/core/services/vocabulary-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const validated = BatchImportRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PAYLOAD",
            message: "Dữ liệu nhập hàng loạt không hợp lệ",
            details: validated.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const deps = getVocabularyDependencies();
    const service = new VocabularyService(deps.vocabRepo, deps.defaultUserId);
    const result = await service.batchImport({
      deckId: validated.data.deckId,
      rawText: validated.data.rawText,
      userId: deps.defaultUserId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      {
        error: {
          code: "BATCH_IMPORT_FAILED",
          message: error.message || "Bóc tách từ hàng loạt thất bại",
        },
      },
      { status: 500 },
    );
  }
}
