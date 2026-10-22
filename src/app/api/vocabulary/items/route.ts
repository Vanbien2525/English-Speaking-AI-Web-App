import { NextResponse } from "next/server";
import { CreateVocabularyItemSchema } from "@/core/dto/vocabulary.dto";
import {
  VocabularyService,
  getVocabularyDependencies,
} from "@/core/services/vocabulary-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get("deckId") || undefined;

    const deps = getVocabularyDependencies();
    const service = new VocabularyService(deps.vocabRepo, deps.defaultUserId);
    const items = await service.getItems(deckId, deps.defaultUserId);

    return NextResponse.json({ items }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: { code: "FETCH_ITEMS_FAILED", message: error.message } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const validated = CreateVocabularyItemSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PAYLOAD",
            message: "Dữ liệu thẻ từ vựng không hợp lệ",
            details: validated.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const deps = getVocabularyDependencies();
    const item = await deps.vocabRepo.createItem({
      deckId: validated.data.deckId,
      userId: deps.defaultUserId,
      word: validated.data.word,
      ipa: validated.data.ipa,
      partOfSpeech: validated.data.partOfSpeech,
      definitionVi: validated.data.definitionVi,
      exampleSentenceEn: validated.data.exampleSentenceEn,
      exampleSentenceVi: validated.data.exampleSentenceVi,
      articulatoryTipVi: validated.data.articulatoryTipVi,
      referenceAudioUrl: validated.data.referenceAudioUrl,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    const isDuplicate = error.message?.includes("đã tồn tại trong danh sách");
    return NextResponse.json(
      { error: { code: isDuplicate ? "DUPLICATE_ITEM" : "CREATE_ITEM_FAILED", message: error.message } },
      { status: isDuplicate ? 409 : 500 },
    );
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: { code: "MISSING_ID", message: "Thiếu ID từ vựng cần xóa" } },
        { status: 400 },
      );
    }

    const deps = getVocabularyDependencies();
    const service = new VocabularyService(deps.vocabRepo, deps.defaultUserId);
    const deleted = await service.deleteItem(id, deps.defaultUserId);

    if (!deleted) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Không tìm thấy từ vựng hoặc không thể xóa" } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: { code: "DELETE_ITEM_FAILED", message: error.message } },
      { status: 500 },
    );
  }
}
