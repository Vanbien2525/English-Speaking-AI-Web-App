import { NextResponse } from "next/server";
import { z } from "zod";
import { CreateAttemptMetaSchema } from "@/core/dto/shared.dto";
import {
  AssessmentService,
  AudioValidationError,
  MissingAudioError,
  InvalidPayloadError,
  ScoringTimeoutError,
  getAssessmentDependencies,
} from "@/core/services/assessment-service";

export const dynamic = "force-dynamic";

async function extractAudioBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === "function") {
    const ab = await blob.arrayBuffer();
    return new Uint8Array(ab);
  }
  return new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(new Error("Failed to read audio blob buffer"));
    reader.readAsArrayBuffer(blob);
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PAYLOAD",
            message: "Request body must be valid multipart/form-data",
          },
        },
        { status: 400 },
      );
    }

    // 1. Extract audio
    const audioEntry = formData.get("audio");
    if (!audioEntry || !(audioEntry instanceof Blob)) {
      throw new MissingAudioError("audio field must be provided as a binary Blob/File");
    }
    if (audioEntry.size === 0) {
      throw new MissingAudioError("audio file payload cannot be empty");
    }

    // 2. Extract metadata
    const metaEntry = formData.get("metadata");
    if (!metaEntry || typeof metaEntry !== "string") {
      throw new InvalidPayloadError("metadata field must be provided as a JSON string");
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(metaEntry);
    } catch {
      throw new InvalidPayloadError("metadata contains invalid JSON");
    }

    const validatedMeta = CreateAttemptMetaSchema.safeParse(parsedJson);
    if (!validatedMeta.success) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PAYLOAD",
            message: "Metadata schema validation failed",
            details: validatedMeta.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    // 3. Convert audio blob to Uint8Array buffer
    const audioBuffer = await extractAudioBytes(audioEntry);

    // 4. Execute application service
    const deps = getAssessmentDependencies();
    const service = new AssessmentService(deps.repository, deps.aiClient, deps.defaultUserId);

    const result = await service.execute({
      audioBuffer,
      meta: validatedMeta.data,
      userId: deps.defaultUserId,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    if (error instanceof MissingAudioError || error instanceof InvalidPayloadError) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PAYLOAD",
            message: error.message,
          },
        },
        { status: 400 },
      );
    }

    if (error instanceof AudioValidationError) {
      return NextResponse.json(
        {
          error: {
            code: "AUDIO_VALIDATION_FAILED",
            message: error.message,
          },
        },
        { status: 422 },
      );
    }

    if (error instanceof ScoringTimeoutError) {
      return NextResponse.json(
        {
          error: {
            code: "SCORING_TIMEOUT",
            message: error.message,
          },
        },
        { status: 504 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PAYLOAD",
            message: "Input validation error",
            details: error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    console.error("[POST /api/practice/assess] Unhandled error:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_DATABASE_ERROR",
          message: error instanceof Error ? error.message : "Internal server error occurred",
        },
      },
      { status: 500 },
    );
  }
}
