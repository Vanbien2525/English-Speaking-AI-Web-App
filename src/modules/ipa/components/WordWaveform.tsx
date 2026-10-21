"use client";

import { useEffect, useRef } from "react";

interface WordWaveformProps {
  analyser: AnalyserNode | null;
  isRecording: boolean;
}

export function WordWaveform({ analyser, isRecording }: WordWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barCount = 24;
    const barWidth = width / barCount - 2;
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (isRecording && analyser) {
        analyser.getByteFrequencyData(dataArray);

        for (let i = 0; i < barCount; i++) {
          const index = Math.floor((i / barCount) * (bufferLength / 2));
          const val = dataArray[index] || 0;
          const barHeight = Math.max(3, (val / 255) * height * 0.95);
          const x = i * (barWidth + 2);
          const y = (height - barHeight) / 2;

          // Mint green gradient
          const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          grad.addColorStop(0, "#34d399");
          grad.addColorStop(1, "#059669");

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      } else {
        // Idle gentle pulse
        const now = Date.now() * 0.004;
        ctx.fillStyle = "#cbd5e1";
        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin(now + i * 0.3) * 2 + 3;
          const x = i * (barWidth + 2);
          const y = (height - wave) / 2;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, wave, 1.5);
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
    <div className="flex items-center justify-center rounded-xl bg-slate-900/5 px-2 py-1">
      <canvas
        ref={canvasRef}
        width={140}
        height={28}
        className="w-[140px] h-[28px]"
      />
    </div>
  );
}
