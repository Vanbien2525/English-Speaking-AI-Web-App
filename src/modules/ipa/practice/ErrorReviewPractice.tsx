"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Volume2,
  Mic,
  Square,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Trash2,
} from "lucide-react";
import {
  getStoredErrorWords,
  removeStoredErrorWord,
  saveStoredErrorWord,
} from "@/shared/lib/ipa-storage";
import type { ErrorWordItem } from "@/shared/lib/ipa-storage";
import { assessWordPronunciation } from "../services/ipa-assessment-client";
import { speechService } from "@/shared/lib/speech";
import { useWordRecorder } from "../hooks/useWordRecorder";
import { WordWaveform } from "../components/WordWaveform";
import { toast } from "sonner";

export function ErrorReviewPractice() {
  const [errorList, setErrorList] = useState<ErrorWordItem[]>([]);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const {
    isRecording,
    recordingWordId,
    analyser,
    startRecording,
    stopRecording,
  } = useWordRecorder();

  useEffect(() => {
    const timer = setTimeout(() => {
      setErrorList(getStoredErrorWords());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handlePlayWord = async (word: string) => {
    await speechService.speak(word, 0.85);
  };

  const handleToggleRecord = async (item: ErrorWordItem) => {
    if (isRecording && recordingWordId === item.id) {
      const res = await stopRecording();
      if (!res) return;

      if (res.durationMs < 400) {
        toast.warning("Bản thu âm quá ngắn (< 0.4s). Vui lòng phát âm lại rõ hơn.");
        return;
      }

      setAnalyzingId(item.id);

      try {
        const evaluation = await assessWordPronunciation({
          audioBlob: res.blob,
          durationMs: res.durationMs,
          word: item.word,
          phonemeSymbol: item.phonemeSymbol,
          phonemeUuid: item.phonemeId,
          highlightPart: item.phonemeSymbol,
        });

        const newScore = evaluation.score;

        if (newScore >= 85) {
          // Remove from errors ledger!
          const updated = removeStoredErrorWord(item.id);
          setErrorList(updated);
          toast.success(`Chúc mừng! Bạn đạt ${newScore}% (>= 85%). Đã khắc phục lỗi thành công và gỡ khỏi sổ lỗi!`);
        } else {
          // Update score in storage
          const updatedItem = { ...item, score: newScore, failedAt: Date.now() };
          const updated = saveStoredErrorWord(updatedItem);
          setErrorList(updated);
          toast.info(`Điểm đạt ${newScore}%. ${evaluation.feedbackVi}`);
        }
      } finally {
        setAnalyzingId(null);
      }
    } else {
      const ok = await startRecording(item.id);
      if (!ok) {
        toast.error("Không thể mở Micro. Vui lòng cấp quyền truy cập mic trên trình duyệt.");
      }
    }
  };

  const handleManualRemove = (id: string) => {
    const updated = removeStoredErrorWord(id);
    setErrorList(updated);
    toast.info("Đã xóa từ khỏi danh sách ôn tập.");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border-2 border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                Sổ Lỗi Âm Vị (Error Review Ledger)
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {errorList.length} từ cần khắc phục
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              Ôn Tập &amp; Khắc Phục Lỗi Sai (&lt; 70%)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống tự động lưu các từ vựng bạn phát âm chưa chuẩn trong phòng học để bạn luyện lại tập trung.
            </p>
          </div>

          {errorList.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-xs">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>Cần khắc phục: {errorList.length} từ</span>
            </div>
          )}
        </div>

        {/* Content State: Empty vs List */}
        {errorList.length === 0 ? (
          <div className="my-12 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Tuyệt Vời! Không Có Lỗi Sai Nào Tồn Đọng
              </h3>
              <p className="text-xs text-slate-500">
                Tất cả các từ vựng bạn đã phát âm đều đạt điểm chuẩn an toàn (&gt;= 70%). Hãy tiếp tục học thêm các âm vị mới trên Bảng IPA!
              </p>
            </div>
            <Link
              href="/ipa"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-95"
            >
              <BookOpen className="h-4 w-4" />
              <span>Khám phá 44 Âm IPA</span>
            </Link>
          </div>
        ) : (
          <div className="my-6 grid gap-3.5">
            {errorList.map((item) => {
              const isWordRecording = isRecording && recordingWordId === item.id;
              const isAnalyzing = analyzingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border-2 border-rose-200/80 bg-rose-50/20 p-4 transition-all hover:border-rose-300 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Word, Phoneme Tag & Meaning */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-800 font-black text-sm">
                        /{item.phonemeSymbol}/
                      </div>

                      <div>
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-lg font-black text-slate-900">
                            {item.word}
                          </span>
                          <span className="ipa text-sm font-semibold text-rose-600">
                            {item.ipa}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {item.meaningVi} • Lần trước đạt: <strong className="text-rose-600 font-bold">{item.score}%</strong>
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isWordRecording && (
                        <WordWaveform analyser={analyser} isRecording={isWordRecording} />
                      )}

                      {/* Play sample */}
                      <button
                        onClick={() => handlePlayWord(item.word)}
                        disabled={isWordRecording || isAnalyzing}
                        title="Nghe mẫu phát âm"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-500 hover:text-white transition-colors"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>

                      {/* Re-record button */}
                      <button
                        onClick={() => handleToggleRecord(item)}
                        disabled={isAnalyzing || (isRecording && recordingWordId !== item.id)}
                        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
                          isWordRecording
                            ? "bg-rose-500 text-white animate-pulse"
                            : "bg-slate-900 text-white hover:bg-emerald-600"
                        }`}
                      >
                        {isWordRecording ? (
                          <>
                            <Square className="h-3.5 w-3.5 fill-white" />
                            <span>Dừng</span>
                          </>
                        ) : (
                          <>
                            <Mic className="h-3.5 w-3.5" />
                            <span>Luyện lại</span>
                          </>
                        )}
                      </button>

                      {/* Manual delete button */}
                      <button
                        onClick={() => handleManualRemove(item.id)}
                        title="Đã thuộc, xóa khỏi danh sách lỗi"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {isAnalyzing && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-600 animate-pulse">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>AI đang phân tích khẩu hình và chấm điểm lại...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
