import { NextResponse } from "next/server";
import {
  VocabularyService,
  getVocabularyDependencies,
} from "@/core/services/vocabulary-service";
import { UpdateItemLevelRequestSchema } from "@/core/dto/vocabulary.dto";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateItemLevelRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: parsed.error.issues } },
        { status: 400 },
      );
    }

    const deps = getVocabularyDependencies();
    const service = new VocabularyService(deps.vocabRepo, deps.defaultUserId);
    const updated = await service.setItemLevel(id, parsed.data.level);

    return NextResponse.json({ item: updated }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: { code: "UPDATE_LEVEL_FAILED", message: error.message } },
      { status: 500 },
    );
  }
}
