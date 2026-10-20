import { create } from "zustand";
import type { PronunciationAssessment } from "@/core/dto/shared.dto";

export type RecordingState = "idle" | "recording" | "analyzing" | "completed" | "error";
export type CameraPreset = "crossSection" | "profile" | "frontal";

export interface LessonContext {
  id: string;
  unitBreadcrumb: string;
  targetPhrase: string;
  targetIpa: string;
  targetPhoneme: string;
  phoneticDescription: string;
  referenceAudioUrl: string;
  targetScore: number;
}

export interface MorphTargetWeights {
  jawOpen: number;          // 0..1 (Độ mở hàm dưới)
  tongueInterdental: number;// 0..1 (Đầu lưỡi thò ra kẹp giữa hai răng - âm /θ/, /ð/)
  tongueAlveolar: number;   // 0..1 (Đầu lưỡi nâng chạm gờ nướu - âm /t/, /d/, /s/)
  tongueVelar: number;      // 0..1 (Cuống lưỡi nâng chạm ngạc mềm - âm /k/, /g/, /ŋ/)
  lipPucker: number;        // 0..1 (Độ chu tròn môi - âm /w/, /u:/)
  velumLower: number;       // 0..1 (Hạ ngạc mềm cho luồng hơi thoát qua mũi - âm /m/, /n/, /ŋ/)
  airflowIntensity: number; // 0..1 (Cường độ luồng khí ma sát qua khe hẹp)
}

const DEFAULT_MORPH_WEIGHTS: MorphTargetWeights = {
  jawOpen: 0.15,
  tongueInterdental: 0.85, // Mặc định ở tư thế phát âm /θ/ để người học quan sát trực quan ngay
  tongueAlveolar: 0.0,
  tongueVelar: 0.0,
  lipPucker: 0.0,
  velumLower: 0.0,
  airflowIntensity: 0.7,
};

const DEFAULT_LESSON: LessonContext = {
  id: "019488a0-7b24-789a-bcde-000000000003",
  unitBreadcrumb: "Khóa Ngữ Âm Chuyên Sâu • Unit 3: Phụ Âm Xát Răng /θ/ vs /ð/",
  targetPhrase: "I think the three thieves fled",
  targetIpa: "/aɪ/ /θɪŋk/ /ðə/ /θriː/ /θiːvz/ /flɛd/",
  targetPhoneme: "θ",
  phoneticDescription: "Âm xát răng vô thanh (Voiceless Dental Fricative)",
  referenceAudioUrl: "/audio/samples/en-GB-SoniaNeural-think.mp3",
  targetScore: 85,
};

interface PracticeStudioState {
  lesson: LessonContext;
  recordingState: RecordingState;
  audioBlob: Blob | null;
  audioUrl: string | null;
  audioDurationMs: number;
  assessment: PronunciationAssessment | null;
  selectedPhonemeIndex: number;
  cameraPreset: CameraPreset;
  isXRayMode: boolean;
  showAnatomicalLabels: boolean;
  morphWeights: MorphTargetWeights;
  cameraResetNonce: number;
  activeFocusArticulator: string | null;
  errorMessage: string | null;

  // Actions
  setRecordingState: (state: RecordingState) => void;
  setAudioBlob: (blob: Blob, durationMs: number) => void;
  clearAudioBlob: () => void;
  setAssessment: (assessment: PronunciationAssessment | null) => void;
  setSelectedPhoneme: (index: number) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  toggleXRayMode: () => void;
  toggleAnatomicalLabels: () => void;
  setMorphWeights: (weights: Partial<MorphTargetWeights>) => void;
  resetMorphWeights: () => void;
  triggerCameraReset: () => void;
  setActiveFocusArticulator: (articulator: string | null) => void;
  setErrorMessage: (msg: string | null) => void;
  resetPractice: () => void;
}

