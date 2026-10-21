import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { convertBlobToWav } from "@/shared/lib/audio-wav";
import type { CreateAttemptMeta, PronunciationAssessment } from "@/core/dto/shared.dto";

const MIN_RECORDING_DURATION_MS = 400;

export interface AudioAssessmentOutput {
  pronunciationScoreBp: number;
  durationMs: number;
  isPassed: boolean;
  recognizedText?: string;
}

export function useVocabularyAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const cleanupStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setAnalyser(null);
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    cleanupStream();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Trình duyệt không hỗ trợ Web Audio API hoặc thiết bị thu âm.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.8;
      source.connect(analyserNode);
      setAnalyser(analyserNode);

      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find((t) =>
        MediaRecorder.isTypeSupported(t),
      );

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 16000 * 16,
      });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      setIsRecording(true);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(`Không thể kích hoạt micro: ${error.message}`);
      cleanupStream();
    }
  }, [cleanupStream]);

  const stopAndAssess = useCallback(
    async (targetWord: string): Promise<AudioAssessmentOutput | null> => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        cleanupStream();
        return null;
      }

      return new Promise((resolve) => {
        recorder.onstop = async () => {
          const durationMs = Date.now() - startTimeRef.current;
          const mimeType = recorder.mimeType || "audio/webm";
          const rawBlob = new Blob(chunksRef.current, { type: mimeType });
          chunksRef.current = [];
          cleanupStream();

          if (durationMs < MIN_RECORDING_DURATION_MS) {
            toast.warning("Bản thu âm quá ngắn (< 0.4s). Vui lòng phát âm rõ ràng từ vựng.");
            resolve(null);
            return;
          }

          setIsEvaluating(true);
          try {
            // Convert WebM/Opus blob to standard 16kHz PCM 16-bit Mono WAV in memory
            const wavBlob = await convertBlobToWav(rawBlob, 16000);

            // Create standardized assessment metadata
            const metadata: CreateAttemptMeta = {
              sessionId: crypto.randomUUID(),
              lessonItemId: "019488a0-7b24-789a-bcde-000000000010",
              idempotencyKey: crypto.randomUUID(),
              audioDurationMs: Math.max(400, Math.min(15000, durationMs)),
              accent: "en-GB-RP",
              targetText: targetWord,
            };

            const formData = new FormData();
            formData.append("audio", wavBlob, "vocab-attempt.wav");
            formData.append("metadata", JSON.stringify(metadata));

            const res = await fetch("/api/practice/assess", {
              method: "POST",
              body: formData,
            });

            if (res.ok) {
              const data = (await res.json()) as PronunciationAssessment;
              const overallScoreBp = typeof data.overallScoreBp === "number" ? data.overallScoreBp : 0;
              const isPassed = overallScoreBp >= 8000;

              setIsEvaluating(false);
              resolve({
                pronunciationScoreBp: overallScoreBp,
                durationMs,
                isPassed,
                recognizedText: data.recognizedText,
              });
              return;
            }

            const errJson = await res.json().catch(() => null);
            toast.error(
              errJson?.error?.message || "Lỗi chấm điểm từ AI Engine. Vui lòng kiểm tra microservice.",
            );
          } catch (err: unknown) {
            const error = err as Error;
            toast.error(`Không thể kết nối AI Engine: ${error.message}`);
          }

          // If AI assessment service failed, DO NOT give fake passing scores.
          // Mark attempt as unpassed with 0 points so speaking verification remains strict.
          setIsEvaluating(false);
          resolve({
            pronunciationScoreBp: 0,
            durationMs,
            isPassed: false,
            recognizedText: "",
          });
        };

        recorder.stop();
      });
    },
    [cleanupStream],
  );

  return {
    isRecording,
    isEvaluating,
    analyser,
    startRecording,
    stopAndAssess,
    cancelRecording: cleanupStream,
  };
}
