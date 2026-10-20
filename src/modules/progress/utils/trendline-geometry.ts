export interface TrendPointInput {
  date: string;
  percentage: number; // 0..100
  attemptsCount: number;
}

export interface PlottedPoint {
  x: number;
  y: number;
  date: string;
  percentage: number;
  attemptsCount: number;
}

export interface TrendlineGeometryOutput {
  pathD: string;
  areaD: string;
  benchmarkY: number;
  plottedPoints: PlottedPoint[];
}

export function calculateTrendlineGeometry(
  data: TrendPointInput[],
  width = 600,
  height = 240,
  padding = { top: 30, right: 30, bottom: 35, left: 45 },
): TrendlineGeometryOutput {
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const baselineY = height - padding.bottom;
  const benchmarkY = Number((baselineY - 0.85 * chartHeight).toFixed(2));

  if (!data || data.length === 0) {
    return {
      pathD: "",
      areaD: "",
      benchmarkY,
      plottedPoints: [],
    };
  }

  // Calculate coordinates for each point
  const plottedPoints: PlottedPoint[] = data.map((item, index) => {
    const xFraction = data.length > 1 ? index / (data.length - 1) : 0.5;
    const x = Number((padding.left + xFraction * chartWidth).toFixed(2));

    const clampedPercentage = Math.max(0, Math.min(100, item.percentage));
    const yFraction = clampedPercentage / 100;
    const y = Number((baselineY - yFraction * chartHeight).toFixed(2));

    return {
      x,
      y,
      date: item.date,
      percentage: item.percentage,
      attemptsCount: item.attemptsCount,
    };
  });

  if (plottedPoints.length === 1) {
    const p = plottedPoints[0]!;
    return {
      pathD: `M ${p.x} ${p.y}`,
      areaD: `M ${p.x} ${p.y} L ${p.x} ${baselineY} Z`,
      benchmarkY,
      plottedPoints,
    };
  }

  // Generate smooth cubic bezier curves
  let pathD = `M ${plottedPoints[0]!.x} ${plottedPoints[0]!.y}`;

  for (let i = 0; i < plottedPoints.length - 1; i++) {
    const p0 = plottedPoints[i === 0 ? i : i - 1]!;
    const p1 = plottedPoints[i]!;
    const p2 = plottedPoints[i + 1]!;
    const p3 = plottedPoints[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  const first = plottedPoints[0]!;
  const last = plottedPoints[plottedPoints.length - 1]!;
  const areaD = `${pathD} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;

  return {
    pathD,
    areaD,
    benchmarkY,
    plottedPoints,
  };
}
