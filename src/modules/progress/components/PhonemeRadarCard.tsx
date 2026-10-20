"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { PhonemeRadarAxis } from "@/core/dto/progress.dto";
import { calculateRadarCoordinates } from "../utils/radar-geometry";

interface PhonemeRadarCardProps {
  axes: PhonemeRadarAxis[];
}

export function PhonemeRadarCard({ axes }: PhonemeRadarCardProps) {
  const scores = useMemo(() => axes.map((a) => a.percentage), [axes]);
  const geometry = useMemo(() => calculateRadarCoordinates(scores, { x: 175, y: 175 }, 110), [scores]);

  // Identify lowest performing axis
  const lowestAxis = useMemo(() => {
    if (axes.length === 0) return null;
    return [...axes].sort((a, b) => a.percentage - b.percentage)[0];
  }, [axes]);

  return (
    <section
      aria-labelledby="radar-chart-heading"
      className="flex flex-col gap-5 rounded-2xl bg-surface p-6 border border-border-subtle shadow-xl"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="radar-chart-heading" className="text-lg font-bold text-ink flex items-center gap-2">
            <span>Biểu Đồ Năng Lực 6 Nhóm Âm Vị</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary border border-primary/20">
              Pure SVG 0KB 3D
            </span>
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Trực quan hóa mức độ thuần thục 44 âm IPA phân nhóm theo cơ chế cấu âm
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
          <span className="inline-block w-3 h-0.5 border-t-2 border-dashed border-cyan-400" />
          <span>Chuẩn Oxford RP (85%)</span>
        </div>
      </div>

      {/* SVG Radar Container */}
      <div className="flex items-center justify-center p-2">
        <svg
          viewBox="0 0 350 350"
          className="w-full max-w-[340px] aspect-square overflow-visible"
          role="img"
          aria-label="Phoneme Articulation Radar Chart"
        >
          {/* 1. Background Concentric Polygons */}
          {geometry.gridPolygons.map((points, idx) => (
            <polygon
              key={`grid-${idx}`}
              points={points}
              fill={idx % 2 === 0 ? "oklch(0.26 0.03 260 / 0.15)" : "none"}
              stroke="oklch(0.34 0.03 260 / 0.4)"
              strokeWidth="1"
            />
          ))}

          {/* 2. Axis radiating lines */}
          {geometry.axisEndpoints.map((end, idx) => (
            <line
              key={`axis-line-${idx}`}
              x1="175"
              y1="175"
              x2={end.x}
              y2={end.y}
              stroke="oklch(0.34 0.03 260 / 0.5)"
              strokeWidth="1"
            />
          ))}

          {/* 3. Oxford RP Benchmark Polygon (85%) */}
          <polygon
            points={geometry.benchmarkPoints}
            fill="none"
            stroke="oklch(0.72 0.15 250 / 0.6)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* 4. User Articulation Polygon */}
          <polygon
            points={geometry.polygonPoints}
            fill="oklch(0.78 0.17 150 / 0.25)"
            stroke="oklch(0.78 0.17 150)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* 5. Data Points */}
          {geometry.dataPoints.map((pt, idx) => (
            <circle
              key={`data-point-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r="4"
              className="fill-emerald-400 stroke-canvas stroke-2 transition-all hover:r-6"
            />
          ))}

          {/* 6. Axis Labels */}
          {geometry.axisLabelPositions.map((pos, idx) => {
            const axis = axes[idx];
            if (!axis) return null;
            return (
              <text
                key={`label-${idx}`}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-ink text-[10px] font-semibold select-none"
              >
                <tspan x={pos.x} dy="-0.4em" className="fill-ink font-bold">
                  {axis.labelVi}
                </tspan>
                <tspan x={pos.x} dy="1.2em" className="fill-emerald-400 font-bold">
                  {axis.percentage}%
                </tspan>
              </text>
            );
          })}
        </svg>
      </div>

      {/* Axis Metric Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border-subtle/50">
        {axes.map((axis) => {
          const isGood = axis.percentage >= 80;
          const isMinor = axis.percentage >= 60 && axis.percentage < 80;
          return (
            <div
              key={axis.axisKey}
              className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                isGood
                  ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                  : isMinor
                    ? "bg-amber-950/30 border-amber-500/30 text-amber-300"
                    : "bg-rose-950/30 border-rose-500/30 text-rose-300"
              }`}
            >
              <div className="flex flex-col">
                <span className="font-semibold text-ink">{axis.labelVi}</span>
                <span className="text-[10px] text-ink-muted ipa">{axis.phonemesSample.slice(0, 3).join(" ")}</span>
              </div>
              <span className="font-bold text-sm">{axis.percentage}%</span>
            </div>
          );
        })}
      </div>

      {/* Weak Point Intervention Banner (if < 60%) */}
      {lowestAxis && lowestAxis.percentage < 60 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-bold text-rose-400">
                Nhóm {lowestAxis.labelVi} ({lowestAxis.percentage}%) cần cải thiện gấp!
              </p>
              <p className="text-ink-muted">
                Các âm {lowestAxis.phonemesSample.slice(0, 4).join(", ")} đang phát âm sai khẩu hình.
              </p>
            </div>
          </div>
          <Link
            href="/practice"
            className="shrink-0 rounded-lg bg-rose-500/20 px-3 py-1.5 font-bold text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-colors"
          >
            Luyện Trong Phòng 3D &rarr;
          </Link>
        </div>
      )}
    </section>
  );
}
