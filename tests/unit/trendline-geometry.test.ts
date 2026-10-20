import { describe, expect, it } from "vitest";
import { calculateTrendlineGeometry } from "@/modules/progress/utils/trendline-geometry";

describe("Progress Trendline Bezier Geometry Math (Unit Tests)", () => {
  it("TC-GEO-TRN-01: generates valid cubic bezier SVG paths and benchmark line", () => {
    const data = [
      { date: "2026-10-01", percentage: 62, attemptsCount: 4 },
      { date: "2026-10-07", percentage: 68, attemptsCount: 6 },
      { date: "2026-10-14", percentage: 72, attemptsCount: 8 },
      { date: "2026-10-21", percentage: 78.4, attemptsCount: 10 },
    ];

    const result = calculateTrendlineGeometry(data, 600, 240);

    expect(result.plottedPoints).toHaveLength(4);
    expect(result.pathD).toMatch(/^M \d+(\.\d+)? \d+(\.\d+)? C/);
    expect(result.areaD).toContain(" Z");
    expect(result.benchmarkY).toBeLessThan(205); // Above baseline
    expect(result.benchmarkY).toBeGreaterThan(30); // Below top margin
  });

  it("TC-GEO-TRN-02: handles empty data without errors", () => {
    const result = calculateTrendlineGeometry([], 600, 240);

    expect(result.pathD).toBe("");
    expect(result.areaD).toBe("");
    expect(result.plottedPoints).toHaveLength(0);
  });

  it("TC-GEO-TRN-03: handles single data point correctly", () => {
    const result = calculateTrendlineGeometry(
      [{ date: "2026-10-21", percentage: 80, attemptsCount: 5 }],
      600,
      240,
    );

    expect(result.plottedPoints).toHaveLength(1);
    expect(result.pathD).toMatch(/^M \d+/);
    expect(result.areaD).toContain(" Z");
  });
});
