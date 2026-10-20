import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { usePracticeStore } from "../stores/usePracticeStore";

const MAX_RECORDING_DURATION_MS = 15_000;
const MIN_RECORDING_DURATION_MS = 500;

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const setAudioBlob = usePracticeStore((s) => s.setAudioBlob);
  const setRecordingState = usePracticeStore((s) => s.setRecordingState);
  const setErrorMessage = usePracticeStore((s) => s.setErrorMessage);

  // Stop & cleanup active stream and audio nodes
  const cleanupStream = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setAnalyser(null);
    setIsRecording(false);
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        cleanupStream();
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const duration = Date.now() - startTimeRef.current;
        const mimeType = recorder.mimeType || "audio/webm;codecs=opus";
        const completeBlob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];

        cleanupStream();

        if (duration < MIN_RECORDING_DURATION_MS) {
          toast.warning("Bản thu âm quá ngắn (< 0.5s). Vui lòng phát âm rõ ràng hơn.");
          setRecordingState("idle");
          resolve(null);
          return;
        }

        setAudioBlob(completeBlob, duration);
        setRecordingState("completed");
        resolve(completeBlob);
      };

      recorder.stop();
    });
  }, [cleanupStream, setAudioBlob, setRecordingState]);

  const startRecording = useCallback(async () => {
    cleanupStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
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

      // Listen for physical device disconnection
      stream.getAudioTracks().forEach((track) => {
        track.onended = () => {
          toast.error("Microphone bị ngắt kết nối vật lý.");
          cleanupStream();
          setErrorMessage("Microphone bị ngắt kết nối.");
        };
      });

      // Web Audio Context for real-time visualizer
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.8;
      source.connect(analyserNode);
      setAnalyser(analyserNode);

      // MediaRecorder configuration
      const supportedMimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );

      const recorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
        audioBitsPerSecond: 16000 * 16,
      });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start(100); // 100ms chunking for zero memory buildup
      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setElapsedMs(0);
      setRecordingState("recording");

      // Auto-stop at 15s limit
      timerIntervalRef.current = setInterval(() => {
        const currentElapsed = Date.now() - startTimeRef.current;
        setElapsedMs(currentElapsed);

        if (currentElapsed >= MAX_RECORDING_DURATION_MS) {
          toast.info("Đã chạm giới hạn thời lượng thu âm tối đa (15s).");
          stopRecording();
        }
      }, 50);
    } catch (err: unknown) {
      cleanupStream();
      const error = err as { name?: string; message?: string };
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        toast.error("Quyền truy cập Microphone bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.");
        setErrorMessage("Vui lòng cấp quyền Microphone để tiếp tục.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        toast.error("Không tìm thấy Microphone trên thiết bị của bạn.");
        setErrorMessage("Không tìm thấy thiết bị Microphone.");
      } else {
        toast.error(`Lỗi khởi động thu âm: ${error.message || "Không xác định"}`);
        setErrorMessage(error.message || "Lỗi khởi động thu âm");
      }
    }
  }, [cleanupStream, setErrorMessage, setRecordingState, stopRecording]);

  const cancelRecording = useCallback(() => {
    cleanupStream();
    chunksRef.current = [];
    setRecordingState("idle");
    setElapsedMs(0);
  }, [cleanupStream, setRecordingState]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  return {
    isRecording,
    elapsedMs,
    analyser,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
