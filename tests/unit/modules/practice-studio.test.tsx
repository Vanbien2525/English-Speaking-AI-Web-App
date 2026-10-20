import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { usePracticeStore } from "@/modules/practice-studio/stores/usePracticeStore";
import { StudioHeader } from "@/modules/practice-studio/components/StudioHeader";
import { IpaBreakdownCard } from "@/modules/practice-studio/components/IpaBreakdownCard";

describe("Practice Studio 3D - Frontend Unit & Component Suite", () => {
  beforeEach(() => {
    usePracticeStore.getState().resetPractice();
  });

  describe("usePracticeStore", () => {
    it("initializes with pedagogical default morph weights for /θ/", () => {
      const state = usePracticeStore.getState();
      expect(state.morphWeights.tongueInterdental).toBe(0.85);
      expect(state.morphWeights.airflowIntensity).toBe(0.7);
      expect(state.cameraPreset).toBe("crossSection");
      expect(state.showAnatomicalLabels).toBe(true);
    });

    it("switches camera preset correctly", () => {
      usePracticeStore.getState().setCameraPreset("frontal");
      expect(usePracticeStore.getState().cameraPreset).toBe("frontal");

      usePracticeStore.getState().setCameraPreset("profile");
      expect(usePracticeStore.getState().cameraPreset).toBe("profile");
    });

    it("toggles X-Ray and Anatomical Labels", () => {
      expect(usePracticeStore.getState().isXRayMode).toBe(false);
      usePracticeStore.getState().toggleXRayMode();
      expect(usePracticeStore.getState().isXRayMode).toBe(true);

      expect(usePracticeStore.getState().showAnatomicalLabels).toBe(true);
      usePracticeStore.getState().toggleAnatomicalLabels();
      expect(usePracticeStore.getState().showAnatomicalLabels).toBe(false);
    });

    it("manages Audio Blob lifecycle and revokes previous URL", () => {
      const blob1 = new Blob(["test1"], { type: "audio/wav" });
      usePracticeStore.getState().setAudioBlob(blob1, 1500);

      const url1 = usePracticeStore.getState().audioUrl;
      expect(url1).toBeTruthy();

      // Setting a new blob revokes previous URL and generates new one
      const blob2 = new Blob(["test2"], { type: "audio/wav" });
      usePracticeStore.getState().setAudioBlob(blob2, 2500);

      const url2 = usePracticeStore.getState().audioUrl;
      expect(url2).toBeTruthy();
      expect(url2).not.toBe(url1);

      // Clearing revokes and sets to null
      usePracticeStore.getState().clearAudioBlob();
      expect(usePracticeStore.getState().audioBlob).toBeNull();
      expect(usePracticeStore.getState().audioUrl).toBeNull();
    });
  });

  describe("StudioHeader Component", () => {
    it("renders unit breadcrumb, target phrase, and target goal", () => {
      render(<StudioHeader />);

      expect(screen.getByText(/Unit 3: Phụ Âm Xát Răng \/θ\/ vs \/ð\//i)).toBeInTheDocument();
      expect(screen.getByText(/think/i)).toBeInTheDocument();
      expect(screen.getByText(/Mục tiêu: 85%/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Nghe mẫu British RP/i })).toBeInTheDocument();
    });
  });

  describe("IpaBreakdownCard Component", () => {
    it("renders academic phoneme chips and articulatory guide", () => {
      render(<IpaBreakdownCard />);

      expect(screen.getByText(/Phân Tích Âm Vị & Khẩu Hình/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /\/θ\//i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /\/ɪ\//i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /\/ŋ\//i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /\/k\//i })).toBeInTheDocument();

      // Clicking /k/ switches focus
      const kChip = screen.getByRole("button", { name: /\/k\//i });
      fireEvent.click(kChip);

      expect(usePracticeStore.getState().selectedPhonemeIndex).toBe(3);
    });
  });
});
