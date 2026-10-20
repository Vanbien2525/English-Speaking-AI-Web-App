export interface Point2D {
  x: number;
  y: number;
}

export interface RadarGeometryOutput {
  polygonPoints: string;
  benchmarkPoints: string;
  axisEndpoints: Point2D[];
  axisLabelPositions: Point2D[];
  dataPoints: Point2D[];
  gridPolygons: string[];
}

export function calculateRadarCoordinates(
  scores: number[], // 6 percentage values (0..100)
  center: Point2D = { x: 175, y: 175 },
  radius = 120,
): RadarGeometryOutput {
  const dataPoints: Point2D[] = [];
  const axisEndpoints: Point2D[] = [];
  const axisLabelPositions: Point2D[] = [];
  const benchmarkPointsList: Point2D[] = [];

  // Generate 4 concentric background rings (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPolygons: string[] = gridLevels.map((lvl) => {
    const ringPoints: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 2;
      const x = Number((center.x + radius * lvl * Math.cos(angle)).toFixed(2));
      const y = Number((center.y + radius * lvl * Math.sin(angle)).toFixed(2));
      ringPoints.push(`${x},${y}`);
    }
    return ringPoints.join(" ");
  });

  // Calculate 6 axes and data points
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 2;

    // Outer edge of axis
    const endX = Number((center.x + radius * Math.cos(angle)).toFixed(2));
    const endY = Number((center.y + radius * Math.sin(angle)).toFixed(2));
    axisEndpoints.push({ x: endX, y: endY });

    // Label position slightly outside the radius
    const labelX = Number((center.x + (radius + 24) * Math.cos(angle)).toFixed(2));
    const labelY = Number((center.y + (radius + 24) * Math.sin(angle)).toFixed(2));
    axisLabelPositions.push({ x: labelX, y: labelY });

    // 85% Oxford RP Benchmark point
    const benchX = Number((center.x + radius * 0.85 * Math.cos(angle)).toFixed(2));
    const benchY = Number((center.y + radius * 0.85 * Math.sin(angle)).toFixed(2));
    benchmarkPointsList.push({ x: benchX, y: benchY });

    // Actual user score point (minimum 5% for visual visibility)
    const rawScore = scores[i] ?? 0;
    const scoreFraction = Math.max(5, Math.min(100, rawScore)) / 100;
    const dataX = Number((center.x + radius * scoreFraction * Math.cos(angle)).toFixed(2));
    const dataY = Number((center.y + radius * scoreFraction * Math.sin(angle)).toFixed(2));
    dataPoints.push({ x: dataX, y: dataY });
  }

  const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const benchmarkPoints = benchmarkPointsList.map((p) => `${p.x},${p.y}`).join(" ");

  return {
    polygonPoints,
    benchmarkPoints,
    axisEndpoints,
    axisLabelPositions,
    dataPoints,
    gridPolygons,
  };
}
