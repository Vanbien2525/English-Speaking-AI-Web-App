"use client";

import { useState, useEffect, useCallback } from "react";
import type { SentencePracticeItem } from "@/core/dto/vocabulary.dto";
import type { PronunciationAssessment } from "@/core/dto/shared.dto";
import { useVocabularyStore } from "../stores/useVocabularyStore";
import { useVocabularyAudioRecorder } from "../hooks/useVocabularyAudioRecorder";
import { VocabWaveform } from "./VocabWaveform";
import { Volume2, Mic, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function SentencePracticeStudio() {
  const { selectedDeckId, incrementDailyPracticed } = useVocabularyStore();
  const [sentences, setSentences] = useState<SentencePracticeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<PronunciationAssessment | null>(null);

  const {
    isRecording,
    isEvaluating,
    analyser,
    recordedAudioUrl,
    isPlayingRecordedAudio,
    playRecordedAudio,
    startRecording,
    stopAndAssess,
  } = useVocabularyAudioRecorder();

  const loadSentences = useCallback(async () => {
    setIsLoading(true);
    setCurrentIndex(0);
    setLastScore(null);
    setLatestAssessment(null);

    try {
      const url = selectedDeckId
        ? `/api/vocabulary/practice/sentences?deckId=${encodeURIComponent(selectedDeckId)}&limit=5`
        : "/api/vocabulary/practice/sentences?limit=5";

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSentences(data.sentences || []);
      }
    } catch {
      setSentences([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeckId]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const url = selectedDeckId
          ? `/api/vocabulary/practice/sentences?deckId=${encodeURIComponent(selectedDeckId)}&limit=5`
          : "/api/vocabulary/practice/sentences?limit=5";

        const res = await fetch(url);
        if (!ignore && res.ok) {
          const data = await res.json();
          setSentences(data.sentences || []);
        }
      } catch {
        if (!ignore) setSentences([]);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [selectedDeckId]);

  const currentSentence = sentences[currentIndex];

  const handlePlayNativeAudio = useCallback(() => {
    if (!currentSentence) return;
    setIsPlayingAudio(true);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentSentence.sentenceEn);
      utterance.lang = "en-GB";
      utterance.rate = 0.85;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(false);
    }
  }, [currentSentence]);

  const handleToggleRecord = async () => {
    if (!currentSentence) return;

    if (isRecording) {
      // Evaluate the target word within the sentence context
      const assessResult = await stopAndAssess(currentSentence.word);
      if (assessResult) {
        setLastScore(Math.round(assessResult.pronunciationScoreBp / 100));
        if (assessResult.assessment) {
          setLatestAssessment(assessResult.assessment);
        }
        if (assessResult.isPassed) {
          toast.success(`🎉 Phát âm câu rất tốt! (${Math.round(assessResult.pronunciationScoreBp / 100)}/100)`);
          incrementDailyPracticed();
        } else {
          toast.warning(`⚠️ Điểm phát âm: ${Math.round(assessResult.pronunciationScoreBp / 100)}/100 (< 80). Hãy đọc lại câu để luyện ngữ điệu.`);
        }
      }
    } else {
      await startRecording();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border-subtle bg-surface">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-sm font-semibold text-ink-muted">Đang nạp các câu ví dụ...</span>
      </div>
    );
  }

  if (!currentSentence) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center rounded-2xl border border-border-subtle bg-surface">
        <span className="text-4xl mb-3">📖</span>
        <h4 className="text-lg font-bold text-ink mb-2">Chưa có câu ví dụ trong bộ từ này</h4>
        <p className="text-xs text-ink-muted mb-4">Hãy thêm từ vựng mới hoặc chuyển sang bộ từ khác.</p>
        <button
          onClick={loadSentences}
          className="px-4 py-2 rounded-xl bg-primary text-canvas text-xs font-bold"
        >
          Tải lại
        </button>
      </div>
    );
  }

  // Highlight target word inside the sentence
  const renderSentenceWithHighlight = (sentence: string, targetWord: string) => {
    const parts = sentence.split(new RegExp(`(${targetWord})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === targetWord.toLowerCase() ? (
        <span
          key={index}
          className="text-primary font-extrabold underline decoration-primary decoration-2 underline-offset-4 bg-primary/10 px-1 py-0.5 rounded"
        >
          {part}
        </span>
      ) : (
        <span key={index}>{part}</span>
      ),
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 p-6 rounded-2xl border border-border-subtle bg-surface shadow-sm">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-ink">
            Câu {currentIndex + 1} / {sentences.length}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-raised border border-border-subtle text-ink-muted">
            Từ mục tiêu: <strong className="text-primary">{currentSentence.word}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={loadSentences}
          className="p-2 rounded-xl bg-surface-raised border border-border-subtle hover:border-primary/50 text-ink transition"
          title="Tải lại danh sách câu"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Main Sentence Card */}
      <div className="flex flex-col gap-4 p-6 rounded-2xl bg-surface-raised border border-border-subtle text-center">
        <div className="text-xl sm:text-2xl font-semibold text-ink leading-relaxed">
          &ldquo;{renderSentenceWithHighlight(currentSentence.sentenceEn, currentSentence.word)}&rdquo;
        </div>

        <p className="text-sm text-ink-muted leading-normal">
          {currentSentence.sentenceVi}
        </p>

        {/* Audio Sample Controls */}
        <div className="flex items-center justify-center gap-3 mt-2">
          <button
            type="button"
            onClick={handlePlayNativeAudio}
            disabled={isPlayingAudio}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface border border-border-subtle hover:border-primary/50 text-xs font-bold text-ink transition active:scale-95 shadow-2xs"
          >
            <Volume2 className="h-4 w-4 text-primary" />
            <span>{isPlayingAudio ? "Đang phát..." : "Nghe Câu Mẫu Bản Xứ"}</span>
          </button>

          {recordedAudioUrl && (
            <button
              type="button"
              onClick={playRecordedAudio}
              disabled={isPlayingRecordedAudio}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition active:scale-95 shadow-2xs"
            >
              <span>🎧</span>
              <span>{isPlayingRecordedAudio ? "Đang phát..." : "Nghe lại giọng bạn"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Waveform Display */}
      <VocabWaveform analyser={analyser} isRecording={isRecording} />

      {/* Assessment Feedback Banner */}
      {lastScore !== null && (
        <div
          className={`w-full p-4 rounded-xl border text-center flex items-center justify-between ${
            lastScore >= 80
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-amber-50 border-amber-300 text-amber-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {lastScore >= 80 ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600" />
            )}
            <span className="text-sm font-bold">
              {lastScore >= 80 ? "Phát âm chuẩn xác!" : "Cần rèn luyện thêm ngữ điệu & âm cuối"}
            </span>
          </div>
          <span className="text-base font-extrabold">{lastScore} / 100</span>
        </div>
      )}

      {/* AI Tutor Diagnostic Summary */}
      {latestAssessment?.feedback?.summaryVi && (
        <div className="p-3.5 rounded-xl bg-surface-raised border border-primary/20 text-xs text-ink leading-relaxed">
          <strong className="text-primary block mb-1">🤖 Nhận xét từ Gia Sư Llama 3.1 8B:</strong>
          <p>{latestAssessment.feedback.summaryVi}</p>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => {
            setCurrentIndex((i) => Math.max(0, i - 1));
            setLastScore(null);
            setLatestAssessment(null);
          }}
          disabled={currentIndex === 0 || isRecording}
          className="px-4 py-2 rounded-xl bg-surface-raised border border-border-subtle hover:border-primary/50 text-xs font-semibold text-ink disabled:opacity-40 transition"
        >
          ← Câu trước
        </button>

        {/* Record Button */}
        <button
          type="button"
          onClick={handleToggleRecord}
          disabled={isEvaluating}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition shadow-md active:scale-95 ${
            isRecording
              ? "bg-coral-500 text-white animate-pulse"
              : "bg-primary text-canvas hover:brightness-110"
          }`}
        >
          <Mic className="h-5 w-5" />
          <span>{isRecording ? "Dừng & Chấm Điểm" : isEvaluating ? "Đang chấm..." : "Bấm Mic Luyện Đọc Câu"}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentIndex((i) => Math.min(sentences.length - 1, i + 1));
            setLastScore(null);
            setLatestAssessment(null);
          }}
          disabled={currentIndex === sentences.length - 1 || isRecording}
          className="px-4 py-2 rounded-xl bg-surface-raised border border-border-subtle hover:border-primary/50 text-xs font-semibold text-ink disabled:opacity-40 transition"
        >
          Câu tiếp →
        </button>
      </div>
    </div>
  );
}
