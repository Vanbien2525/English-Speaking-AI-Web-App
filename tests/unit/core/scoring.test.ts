import { describe, expect, it } from "vitest";
import {
  InvalidScoreError,
  classifySeverity,
  toDisplayPercent,
} from "@/core/domain/scoring";

describe("classifySeverity", () => {
  it.each([
    [10_000, "good"],
    [8_000, "good"],
    [7_999, "minor"],
    [6_000, "minor"],
    [5_999, "major"],
    [0, "major"],
  ] as const)("maps %i bp to %s", (scoreBp, expected) => {
    expect(classifySeverity(scoreBp)).toBe(expected);
  });

  it("honours custom thresholds", () => {
    expect(classifySeverity(7_000, { goodMinBp: 7_000, minorMinBp: 5_000 })).toBe("good");
  });

  it.each([-1, 10_001, 50.5, Number.NaN])("rejects invalid score %s", (value) => {
    expect(() => classifySeverity(value)).toThrow(InvalidScoreError);
  });
});

describe("toDisplayPercent", () => {
  it("rounds basis points to whole percent", () => {
    expect(toDisplayPercent(8_750)).toBe(88);
    expect(toDisplayPercent(8_749)).toBe(87);
    expect(toDisplayPercent(0)).toBe(0);
    expect(toDisplayPercent(10_000)).toBe(100);
  });
});
