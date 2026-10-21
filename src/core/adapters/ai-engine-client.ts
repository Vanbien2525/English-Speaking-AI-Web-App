import type {
  CreateAttemptMeta,
  EngineProvider,
  TutorFeedback,
  WordResult,
} from "@/core/dto/shared.dto";

export interface AiEngineScoringResult {
  engine: EngineProvider;
  engineVersion: string;
  recognizedText: string;
  overallScoreBp: number;
  accuracyBp: number;
  fluencyBp: number;
  completenessBp: number;
  prosodyBp: number | null;
  scoringLatencyMs: number;
  words: WordResult[];
  feedback: TutorFeedback;
}

export interface AiEngineClient {
  assessAudio(
    audioBuffer: Uint8Array,
    meta: CreateAttemptMeta,
    options?: { signal?: AbortSignal },
  ): Promise<AiEngineScoringResult>;
}

/**
 * Mock implementation of the Speech AI Engine for deterministic testing.
 */
export class MockAiEngineClient implements AiEngineClient {
  private simulateTimeout = false;
  private delayMs = 50;

  setSimulateTimeout(value: boolean): void {
    this.simulateTimeout = value;
  }

  setDelayMs(ms: number): void {
    this.delayMs = ms;
  }

  async assessAudio(
    _audioBuffer: Uint8Array,
    meta: CreateAttemptMeta,
    options?: { signal?: AbortSignal },
  ): Promise<AiEngineScoringResult> {
    if (this.simulateTimeout) {
      // Simulate slow response that triggers the SLA timeout (1500ms)
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => resolve(), 2000);
        if (options?.signal) {
          options.signal.addEventListener("abort", () => {
            clearTimeout(timer);
            const abortError = new Error("The operation was aborted");
            abortError.name = "AbortError";
            reject(abortError);
          });
        }
      });
    } else if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (options?.signal?.aborted) {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      throw abortError;
    }

    const target = meta.targetText || "I think the three thieves fled";
    const isTooShort = target.split(/\s+/).length > 2 && meta.audioDurationMs < 1800;

    if (isTooShort) {
      return {
        engine: "local_whisperx_wav2vec2",
        engineVersion: "whisperx-3.1.1+wav2vec2-large-xlsr-53",
        recognizedText: "hello",
        overallScoreBp: 2200,
        accuracyBp: 2500,
        fluencyBp: 3000,
        completenessBp: 1600,
        prosodyBp: 2000,
        scoringLatencyMs: 145,
        words: [
          {
            word: "think",
            accuracyBp: 2500,
            startMs: 200,
            endMs: 700,
            phonemes: [
              {
                position: 0,
                expectedIpa: "θ",
                actualIpa: "h",
                errorType: "substitution",
                severity: "major",
                gopScoreBp: 2000,
                startMs: 200,
                endMs: 350,
              },
              {
                position: 1,
                expectedIpa: "ɪ",
                actualIpa: "e",
                errorType: "substitution",
                severity: "major",
                gopScoreBp: 2500,
                startMs: 350,
                endMs: 500,
              },
              {
                position: 2,
                expectedIpa: "ŋ",
                actualIpa: null,
                errorType: "deletion",
                severity: "major",
                gopScoreBp: 1000,
                startMs: null,
                endMs: null,
              },
              {
                position: 3,
                expectedIpa: "k",
                actualIpa: null,
                errorType: "deletion",
                severity: "major",
                gopScoreBp: 1000,
                startMs: null,
                endMs: null,
              },
            ],
          },
        ],
        feedback: {
          summaryVi:
            "Cảnh báo: Bạn chỉ phát âm từ rất ngắn hoặc khác ('hello') thay vì đọc cả câu mẫu. Đa số âm vị bị thiếu hoặc sai lệch nghiêm trọng.",
          tipsVi: [
            "Hãy đọc to rõ trọn vẹn cả câu theo yêu cầu bài học.",
            "Đầu lưỡi đặt giữa hai hàm răng để tạo âm xát vô thanh /θ/ cho từ 'think'.",
          ],
          visemeTimeline: [
            {
              ipa: "θ",
              startMs: 200,
              transitionMs: 50,
              holdMs: 100,
              morphWeights: {
                jawOpen: 200,
                tongueInterdental: 950,
              },
              highlightParts: ["tongue", "upper_teeth"],
            },
          ],
        },
      };
    }

    return {
      engine: "local_whisperx_wav2vec2",
      engineVersion: "whisperx-3.1.1+wav2vec2-large-xlsr-53",
      recognizedText: "I think the three thieves fled",
      overallScoreBp: 8250,
      accuracyBp: 8500,
      fluencyBp: 8000,
      completenessBp: 10000,
      prosodyBp: 8200,
      scoringLatencyMs: 145,
      words: [
        {
          word: "think",
          accuracyBp: 7800,
          startMs: 200,
          endMs: 700,
          phonemes: [
            {
              position: 0,
              expectedIpa: "θ",
              actualIpa: "θ",
              errorType: "correct",
              severity: "minor",
              gopScoreBp: 6800,
              startMs: 200,
              endMs: 350,
            },
            {
              position: 1,
              expectedIpa: "ɪ",
              actualIpa: "ɪ",
              errorType: "correct",
              severity: "good",
              gopScoreBp: 9500,
              startMs: 350,
              endMs: 500,
            },
            {
              position: 2,
              expectedIpa: "ŋ",
              actualIpa: "ŋ",
              errorType: "correct",
              severity: "good",
              gopScoreBp: 9100,
              startMs: 500,
              endMs: 600,
            },
            {
              position: 3,
              expectedIpa: "k",
              actualIpa: "t",
              errorType: "substitution",
              severity: "major",
              gopScoreBp: 5800,
              startMs: 600,
              endMs: 700,
            },
          ],
        },
      ],
      feedback: {
        summaryVi: "Phát âm âm /θ/ tương đối tốt nhưng âm bật /k/ ở đuôi từ bị thay thế bằng /t/.",
        tipsVi: [
          "Đầu lưỡi đặt nhẹ giữa hai răng cửa trên và dưới cho âm /θ/.",
          "Nâng cuống lưỡi chạm ngạc mềm rồi bật mạnh luồng hơi để phát âm /k/ chuẩn xác.",
        ],
        visemeTimeline: [
          {
            ipa: "θ",
            startMs: 200,
            transitionMs: 50,
            holdMs: 100,
            morphWeights: {
              jawOpen: 200,
              tongueInterdental: 950,
            },
            highlightParts: ["tongue", "upper_teeth"],
          },
          {
            ipa: "k",
            startMs: 600,
            transitionMs: 40,
            holdMs: 60,
            morphWeights: {
              jawOpen: 350,
              palateContact: 900,
            },
            highlightParts: ["velum", "tongue_back"],
          },
        ],
      },
    };
  }
}

/**
 * Production HTTP client connecting to FastAPI AI Engine.
 */
export class FastApiAiEngineClient implements AiEngineClient {
  constructor(private readonly baseUrl: string = process.env.AI_ENGINE_URL ?? "http://127.0.0.1:8000") {}

  async assessAudio(
    audioBuffer: Uint8Array,
    meta: CreateAttemptMeta,
    options?: { signal?: AbortSignal },
  ): Promise<AiEngineScoringResult> {
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer.buffer as ArrayBuffer], { type: "audio/wav" });
    formData.append("audio", audioBlob, "audio.wav");
    formData.append("metadata", JSON.stringify(meta));

    const response = await fetch(`${this.baseUrl}/api/v1/assess`, {
      method: "POST",
      body: formData,
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new Error(`AI Engine failed with HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json() as Promise<AiEngineScoringResult>;
  }
}
