import { NextResponse } from "next/server";
import { z } from "zod";
import {
  VocabularyService,
  getVocabularyDependencies,
} from "@/core/services/vocabulary-service";

export const dynamic = "force-dynamic";

const CreateDeckSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().nullable().optional(),
  tags: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(): Promise<Response> {
  try {
    const deps = getVocabularyDependencies();
    const service = new VocabularyService(deps.vocabRepo, deps.defaultUserId);
    const decks = await service.getDecks(deps.defaultUserId);
    return NextResponse.json({ decks }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: { code: "FETCH_DECKS_FAILED", message: error.message } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const validated = CreateDeckSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PAYLOAD",
            message: "Tên bộ từ vựng không hợp lệ",
            details: validated.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const deps = getVocabularyDependencies();
    const deck = await deps.vocabRepo.createDeck({
      userId: deps.defaultUserId,
      name: validated.data.name,
      description: validated.data.description,
      tags: validated.data.tags,
      isDefault: validated.data.isDefault,
    });

    return NextResponse.json(deck, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: { code: "CREATE_DECK_FAILED", message: error.message } },
      { status: 500 },
    );
  }
}
