import { describe, expect, it } from "vitest";
import {
  CreateAttemptMetaSchema,
  PhonemeResultSchema,
  VisemeCommandSchema,
} from "@/core/dto/shared.dto";

const basePhoneme = {
  position: 0,
  expectedIpa: "θ",
  actualIpa: "s",
  errorType: "substitution",
  severity: "major",
  gopScoreBp: 3_200,
  startMs: 120,
  endMs: 260,
} as const;

describe("PhonemeResultSchema", () => {
  it("accepts a valid substitution (/θ/ -> /s/)", () => {
    expect(PhonemeResultSchema.safeParse(basePhoneme).success).toBe(true);
  });

  it("rejects a deletion that still carries an actual phoneme", () => {
    const result = PhonemeResultSchema.safeParse({ ...basePhoneme, errorType: "deletion" });
    expect(result.success).toBe(false);
  });

  it("accepts a deletion with a null actual phoneme", () => {
    const result = PhonemeResultSchema.safeParse({ ...basePhoneme, errorType: "deletion", actualIpa: null });
    expect(result.success).toBe(true);
  });

  it("rejects reversed timing", () => {
    const result = PhonemeResultSchema.safeParse({ ...basePhoneme, startMs: 300, endMs: 100 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer GOP scores", () => {
    const result = PhonemeResultSchema.safeParse({ ...basePhoneme, gopScoreBp: 32.5 });
    expect(result.success).toBe(false);
  });
});

describe("VisemeCommandSchema", () => {
  it("defaults highlightParts and bounds morph weights to per-mille", () => {
    const parsed = VisemeCommandSchema.parse({
      ipa: "θ",
      startMs: 0,
      transitionMs: 120,
      holdMs: 400,
      morphWeights: { jawOpen: 250, tongueTipForward: 1000 },
    });
    expect(parsed.highlightParts).toEqual([]);

    const overflow = VisemeCommandSchema.safeParse({ ...parsed, morphWeights: { jawOpen: 1001 } });
    expect(overflow.success).toBe(false);
  });
});

describe("CreateAttemptMetaSchema", () => {
  it("requires UUID identifiers and caps recordings at 60s", () => {
    const valid = {
      sessionId: "01929b7e-6c1a-7cc2-9a3e-4f6b8d2e1a00",
      lessonItemId: "01929b7e-6c1a-7cc2-9a3e-4f6b8d2e1a01",
      idempotencyKey: "01929b7e-6c1a-7cc2-9a3e-4f6b8d2e1a02",
      audioDurationMs: 2_400,
      accent: "en-GB-RP",
    };
    expect(CreateAttemptMetaSchema.safeParse(valid).success).toBe(true);
    expect(CreateAttemptMetaSchema.safeParse({ ...valid, audioDurationMs: 60_001 }).success).toBe(false);
    expect(CreateAttemptMetaSchema.safeParse({ ...valid, sessionId: "not-a-uuid" }).success).toBe(false);
  });
});
