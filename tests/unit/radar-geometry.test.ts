import { describe, expect, it } from "vitest";
import { calculateRadarCoordinates } from "@/modules/progress/utils/radar-geometry";

describe("Phoneme Radar Geometry Math (Unit Tests)", () => {
  it("TC-GEO-RAD-01: calculates 6 axis endpoints and concentric polygon rings within bounds", () => {
    const scores = [85, 48, 72, 92, 81, 84];
    const result = calculateRadarCoordinates(scores, { x: 175, y: 175 }, 120);

    expect(result.axisEndpoints).toHaveLength(6);
    expect(result.dataPoints).toHaveLength(6);
    expect(result.gridPolygons).toHaveLength(4);
    expect(result.polygonPoints).toBeTypeOf("string");
    expect(result.benchmarkPoints).toBeTypeOf("string");

    // Top axis (i = 0, angle = -PI/2) should be at x = 175, y = 175 - 120 = 55
    expect(result.axisEndpoints[0]?.x).toBe(175);
    expect(result.axisEndpoints[0]?.y).toBe(55);

    // All points must remain within SVG viewBox (0..350)
    for (const p of result.dataPoints) {
      expect(p.x).toBeGreaterThanOrEqual(10);
      expect(p.x).toBeLessThanOrEqual(340);
      expect(p.y).toBeGreaterThanOrEqual(10);
      expect(p.y).toBeLessThanOrEqual(340);
    }
  });

  it("TC-GEO-RAD-02: handles empty or zero scores gracefully with minimum visibility radius", () => {
    const result = calculateRadarCoordinates([], { x: 175, y: 175 }, 120);

    expect(result.dataPoints).toHaveLength(6);
    // Even at 0%, data point has small 5% baseline radius for rendering
    expect(result.dataPoints[0]?.y).toBeCloseTo(169, 0);
  });
});
