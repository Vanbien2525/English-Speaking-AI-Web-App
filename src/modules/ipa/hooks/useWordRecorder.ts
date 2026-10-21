"use client";

import { useState, useRef, useCallback } from "react";

export interface RecordingResult {
  blob: Blob;
  durationMs: number;
}

export function useWordRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingWordId, setRecordingWordId] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
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
    setRecordingWordId(null);
  }, []);

  const startRecording = useCallback(
    async (wordId: string): Promise<boolean> => {
      cleanup();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        mediaStreamRef.current = stream;

        // Setup Web Audio Analyser for visualizer
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 128;
        source.connect(analyserNode);
        setAnalyser(analyserNode);

        // Setup MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        startTimeRef.current = Date.now();
        recorder.start(100);
        setIsRecording(true);
        setRecordingWordId(wordId);
        return true;
      } catch (err) {
        console.error("Microphone access error:", err);
        cleanup();
        return false;
      }
    },
    [cleanup]
  );

  const stopRecording = useCallback((): Promise<RecordingResult | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        cleanup();
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const durationMs = Date.now() - startTimeRef.current;
        const completeBlob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];
        cleanup();
        resolve({ blob: completeBlob, durationMs });
      };

      recorder.stop();
    });
  }, [cleanup]);

  return {
    isRecording,
    recordingWordId,
    analyser,
    startRecording,
    stopRecording,
    cancelRecording: cleanup,
  };
}
