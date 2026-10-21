"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Volume2,
  Mic,
  Square,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  getStoredErrorWords,
  removeStoredErrorWord,
  saveStoredErrorWord,
  getAllStoredWordResults,
  IPA_STORAGE_EVENT,
} from "@/shared/lib/ipa-storage";
import type { ErrorWordItem } from "@/shared/lib/ipa-storage";
import { assessWordPronunciation } from "../services/ipa-assessment-client";
import { speechService } from "@/shared/lib/speech";
import { useWordRecorder } from "../hooks/useWordRecorder";
import { WordWaveform } from "../components/WordWaveform";
import { toast } from "sonner";

interface InPlaceEvaluation {
  score: number;
  feedbackVi: string;
  isCorrect: boolean;
}

export function ErrorReviewPractice() {
  const [errorList, setErrorList] = useState<ErrorWordItem[]>([]);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<Record<string, InPlaceEvaluation>>({});
  const [storedResultsMap, setStoredResultsMap] = useState<Record<string, { feedbackVi?: string }>>({});
  const [clearingIds, setClearingIds] = useState<Set<string>>(new Set());

  const {
    isRecording,
    recordingWordId,
    analyser,
    startRecording,
    stopRecording,
  } = useWordRecorder();

  const refreshList = useCallback(() => {
    // Only refresh items not currently marked for clearing animation
    const stored = getStoredErrorWords();
    setErrorList((prev) => {
      // Keep clearing items if they are still showing congratulatory feedback
      const clearingItems = prev.filter((p) => clearingIds.has(p.id));
      const combined = [...stored];
      for (const c of clearingItems) {
        if (!combined.some((item) => item.id === c.id)) {
          combined.push(c);
        }
      }
      return combined;
    });
    setStoredResultsMap(getAllStoredWordResults());
  }, [clearingIds]);

  useEffect(() => {
    const timer = setTimeout(refreshList, 0);

    // Requirement 2: Instantly update error ledger without page reload
    const handleUpdate = () => refreshList();
    window.addEventListener(IPA_STORAGE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      clearTimeout(timer);
      window.removeEventListener(IPA_STORAGE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refreshList]);

  const handlePlayWord = async (word: string) => {
    await speechService.speak(word, 0.88, 0.84);
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
        const isPassed = newScore >= 80;

        // Store in-place evaluation so user can observe feedback permanently in card (no popup toast)
        setEvaluations((prev) => ({
          ...prev,
          [item.id]: {
            score: newScore,
            feedbackVi: evaluation.feedbackVi,
            isCorrect: isPassed,
          },
        }));

        if (isPassed) {
          // 1. Thông báo kết quả chúc mừng rõ ràng
          toast.success(`🎉 Xuất sắc! Từ "${item.word}" đạt ${newScore}% (Đạt chuẩn ≥ 80%). Bạn đã khắc phục thành công!`, {
            duration: 4500,
          });

          // 2. Đánh dấu từ này đang trong trạng thái hoàn thành (không xóa ngay lập tức)
          setClearingIds((prev) => new Set(prev).add(item.id));

          // 3. Giữ lại thẻ 4 giây để học viên quan sát thành tích và nhận xét, sau đó mới xóa khỏi sổ lỗi
          setTimeout(() => {
            removeStoredErrorWord(item.id);
            setClearingIds((prev) => {
              const next = new Set(prev);
              next.delete(item.id);
              return next;
            });
            setErrorList((prev) => prev.filter((w) => w.id !== item.id));
          }, 4000);
        } else {
          // Update score and pedagogical feedback in storage
          const updatedItem = {
            ...item,
            score: newScore,
            failedAt: Date.now(),
            feedbackVi: evaluation.feedbackVi,
          };
          const updated = saveStoredErrorWord(updatedItem);
          setErrorList(updated);
          toast.error(`Chưa đạt: Từ "${item.word}" đạt ${newScore}% (< 80%). Hãy xem kỹ chỉ dẫn khẩu hình bên dưới và đọc lại nhé!`);
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
    setEvaluations((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    toast.info("Đã gỡ từ khỏi sổ lỗi.");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border-2 border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                Sổ Lỗi Âm Vị (&lt; 80%)
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {errorList.length} từ cần khắc phục
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              Ôn Tập &amp; Khắc Phục Lỗi Sai
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống tự động gom các từ phát âm dưới 80%. Luyện đọc lại và quan sát nhận xét sư phạm trực tiếp trong từng thẻ từ!
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200 text-xs font-bold text-slate-700">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span>Cần khắc phục:</span>
              <span className="text-rose-600 font-extrabold text-sm">{errorList.length} từ</span>
            </div>
          </div>
        </div>

        {/* Empty State vs List */}
        {errorList.length === 0 ? (
          <div className="my-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Sổ Lỗi Trống - Phát Âm Của Bạn Đang Rất Tốt!
              </h3>
              <p className="max-w-md text-xs text-slate-500">
                Hiện tại không có từ nào dưới 80%. Hãy vào bảng âm vị để khám phá các âm mới hoặc thực hành các bài tập phản xạ khác.
              </p>
            </div>
            <Link
              href="/ipa"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-600 active:scale-95"
            >
              <BookOpen className="h-4 w-4" />
              <span>Khám Phá Bản Đồ 44 Âm Vị</span>
            </Link>
          </div>
        ) : (
          <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {errorList.map((item) => {
              const isItemRecording = isRecording && recordingWordId === item.id;
              const isItemAnalyzing = analyzingId === item.id;
              const evalResult = evaluations[item.id];
              const storedResult = storedResultsMap[item.id];

              const currentScore = evalResult ? evalResult.score : item.score;
              const isPassed = currentScore >= 80;
              const isClearing = clearingIds.has(item.id);
              const currentFeedback =
                evalResult?.feedbackVi ||
                item.feedbackVi ||
                storedResult?.feedbackVi ||
                `Chỉ dẫn sư phạm: Chú ý phát âm chuẩn khẩu hình của âm /${item.phonemeSymbol}/ trong từ "${item.word}". Hãy nghe lại giọng mẫu chuẩn trước khi bấm thu âm lại.`;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between rounded-2xl border-2 p-5 transition-all bg-white shadow-xs ${
                    isClearing
                      ? "border-emerald-400 ring-2 ring-emerald-400/50 bg-emerald-50/20"
                      : isPassed
                      ? "border-emerald-300 ring-1 ring-emerald-300/40"
                      : "border-rose-300 ring-1 ring-rose-300/30"
                  }`}
                >
                  <div>
                    {/* Top Word Info & Delete Button */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-slate-900">
                            {item.word}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-bold border ${
                              isPassed
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {currentScore}%
                          </span>
                          {isClearing && (
                            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white animate-pulse">
                              ĐÃ SỬA LỖI XONG
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="ipa font-semibold text-emerald-600">
                            {item.ipa}
                          </span>
                          <span>•</span>
                          <span>{item.meaningVi}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-600">
                            Âm /{item.phonemeSymbol}/
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleManualRemove(item.id)}
                        title="Gỡ khỏi danh sách"
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Status countdown banner when cleared */}
                    {isClearing && (
                      <div className="my-3 rounded-xl bg-emerald-100 border border-emerald-300 p-2.5 flex items-center justify-between text-xs text-emerald-900 font-bold">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Xuất sắc! Từ này sẽ tự động gỡ khỏi sổ lỗi sau 4 giây...</span>
                        </div>
                        <button
                          onClick={() => handleManualRemove(item.id)}
                          className="shrink-0 text-[11px] font-black text-emerald-800 underline hover:text-emerald-950"
                        >
                          Gỡ ngay
                        </button>
                      </div>
                    )}

                    {/* Waveform during record */}
                    {isItemRecording && analyser && (
                      <div className="my-3 rounded-xl bg-slate-900/90 p-2.5">
                        <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono mb-1">
                          <span>ĐANG THU ÂM TRỰC TIẾP...</span>
                          <span>16kHz Mono</span>
                        </div>
                        <WordWaveform analyser={analyser} isRecording={isItemRecording} />
                      </div>
                    )}

                    {/* In-place AI Tutor Pedagogical Feedback Box (Always inside card, no toasts) */}
                    {!isItemRecording && (
                      <div
                        className={`mt-4 rounded-xl p-3.5 text-xs border transition-all ${
                          isPassed
                            ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                            : "bg-rose-50/80 border-rose-200 text-rose-950"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold mb-2">
                          <div className="flex items-center gap-1.5">
                            {isPassed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-rose-600" />
                            )}
                            <span className="text-xs font-black uppercase tracking-wide">
                              {isPassed
                                ? "Nhận Xét AI: Đạt Chuẩn (≥ 80%)"
                                : "Nhận Xét & Chỉ Dẫn Sửa Lỗi (< 80%)"}
                            </span>
                          </div>
                          <span className="text-sm font-black">{currentScore}%</span>
                        </div>

                        {/* Detailed pedagogical remarks with structured paragraphs */}
                        <div className="whitespace-pre-line leading-relaxed text-slate-800 text-xs font-normal">
                          {currentFeedback}
                        </div>

                        {/* Action if passed: Allow user to dismiss or keep viewing */}
                        {isPassed && (
                          <div className="mt-3 pt-2.5 border-t border-emerald-200/80 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-emerald-700">
                              ✓ Đã phát âm đạt chuẩn!
                            </span>
                            <button
                              onClick={() => handleManualRemove(item.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950"
                            >
                              Ẩn khỏi danh sách
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Controls */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      onClick={() => handlePlayWord(item.word)}
                      disabled={isItemRecording || isItemAnalyzing}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors"
                    >
                      <Volume2 className="h-4 w-4 text-emerald-600" />
                      <span>Nghe Mẫu Giọng Nam</span>
                    </button>

                    <button
                      onClick={() => handleToggleRecord(item)}
                      disabled={isItemAnalyzing}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                        isItemRecording
                          ? "bg-rose-500 text-white shadow-sm animate-pulse"
                          : isItemAnalyzing
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-xs"
                      }`}
                    >
                      {isItemAnalyzing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>AI Đang Chấm...</span>
                        </>
                      ) : isItemRecording ? (
                        <>
                          <Square className="h-3.5 w-3.5 fill-white" />
                          <span>Dừng Thu</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-3.5 w-3.5" />
                          <span>Luyện Đọc Lại</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
