"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Volume2,
  Mic,
  Square,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Info,
  Award,
} from "lucide-react";
import type { IpaPhonemeData, PhonemeWord } from "@/core/data/ipa-dataset";
import { speechService } from "@/shared/lib/speech";
import { useWordRecorder } from "./hooks/useWordRecorder";
import { WordWaveform } from "./components/WordWaveform";
import {
  saveStoredPhonemeScore,
  saveStoredErrorWord,
  getStoredPhonemeScores,
} from "@/shared/lib/ipa-storage";
import { assessWordPronunciation } from "./services/ipa-assessment-client";
import { toast } from "sonner";

interface WordAssessmentResult {
  score: number; // 0..100
  feedbackVi: string;
  isCorrect: boolean;
  errorPart?: string;
}

interface PhonemeDetailPageProps {
  phoneme: IpaPhonemeData;
}

export function PhonemeDetailPage({ phoneme }: PhonemeDetailPageProps) {
  const [wordResults, setWordResults] = useState<Record<string, WordAssessmentResult>>({});
  const [analyzingWordId, setAnalyzingWordId] = useState<string | null>(null);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);

  const {
    isRecording,
    recordingWordId,
    analyser,
    startRecording,
    stopRecording,
  } = useWordRecorder();

  // Load previous score if any
  useEffect(() => {
    const timer = setTimeout(() => {
      const scores = getStoredPhonemeScores();
      if (scores[phoneme.id] !== undefined) {
        setOverallScore(scores[phoneme.id]!);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [phoneme.id]);

  // Play phoneme root sound
  const handlePlayPhoneme = async () => {
    await speechService.playPhonemeSequence(phoneme.symbol, phoneme.anchorWord);
  };

  // Play exemplar word
  const handlePlayWord = async (word: PhonemeWord) => {
    setPlayingWordId(word.id);
    try {
      await speechService.speak(word.word, 0.85);
    } finally {
      setPlayingWordId(null);
    }
  };

  // Toggle Recording for a specific word
  const handleToggleRecord = async (word: PhonemeWord) => {
    if (isRecording && recordingWordId === word.id) {
      // Stop recording and assess
      const res = await stopRecording();
      if (!res) return;

      if (res.durationMs < 400) {
        toast.warning("Bản thu âm quá ngắn (< 0.4s). Vui lòng phát âm rõ ràng hơn.");
        return;
      }

      setAnalyzingWordId(word.id);

      try {
        const evaluation = await assessWordPronunciation({
          audioBlob: res.blob,
          durationMs: res.durationMs,
          word: word.word,
          phonemeSymbol: phoneme.symbol,
          phonemeUuid: phoneme.uuid,
          highlightPart: word.highlightPart,
        });

        const score = evaluation.score;
        const feedbackVi = evaluation.feedbackVi;
        const isCorrect = evaluation.isCorrect;
        const errorPart = evaluation.errorPart;

        if (score < 70) {
          // Save to error review storage for targeted remediation
          saveStoredErrorWord({
            id: `${phoneme.id}_${word.id}`,
            word: word.word,
            ipa: word.ipa,
            meaningVi: word.meaningVi,
            phonemeId: phoneme.id,
            phonemeSymbol: phoneme.symbol,
            score,
            failedAt: Date.now(),
          });
          toast.error(`Điểm đạt ${score}% (< 70%). Từ này đã được thêm vào kho "Ôn tập lỗi sai".`);
        } else if (score >= 85) {
          toast.success(`Chúc mừng! Bạn đạt ${score}% cho từ "${word.word}".`);
        } else {
          toast.info(`Điểm đạt ${score}%. Đạt chuẩn khá tốt.`);
        }

        const newResults = {
          ...wordResults,
          [word.id]: { score, feedbackVi, isCorrect, errorPart },
        };
        setWordResults(newResults);

        // Compute new average phoneme score
        const allScores = Object.values(newResults).map((r) => r.score);
        const avg = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
        setOverallScore(avg);
        saveStoredPhonemeScore(phoneme.id, avg);
      } finally {
        setAnalyzingWordId(null);
      }
    } else {
      // Start recording
      const ok = await startRecording(word.id);
      if (!ok) {
        toast.error("Không thể mở Micro. Vui lòng cấp quyền truy cập mic trên trình duyệt.");
      }
    }
  };

  // Helper to highlight phoneme target inside word string
  const renderHighlightedWord = (word: string, highlightPart: string, result?: WordAssessmentResult) => {
    const lowerWord = word.toLowerCase();
    const lowerPart = highlightPart.toLowerCase();
    const startIndex = lowerWord.indexOf(lowerPart);

    if (startIndex === -1) {
      return <span className="font-bold text-slate-900">{word}</span>;
    }

    const before = word.slice(0, startIndex);
    const match = word.slice(startIndex, startIndex + highlightPart.length);
    const after = word.slice(startIndex + highlightPart.length);

    // Color logic according to score
    let matchColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (result) {
      if (result.score >= 85) {
        matchColor = "bg-emerald-100 text-emerald-800 border-emerald-400 font-black";
      } else if (result.score >= 70) {
        matchColor = "bg-amber-100 text-amber-800 border-amber-400 font-black";
      } else {
        matchColor = "bg-rose-100 text-rose-800 border-rose-400 font-black animate-pulse";
      }
    }

    return (
      <span className="font-bold tracking-tight text-slate-900">
        {before}
        <span
          className={`inline-block rounded px-1 py-0.5 border text-base underline decoration-2 underline-offset-2 ${matchColor}`}
        >
          {match}
        </span>
        {after}
      </span>
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/ipa"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 border border-slate-200/90 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 text-emerald-600" />
          <span>Bản đồ IPA</span>
        </Link>

        {overallScore > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 shadow-xs">
            <Award className="h-4 w-4 text-emerald-600" />
            <span>Điểm trung bình âm vị:</span>
            <span className="text-sm font-black text-emerald-600">{overallScore}%</span>
            {overallScore >= 85 && (
              <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] text-white font-bold">
                Thành thạo
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Articulation Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Giant IPA Symbol & Classification */}
          <div className="flex items-center gap-6">
            <div className="flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 shadow-inner">
              <span className="ipa text-5xl sm:text-6xl font-bold tracking-tight">
                /{phoneme.symbol}/
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  {phoneme.nameVi}
                </span>
                {phoneme.category === "consonant" && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      phoneme.isVoiced
                        ? "bg-amber-100 text-amber-800"
                        : "bg-sky-100 text-sky-800"
                    }`}
                  >
                    {phoneme.isVoiced ? "Hữu thanh (Voiced)" : "Vô thanh (Voiceless)"}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Luyện Phát Âm Chi Tiết /{phoneme.symbol}/
              </h1>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Từ khóa đại diện:</span>
                <span className="font-bold text-slate-800 underline">{phoneme.anchorWord}</span>
                <span className="ipa text-xs text-slate-400">({phoneme.anchorWordIpa})</span>
              </div>
            </div>
          </div>

          {/* Right: Audio Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handlePlayPhoneme}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-bold text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-95"
            >
              <Volume2 className="h-5 w-5" />
              <span>Phát âm gốc &amp; Từ mẫu</span>
            </button>
          </div>
        </div>

        {/* Articulation Guide Box */}
        <div className="mt-6 rounded-2xl bg-slate-50/80 p-4 border border-slate-200/80 flex items-start gap-3">
          <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <span className="font-bold text-slate-800">Chỉ dẫn giải phẫu khẩu hình:</span>
            <p className="text-slate-600 leading-relaxed">{phoneme.articulationGuideVi}</p>
          </div>
        </div>
      </div>

      {/* 10 Exemplar Vocabulary Words List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              10 Từ Vựng Mẫu Thực Hành Tiêu Biểu
            </h2>
            <p className="text-xs text-slate-500">
              Nghe phát âm chuẩn rồi bấm nút Mic để thu âm. AI sẽ chấm điểm và phản hồi lỗi trên từng chữ cái.
            </p>
          </div>
          <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {Object.keys(wordResults).length} / 10 đã luyện
          </span>
        </div>

        <div className="grid gap-3.5">
          {phoneme.words.map((w, index) => {
            const isWordRecording = isRecording && recordingWordId === w.id;
            const isAnalyzing = analyzingWordId === w.id;
            const result = wordResults[w.id];

            // Card border & background according to scoring
            let cardClasses = "bg-white border-slate-200/90";
            if (result) {
              if (result.score >= 85) cardClasses = "bg-emerald-50/20 border-emerald-300";
              else if (result.score >= 70) cardClasses = "bg-amber-50/20 border-amber-300";
              else cardClasses = "bg-rose-50/20 border-rose-300";
            }

            return (
              <div
                key={w.id}
                className={`rounded-2xl border-2 p-4 transition-all duration-200 shadow-xs hover:shadow-md ${cardClasses}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Word, Highlighted phoneme, IPA & Vietnamese Meaning */}
                  <div className="flex items-center gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-500">
                      {index + 1}
                    </span>

                    <div>
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-lg font-bold text-slate-900">
                          {renderHighlightedWord(w.word, w.highlightPart, result)}
                        </span>
                        <span className="ipa text-sm text-slate-500">
                          {w.ipa}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {w.meaningVi}
                      </span>
                    </div>
                  </div>

                  {/* Middle / Right: Audio Player, Recorder & Score Pill */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Visualizer when recording this word */}
                    {isWordRecording && (
                      <WordWaveform analyser={analyser} isRecording={isWordRecording} />
                    )}

                    {/* Play Sample Button */}
                    <button
                      onClick={() => handlePlayWord(w)}
                      disabled={isWordRecording || isAnalyzing}
                      title="Nghe phát âm chuẩn"
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all hover:bg-emerald-500 hover:text-white active:scale-95 disabled:opacity-40"
                    >
                      <Volume2 className={`h-4 w-4 ${playingWordId === w.id ? "animate-bounce text-emerald-600" : ""}`} />
                    </button>

                    {/* Mic / Stop Record Button */}
                    <button
                      onClick={() => handleToggleRecord(w)}
                      disabled={isAnalyzing || (isRecording && recordingWordId !== w.id)}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                        isWordRecording
                          ? "bg-rose-500 text-white shadow-sm shadow-rose-200 animate-pulse"
                          : "bg-slate-900 text-white hover:bg-emerald-600 shadow-xs"
                      } disabled:opacity-40`}
                    >
                      {isWordRecording ? (
                        <>
                          <Square className="h-3.5 w-3.5 fill-white" />
                          <span>Dừng lại</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-3.5 w-3.5" />
                          <span>Thu âm</span>
                        </>
                      )}
                    </button>

                    {/* Score Badge */}
                    {isAnalyzing ? (
                      <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 animate-pulse">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                        <span>AI Đang chấm...</span>
                      </div>
                    ) : result ? (
                      <div
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black shadow-xs ${
                          result.score >= 85
                            ? "bg-emerald-500 text-white"
                            : result.score >= 70
                            ? "bg-amber-400 text-amber-950"
                            : "bg-rose-500 text-white"
                        }`}
                      >
                        {result.score >= 85 ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : result.score >= 70 ? (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        <span>{result.score}%</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* AI Detailed Feedback Box */}
                {result && (
                  <div
                    className={`mt-3 rounded-xl p-3 text-xs leading-relaxed border ${
                      result.score >= 85
                        ? "bg-emerald-50/70 text-emerald-900 border-emerald-200/80"
                        : result.score >= 70
                        ? "bg-amber-50/70 text-amber-900 border-amber-200/80"
                        : "bg-rose-50/70 text-rose-900 border-rose-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>Nhận xét AI:</span>
                      <span>
                        {result.score >= 85
                          ? "Xuất sắc (>=85%)"
                          : result.score >= 70
                          ? "Tạm ổn (70-84%)"
                          : "Lỗi âm vị (<70%)"}
                      </span>
                    </div>
                    <p>{result.feedbackVi}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
