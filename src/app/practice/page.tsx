import type { Metadata } from "next";
import { PracticeStudioLoader } from "@/modules/practice-studio/components/PracticeStudioLoader";
import { StudioHeader } from "@/modules/practice-studio/components/StudioHeader";
import { IpaBreakdownCard } from "@/modules/practice-studio/components/IpaBreakdownCard";
import { AudioRecordDock } from "@/modules/practice-studio/components/AudioRecordDock";

export const metadata: Metadata = {
  title: "Phòng Luyện Phát Âm 3D (Practice Studio)",
  description:
    "Phòng luyện phát âm 3D tương tác với trực quan hóa mặt cắt khoang miệng giải phẫu học thuật, ghi âm Web Audio In-Memory và chấm điểm âm vị IPA theo thời gian thực.",
};

export default function PracticePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-6 px-4 py-8 pb-32">
      {/* 1. Header Bar: Tiêu điểm bài học & Âm thanh bản xứ RP */}
      <StudioHeader />

      {/* 2. Main Interactive Studio Layout: 3D Stage (16:10) & Academic Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Center Viewport: 3D Canvas + Toolbar (8 cols on lg) */}
        <section className="lg:col-span-8 flex flex-col gap-3">
          <PracticeStudioLoader />
          <div className="flex items-center justify-between text-xs text-ink-muted px-2">
            <span>💡 <strong>Mẹo tương tác:</strong> Kéo chuột trái để xoay 360°, cuộn bánh xe chuột để phóng to/thu nhỏ.</span>
            <span className="font-mono text-[11px] text-sky-400">R3F Demand Loop • 60 FPS</span>
          </div>
        </section>

        {/* Right Panel: Academic IPA Breakdown & Articulation Guidance (4 cols on lg) */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          <IpaBreakdownCard />
        </section>
      </div>

      {/* 3. Bottom Floating Audio Dock (In-Memory RAM Recording & Waveform) */}
      <AudioRecordDock />
    </main>
  );
}
