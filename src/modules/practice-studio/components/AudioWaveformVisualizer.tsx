"use client";

import { useEffect, useRef } from "react";

interface AudioWaveformVisualizerProps {
  analyser: AnalyserNode | null;
  isRecording: boolean;
}

export function AudioWaveformVisualizer({ analyser, isRecording }: AudioWaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barCount = 36;
    const barWidth = width / barCount - 2;

    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (isRecording && analyser) {
        analyser.getByteFrequencyData(dataArray);

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * (bufferLength / 2));
          const value = dataArray[dataIndex] || 0;
          const barHeight = Math.max(3, (value / 255) * height * 0.9);

          const x = i * (barWidth + 2);
          const y = (height - barHeight) / 2;

          // Gradient color: Electric Blue to Cyan to Emerald
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, "#38bdf8");
          gradient.addColorStop(0.5, "#3b82f6");
          gradient.addColorStop(1, "#10b981");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      } else {
        // Subtle ambient idle breathing line
        const now = Date.now() * 0.003;
        ctx.fillStyle = "rgba(148, 163, 184, 0.25)";

        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin(now + i * 0.25) * 3 + 4;
          const x = i * (barWidth + 2);
          const y = (height - wave) / 2;

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, wave, 2);
          ctx.fill();
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isRecording]);

  return (
    <div className="flex h-12 w-full max-w-xs items-center justify-center overflow-hidden rounded-xl bg-canvas/60 px-3 border border-border-subtle/60">
      <canvas
        ref={canvasRef}
        width={260}
        height={40}
        className="h-full w-full"
      />
    </div>
  );
}
