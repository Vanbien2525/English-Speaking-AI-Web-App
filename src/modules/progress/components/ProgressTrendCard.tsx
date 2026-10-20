"use client";

import { useMemo, useState } from "react";
import type { ProgressTrendPoint } from "@/core/dto/progress.dto";
import { calculateTrendlineGeometry, type PlottedPoint } from "../utils/trendline-geometry";

interface ProgressTrendCardProps {
  trendHistory: ProgressTrendPoint[];
}

export function ProgressTrendCard({ trendHistory }: ProgressTrendCardProps) {
  const [hoveredPoint, setHoveredPoint] = useState<PlottedPoint | null>(null);

  const geometry = useMemo(() => {
    return calculateTrendlineGeometry(trendHistory, 600, 220, {
      top: 25,
      right: 25,
      bottom: 35,
      left: 45,
    });
  }, [trendHistory]);

  const latestScore = trendHistory.length > 0 ? trendHistory[trendHistory.length - 1]?.percentage : null;

  return (
    <section
      aria-labelledby="trendline-heading"
      className="flex flex-col gap-4 rounded-2xl bg-surface p-6 border border-border-subtle shadow-xl"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="trendline-heading" className="text-lg font-bold text-ink flex items-center gap-2">
            <span>Đường Xu Hướng Phát Âm 30 Ngày</span>
            {latestScore !== null && (
              <span className="rounded-full bg-emerald-950/40 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                Gần nhất: {latestScore}%
              </span>
            )}
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Tiến trình cải thiện formant âm học đối sánh chuẩn bản xứ Anh - Anh
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
          <span className="inline-block w-3 h-0.5 border-t-2 border-dashed border-cyan-400" />
          <span>Ngưỡng Bản Xứ RP: 85%</span>
        </div>
      </div>

      {/* SVG Trendline Chart */}
      <div className="relative w-full overflow-hidden p-1">
        {trendHistory.length === 0 ? (
          <div className="flex h-44 items-center justify-center text-xs text-ink-muted">
            Chưa có đủ dữ liệu lịch sử luyện tập 30 ngày. Hãy luyện thêm bài tập mới!
          </div>
        ) : (
          <svg
            viewBox="0 0 600 220"
            className="w-full h-auto overflow-visible select-none"
            role="img"
            aria-label="30-Day Pronunciation Progress Trendline"
          >
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.17 150)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="oklch(0.78 0.17 150)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            <line x1="45" y1="25" x2="575" y2="25" stroke="oklch(0.34 0.03 260 / 0.25)" strokeWidth="1" />
            <line x1="45" y1="105" x2="575" y2="105" stroke="oklch(0.34 0.03 260 / 0.25)" strokeWidth="1" />
            <line x1="45" y1="185" x2="575" y2="185" stroke="oklch(0.34 0.03 260 / 0.5)" strokeWidth="1" />

            {/* Left Y-Axis Labels */}
            <text x="35" y="29" textAnchor="end" className="fill-ink-muted text-[10px]">100%</text>
            <text x="35" y="109" textAnchor="end" className="fill-ink-muted text-[10px]">50%</text>
            <text x="35" y="189" textAnchor="end" className="fill-ink-muted text-[10px]">0%</text>

            {/* 85% Benchmark Line (Dashed) */}
            <line
              x1="45"
              y1={geometry.benchmarkY}
              x2="575"
              y2={geometry.benchmarkY}
              stroke="oklch(0.72 0.15 250 / 0.6)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text
              x="570"
              y={geometry.benchmarkY - 6}
              textAnchor="end"
              className="fill-cyan-400 text-[9px] font-semibold"
            >
              85% RP
            </text>

            {/* Area Fill */}
            <path d={geometry.areaD} fill="url(#trendGradient)" />

            {/* Curve Stroke */}
            <path
              d={geometry.pathD}
              fill="none"
              stroke="oklch(0.78 0.17 150)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Plotted Data Points */}
            {geometry.plottedPoints.map((pt, idx) => (
              <g key={`point-${idx}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  className="fill-emerald-400 stroke-canvas stroke-2 cursor-pointer transition-transform hover:scale-150"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Date on X-Axis */}
                <text
                  x={pt.x}
                  y="204"
                  textAnchor="middle"
                  className="fill-ink-muted text-[9px]"
                >
                  {pt.date.slice(5)}
                </text>
              </g>
            ))}
          </svg>
        )}

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute rounded-lg bg-surface-raised border border-border-subtle p-2 text-xs shadow-xl pointer-events-none transition-all"
            style={{
              left: `${(hoveredPoint.x / 600) * 100}%`,
              top: `${(hoveredPoint.y / 220) * 100}%`,
              transform: "translate(-50%, -120%)",
            }}
          >
            <p className="font-bold text-ink">{hoveredPoint.date}</p>
            <p className="text-emerald-400 font-semibold">Điểm: {hoveredPoint.percentage}%</p>
            <p className="text-[10px] text-ink-muted">{hoveredPoint.attemptsCount} lượt phát âm</p>
          </div>
        )}
      </div>
    </section>
  );
}