export const usePracticeStore = create<PracticeStudioState>((set, get) => ({
  lesson: DEFAULT_LESSON,
  recordingState: "idle",
  audioBlob: null,
  audioUrl: null,
  audioDurationMs: 0,
  assessment: null,
  selectedPhonemeIndex: 0,
  cameraPreset: "crossSection", // Mặc định là mặt cắt đứng dọc giải phẫu học thuật
  isXRayMode: false,
  showAnatomicalLabels: true,
  morphWeights: DEFAULT_MORPH_WEIGHTS,
  cameraResetNonce: 0,
  activeFocusArticulator: "tongue_tip",
  errorMessage: null,

  setRecordingState: (recordingState) => set({ recordingState }),

  setAudioBlob: (blob, durationMs) => {
    const prevUrl = get().audioUrl;
    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
    }
    const audioUrl = URL.createObjectURL(blob);
    set({ audioBlob: blob, audioUrl, audioDurationMs: durationMs, errorMessage: null });
  },

  clearAudioBlob: () => {
    const prevUrl = get().audioUrl;
    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
    }
    set({ audioBlob: null, audioUrl: null, audioDurationMs: 0 });
  },

  setAssessment: (assessment) => set({ assessment, recordingState: assessment ? "completed" : "idle" }),

  setSelectedPhoneme: (selectedPhonemeIndex) => {
    set({ selectedPhonemeIndex });
    // Cập nhật cấu hình morph target tương ứng với âm vị được chọn
    const assessment = get().assessment;
    if (assessment) {
      const allPhonemes = assessment.words.flatMap((w) => w.phonemes);
      const target = allPhonemes[selectedPhonemeIndex];
      if (target?.expectedIpa === "θ") {
        set({
          morphWeights: {
            jawOpen: 0.15,
            tongueInterdental: 0.95,
            tongueAlveolar: 0.0,
            tongueVelar: 0.0,
            lipPucker: 0.0,
            velumLower: 0.0,
            airflowIntensity: 0.8,
          },
          activeFocusArticulator: "tongue_tip",
        });
      } else if (target?.expectedIpa === "k") {
        set({
          morphWeights: {
            jawOpen: 0.35,
            tongueInterdental: 0.0,
            tongueAlveolar: 0.0,
            tongueVelar: 0.92,
            lipPucker: 0.0,
            velumLower: 0.0,
            airflowIntensity: 0.0,
          },
          activeFocusArticulator: "velum",
        });
      } else if (target?.expectedIpa === "ŋ") {
        set({
          morphWeights: {
            jawOpen: 0.25,
            tongueInterdental: 0.0,
            tongueAlveolar: 0.0,
            tongueVelar: 0.88,
            lipPucker: 0.0,
            velumLower: 0.9,
            airflowIntensity: 0.3,
          },
          activeFocusArticulator: "velum",
        });
      }
    }
  },

  setCameraPreset: (cameraPreset) => set({ cameraPreset }),

  toggleXRayMode: () => set((s) => ({ isXRayMode: !s.isXRayMode })),

  toggleAnatomicalLabels: () => set((s) => ({ showAnatomicalLabels: !s.showAnatomicalLabels })),

  setMorphWeights: (weights) =>
    set((s) => ({
      morphWeights: { ...s.morphWeights, ...weights },
    })),

  resetMorphWeights: () => set({ morphWeights: DEFAULT_MORPH_WEIGHTS }),

  triggerCameraReset: () => set((s) => ({ cameraResetNonce: s.cameraResetNonce + 1 })),

  setActiveFocusArticulator: (activeFocusArticulator) => set({ activeFocusArticulator }),

  setErrorMessage: (errorMessage) => set({ errorMessage, recordingState: "error" }),

  resetPractice: () => {
    const prevUrl = get().audioUrl;
    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
    }
    set({
      recordingState: "idle",
      audioBlob: null,
      audioUrl: null,
      audioDurationMs: 0,
      assessment: null,
      selectedPhonemeIndex: 0,
      morphWeights: DEFAULT_MORPH_WEIGHTS,
      errorMessage: null,
    });
  },
}));
