"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Volume2,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Award,
  Loader2,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import type { IpaPhonemeData, PhonemeWord } from "@/core/data/ipa-dataset";
import { speechService } from "@/shared/lib/speech";
import {
  getStoredPhonemeScores,
  saveStoredPhonemeScore,
  saveStoredErrorWord,
  removeStoredErrorWord,
  getStoredWordResultsForPhoneme,
  saveStoredWordResult,
} from "@/shared/lib/ipa-storage";
import { useWordRecorder } from "./hooks/useWordRecorder";
import { WordWaveform } from "./components/WordWaveform";
import { assessWordPronunciation } from "./services/ipa-assessment-client";

interface PhonemeDetailPageProps {
  phoneme: IpaPhonemeData;
}

interface WordAssessmentResult {
  score: number;
  feedbackVi: string;
  isCorrect: boolean;
  errorPart?: string;
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

  // Load previous overall score and previous word results when mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      const scores = getStoredPhonemeScores();
      if (scores[phoneme.id] !== undefined) {
        setOverallScore(scores[phoneme.id]!);
      }

      // Load saved attempts for each of the 10 words
      const savedWordResults = getStoredWordResultsForPhoneme(phoneme.id);
      const mapped: Record<string, WordAssessmentResult> = {};
      for (const [wId, val] of Object.entries(savedWordResults)) {
        mapped[wId] = {
          score: val.score,
          feedbackVi: val.feedbackVi,
          isCorrect: val.isCorrect,
          errorPart: val.errorPart,
        };
      }
      setWordResults(mapped);
    }, 0);
    return () => clearTimeout(timer);
  }, [phoneme.id]);

  // Play phoneme root sound (isolated articulation + British male anchor word)
  const handlePlayPhoneme = async () => {
    await speechService.playPhonemeSequence(phoneme.id, phoneme.anchorWord);
  };

  // Play exemplar word with British RP Male voice
  const handlePlayWord = async (word: PhonemeWord) => {
    setPlayingWordId(word.id);
    try {
      await speechService.speak(word.word, 0.88, 0.92);
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
        const errorWordKey = `${phoneme.id}_${word.id}`;

        // Requirement 2: Score < 80 immediately updates to Error Review Ledger.
        // If previously < 80 but now >= 80, immediately clears from Error Review Ledger!
        if (score < 80) {
          saveStoredErrorWord({
            id: errorWordKey,
            word: word.word,
            ipa: word.ipa,
            meaningVi: word.meaningVi,
            phonemeId: phoneme.id,
            phonemeSymbol: phoneme.symbol,
            score,
            failedAt: Date.now(),
            feedbackVi,
          });
          toast.error(`Điểm đạt ${score}% (< 80%). Đã tự động cập nhật vào Sổ Lỗi Ôn Tập.`);
        } else {
          removeStoredErrorWord(errorWordKey);
          toast.success(`Chúc mừng! Bạn đạt ${score}% (>= 80%) cho từ "${word.word}". Đã gỡ khỏi sổ lỗi!`);
        }

        // Persist latest attempt for this word in local storage
        saveStoredWordResult(phoneme.id, word.id, {
          score,
          feedbackVi,
          isCorrect,
          errorPart,
          timestamp: Date.now(),
        });

        const newResults = {
          ...wordResults,
          [word.id]: { score, feedbackVi, isCorrect, errorPart },
        };
        setWordResults(newResults);

        // Compute new average phoneme score from recorded words
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

    let matchColor = "bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold";
    if (result) {
      if (result.score >= 80) {
        matchColor = "bg-emerald-100 text-emerald-800 border-emerald-400 font-black";
      } else if (result.score >= 70) {
        matchColor = "bg-amber-100 text-amber-800 border-amber-300 font-bold";
      } else {
        matchColor = "bg-rose-100 text-rose-800 border-rose-300 font-bold line-through decoration-rose-500";
      }
    }

    return (
      <span className="font-medium text-slate-900">
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
    <div className="mx-auto w-full max-w-[1400px] space-y-8 px-4 py-8 sm:px-8 lg:px-12">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/ipa"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 border border-slate-200/90 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 text-emerald-600" />
          <span>Quay lại Bản đồ IPA</span>
        </Link>

        {overallScore > 0 && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold shadow-xs ${
              overallScore >= 80
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            <Award className="h-4 w-4 text-emerald-600" />
            <span>Điểm trung bình âm vị:</span>
            <span className="text-sm font-black">{overallScore}%</span>
            {overallScore >= 80 ? (
              <span className="rounded bg-emerald-500 px-2 py-0.5 text-[10px] text-white font-bold">
                Thành thạo
              </span>
            ) : (
              <span className="rounded bg-rose-500 px-2 py-0.5 text-[10px] text-white font-bold">
                Cần luyện thêm
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Articulation Hero Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl border-2 border-slate-200/90 bg-white p-6 sm:p-10 shadow-xs"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Giant IPA Symbol & Classification */}
          <div className="flex items-center gap-6">
            <div className="flex h-28 min-w-28 sm:h-32 sm:min-w-32 px-2 shrink-0 items-center justify-center rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 shadow-inner overflow-hidden">
              <span
                className={`ipa font-black tracking-tight whitespace-nowrap select-none leading-none inline-block ${
                  phoneme.symbol.length >= 2
                    ? "text-3xl sm:text-4xl"
                    : "text-4xl sm:text-5xl"
                }`}
              >
                /{phoneme.symbol}/
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {phoneme.nameVi}
                </span>
                {phoneme.category === "consonant" && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      phoneme.isVoiced
                        ? "bg-amber-100 text-amber-800"
                        : "bg-sky-100 text-sky-800"
                    }`}
                  >
                    {phoneme.isVoiced ? "Hữu thanh (Voiced)" : "Vô thanh (Voiceless)"}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Luyện Phát Âm Chi Tiết /{phoneme.symbol}/
              </h1>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Từ khóa đại diện:</span>
                <span className="font-bold text-slate-800">{phoneme.anchorWord}</span>
                <span className="ipa text-emerald-600 font-semibold">{phoneme.anchorWordIpa}</span>
              </div>
            </div>
          </div>

          {/* Right: Audio Playback Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPhoneme}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-bold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-95"
            >
              <Volume2 className="h-5 w-5" />
              <span>Phát Âm Gốc &amp; Từ Mẫu</span>
            </button>
          </div>
        </div>

        {/* Anatomical Articulation Guides */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              <HelpCircle className="h-4 w-4 text-emerald-600" />
              <span>Hướng Dẫn Khẩu Hình Miệng (Articulatory Guide)</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">
              {phoneme.articulationGuideVi}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Đặc Tính Âm Học (Acoustic Traits)</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">
              {phoneme.soundDescriptionVi}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 10 Exemplar Vocabulary Words Practice Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <span>10 Từ Vựng Mẫu Chứa Âm /{phoneme.symbol}/</span>
            </h2>
            <p className="text-xs text-slate-500">
              Phần chữ cái tạo ra âm được bôi màu. Bấm Mic đọc từng từ để AI chấm điểm và lưu kết quả tự động.
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            {Object.keys(wordResults).length} / {phoneme.words.length} đã luyện
          </div>
        </div>

        {/* 10 Words Vertical List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phoneme.words.map((word, idx) => {
            const result = wordResults[word.id];
            const isWordRecording = isRecording && recordingWordId === word.id;
            const isWordAnalyzing = analyzingWordId === word.id;
            const isWordPlaying = playingWordId === word.id;

            return (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className={`flex flex-col justify-between rounded-2xl border-2 p-5 transition-all bg-white shadow-xs ${
                  result
                    ? result.score >= 80
                      ? "border-emerald-300 ring-1 ring-emerald-300/40"
                      : "border-rose-300 ring-1 ring-rose-300/30"
                    : "border-slate-200/90 hover:border-slate-300"
                }`}
              >
                {/* Word Info & Actions */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {idx + 1}
                      </span>
                      <div className="text-lg">
                        {renderHighlightedWord(word.word, word.highlightPart, result)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="ipa font-semibold text-emerald-600">{word.ipa}</span>
                      <span>•</span>
                      <span>{word.meaningVi}</span>
                    </div>
                  </div>

                  {/* Playback & Mic Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Listen Sample */}
                    <button
                      onClick={() => handlePlayWord(word)}
                      disabled={isWordRecording || isWordAnalyzing}
                      title="Nghe phát âm chuẩn British RP giọng nam"
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:bg-emerald-500 hover:text-white hover:border-emerald-500 active:scale-95 ${
                        isWordPlaying ? "bg-emerald-500 text-white animate-pulse" : "bg-white"
                      }`}
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>

                    {/* Record / Stop Button */}
                    <button
                      onClick={() => handleToggleRecord(word)}
                      disabled={isWordAnalyzing}
                      title={isWordRecording ? "Dừng ghi âm và chấm điểm" : "Bắt đầu thu âm phát âm"}
                      className={`flex h-10 items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-all active:scale-95 ${
                        isWordRecording
                          ? "bg-rose-500 text-white shadow-md shadow-rose-200 animate-pulse"
                          : isWordAnalyzing
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-emerald-500 text-white shadow-xs hover:bg-emerald-600"
                      }`}
                    >
                      {isWordAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>AI Đang Chấm...</span>
                        </>
                      ) : isWordRecording ? (
                        <>
                          <MicOff className="h-4 w-4" />
                          <span>Dừng Thu</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          <span>Luyện Đọc</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Real-time Waveform when recording this specific word */}
                {isWordRecording && analyser && (
                  <div className="mt-3 rounded-xl bg-slate-900/90 p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono mb-1">
                      <span>ĐANG THU ÂM TRỰC TIẾP...</span>
                      <span>16kHz Mono</span>
                    </div>
                    <WordWaveform analyser={analyser} isRecording={isWordRecording} />
                  </div>
                )}

                {/* Assessment Result Banner */}
                {result && !isWordRecording && (
                  <div
                    className={`mt-4 rounded-xl p-3 text-xs border ${
                      result.score >= 80
                        ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                        : "bg-rose-50/80 border-rose-200 text-rose-950"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <div className="flex items-center gap-1.5">
                        {result.score >= 80 ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-rose-600" />
                        )}
                        <span>
                          {result.score >= 80
                            ? "Phát Âm Đạt Chuẩn (>= 80%)"
                            : "Cần Cải Thiện (< 80%)"}
                        </span>
                      </div>
                      <span className="text-sm font-extrabold">{result.score}%</span>
                    </div>

                    <div className="whitespace-pre-line leading-relaxed text-slate-800 text-xs font-normal mt-1.5">
                      {result.feedbackVi}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
