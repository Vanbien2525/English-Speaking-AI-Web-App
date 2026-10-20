"use client";

import { motion } from "motion/react";
import { usePracticeStore } from "../stores/usePracticeStore";

export function StudioViewportToolbar() {
  const cameraPreset = usePracticeStore((s) => s.cameraPreset);
  const isXRayMode = usePracticeStore((s) => s.isXRayMode);
  const showAnatomicalLabels = usePracticeStore((s) => s.showAnatomicalLabels);
  const setCameraPreset = usePracticeStore((s) => s.setCameraPreset);
  const toggleXRayMode = usePracticeStore((s) => s.toggleXRayMode);
  const toggleAnatomicalLabels = usePracticeStore((s) => s.toggleAnatomicalLabels);
  const triggerCameraReset = usePracticeStore((s) => s.triggerCameraReset);
  const setMorphWeights = usePracticeStore((s) => s.setMorphWeights);
  const setActiveFocusArticulator = usePracticeStore((s) => s.setActiveFocusArticulator);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 flex flex-wrap items-center justify-between gap-2 px-4 z-10">
      {/* 1. Camera Angle Switcher (Chế độ quan sát học thuật) */}
      <div className="pointer-events-auto flex items-center rounded-xl bg-surface/90 p-1 shadow-lg backdrop-blur-md border border-border-subtle/80">
        <button
          type="button"
          onClick={() => setCameraPreset("crossSection")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            cameraPreset === "crossSection"
              ? "bg-primary text-white shadow-sm"
              : "text-ink-muted hover:text-ink hover:bg-surface-raised"
          }`}
          title="Mặt cắt đứng dọc giải phẫu cơ quan cấu âm"
        >
          <span>📐</span>
          <span>Mặt cắt Giải Phẫu</span>
        </button>

        <button
          type="button"
          onClick={() => setCameraPreset("frontal")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            cameraPreset === "frontal"
              ? "bg-primary text-white shadow-sm"
              : "text-ink-muted hover:text-ink hover:bg-surface-raised"
          }`}
          title="Quan sát trực diện khẩu hình môi và hàm răng"
        >
          <span>👄</span>
          <span>Chính diện</span>
        </button>

        <button
          type="button"
          onClick={() => setCameraPreset("profile")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            cameraPreset === "profile"
              ? "bg-primary text-white shadow-sm"
              : "text-ink-muted hover:text-ink hover:bg-surface-raised"
          }`}
          title="Góc nghiêng 90 độ"
        >
          <span>👤</span>
          <span>Góc nghiêng 90°</span>
        </button>
      </div>

      {/* 2. Visual Modes & Reset Tools */}
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-surface/90 p-1 shadow-lg backdrop-blur-md border border-border-subtle/80">
        {/* Nút bật/tắt X-Ray */}
        <button
          type="button"
          onClick={toggleXRayMode}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
            isXRayMode
              ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
              : "text-ink-muted hover:text-ink hover:bg-surface-raised"
          }`}
          title="Chế độ X-Ray phát sáng xuyên thấu khoang miệng"
        >
          {isXRayMode ? "✦ X-Ray Đang bật" : "✧ Bật X-Ray"}
        </button>

        {/* Nút bật/tắt Nhãn giải phẫu */}
        <button
          type="button"
          onClick={toggleAnatomicalLabels}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
            showAnatomicalLabels
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "text-ink-muted hover:text-ink hover:bg-surface-raised"
          }`}
          title="Bật/Tắt các ghim chú thích giải phẫu học thuật"
        >
          🏷 Nhãn giải phẫu
        </button>

        {/* Nút Reset View */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={triggerCameraReset}
          className="rounded-lg px-2.5 py-1.5 text-xs text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
          title="Đặt lại vị trí góc quay ban đầu"
        >
          ↺ Đặt lại góc
        </motion.button>
      </div>

      {/* 3. Phím tắt khẩu hình mẫu học thuật */}
      <div className="pointer-events-auto absolute bottom-3 left-4 flex items-center gap-1.5 rounded-lg bg-canvas/85 px-2 py-1 text-[11px] text-ink-muted backdrop-blur-md border border-border-subtle/50">
        <span className="font-semibold text-ink">Thử khẩu hình:</span>
        <button
          type="button"
          onClick={() => {
            setMorphWeights({
              jawOpen: 0.15,
              tongueInterdental: 0.95,
              tongueAlveolar: 0,
              tongueVelar: 0,
              lipPucker: 0,
              velumLower: 0,
              airflowIntensity: 0.8,
            });
            setActiveFocusArticulator("tongue_tip");
          }}
          className="rounded px-1.5 py-0.5 font-bold text-emerald-400 hover:bg-emerald-950/60 transition-colors"
        >
          /θ/ (Kẹp răng)
        </button>
        <span className="text-border-subtle">•</span>
        <button
          type="button"
          onClick={() => {
            setMorphWeights({
              jawOpen: 0.35,
              tongueInterdental: 0,
              tongueAlveolar: 0,
              tongueVelar: 0.92,
              lipPucker: 0,
              velumLower: 0,
              airflowIntensity: 0,
            });
            setActiveFocusArticulator("velum");
          }}
          className="rounded px-1.5 py-0.5 font-bold text-amber-400 hover:bg-amber-950/60 transition-colors"
        >
          /k/ (Ngạc mềm)
        </button>
        <span className="text-border-subtle">•</span>
        <button
          type="button"
          onClick={() => {
            setMorphWeights({
              jawOpen: 0.25,
              tongueInterdental: 0,
              tongueAlveolar: 0.95,
              tongueVelar: 0,
              lipPucker: 0,
              velumLower: 0,
              airflowIntensity: 0.6,
            });
            setActiveFocusArticulator("tongue_tip");
          }}
          className="rounded px-1.5 py-0.5 font-bold text-sky-400 hover:bg-sky-950/60 transition-colors"
        >
          /t/ (Chạm nướu)
        </button>
      </div>
    </div>
  );
}
