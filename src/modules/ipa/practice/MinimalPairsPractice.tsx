"use client";

import { useState } from "react";
import {
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { MINIMAL_PAIRS_DATA } from "@/core/data/ipa-dataset";
import { speechService } from "@/shared/lib/speech";
import { toast } from "sonner";

export function MinimalPairsPractice() {
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [targetWordChoice, setTargetWordChoice] = useState<1 | 2>(1); // 1 = word1, 2 = word2
  const [userSelected, setUserSelected] = useState<1 | 2 | null>(null);
  const [scoreCount, setScoreCount] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const activePairGroup = MINIMAL_PAIRS_DATA[selectedPairIndex] ?? MINIMAL_PAIRS_DATA[0]!;
  const currentPair = activePairGroup.pairs[currentWordIndex] ?? activePairGroup.pairs[0]!;

  // Play audio of target word with British RP Male voice
  const playTargetAudio = async () => {
    setIsPlaying(true);
    const targetWord = targetWordChoice === 1 ? currentPair.word1 : currentPair.word2;
    try {
      await speechService.speak(targetWord, 0.88, 0.92);
    } finally {
      setIsPlaying(false);
    }
  };

  // Play specific word audio for review
  const playWord = async (word: string) => {
    await speechService.speak(word, 0.88, 0.92);
  };

  const handleSelectChoice = (choice: 1 | 2) => {
    if (hasAnswered) return;
    setUserSelected(choice);
    setHasAnswered(true);

    if (choice === targetWordChoice) {
      setScoreCount((prev) => prev + 1);
      toast.success("Chính xác! Bạn đã phân biệt đúng âm vị.");
    } else {
      toast.error("Chưa chính xác! Bạn có thể bấm nút 'Thử lại câu này' để nghe và chọn lại.");
    }
  };

  // Requirement 6: Allow user to retry current pair if selected wrong
  const handleRetryCurrentQuestion = () => {
    setUserSelected(null);
    setHasAnswered(false);
    playTargetAudio();
  };

  const handleNextQuestion = () => {
    setUserSelected(null);
    setHasAnswered(false);

    // Randomize next target word choice (1 or 2)
    const nextChoice = Math.random() > 0.5 ? 1 : 2;
    setTargetWordChoice(nextChoice as 1 | 2);

    if (currentWordIndex < activePairGroup.pairs.length - 1) {
      setCurrentWordIndex((prev) => prev + 1);
    } else {
      toast.success("Bạn đã hoàn thành toàn bộ cặp từ trong nhóm này!");
      setCurrentWordIndex(0);
    }
  };

  const switchPairGroup = (index: number) => {
    setSelectedPairIndex(index);
    setCurrentWordIndex(0);
    setUserSelected(null);
    setHasAnswered(false);
    setTargetWordChoice(1);
  };

  return (
    <div className="space-y-6">
      {/* Category Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {MINIMAL_PAIRS_DATA.map((group, idx) => (
          <button
            key={group.id}
            onClick={() => switchPairGroup(idx)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              selectedPairIndex === idx
                ? "bg-emerald-500 text-white shadow-xs shadow-emerald-200"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {group.title}
          </button>
        ))}
      </div>

      {/* Main Practice Container */}
      <div className="rounded-3xl border-2 border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        {/* Header Information */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                Cặp Âm: {activePairGroup.phoneme1} vs {activePairGroup.phoneme2}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Câu {currentWordIndex + 1} / {activePairGroup.pairs.length}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              {activePairGroup.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activePairGroup.descriptionVi}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200 text-xs font-bold text-slate-700">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span>Điểm đúng:</span>
            <span className="text-emerald-600 font-extrabold text-sm">{scoreCount}</span>
          </div>
        </div>

        {/* Audio Prompt Player */}
        <div className="my-8 flex flex-col items-center justify-center space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Bấm nút để nghe âm thanh phát ra (British RP Giọng Nam)
          </span>

          <button
            onClick={playTargetAudio}
            className={`group relative flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-lg shadow-emerald-200 transition-all hover:scale-105 active:scale-95 ${
              isPlaying ? "ring-4 ring-emerald-300 animate-pulse" : ""
            }`}
          >
            <Volume2 className="h-8 w-8" />
          </button>

          <span className="text-xs font-medium text-slate-500">
            Bạn vừa nghe thấy từ nào dưới đây?
          </span>
        </div>

        {/* Two Word Choice Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Option 1: Word 1 */}
          <div
            onClick={() => handleSelectChoice(1)}
            className={`group relative flex flex-col justify-between rounded-2xl border-2 p-5 transition-all cursor-pointer select-none ${
              hasAnswered
                ? targetWordChoice === 1
                  ? "bg-emerald-50/70 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400/30"
                  : userSelected === 1
                  ? "bg-rose-50/70 border-rose-400 text-rose-950"
                  : "bg-slate-50/60 border-slate-200 opacity-60"
                : "bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                Lựa chọn A
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playWord(currentPair.word1);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-emerald-500 hover:text-white transition-colors"
                title="Nghe mẫu từ này"
              >
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="my-4 text-center">
              <span className="text-2xl font-black tracking-tight text-slate-900 block">
                {currentPair.word1}
              </span>
              <span className="ipa text-sm font-semibold text-emerald-600">
                {currentPair.ipa1}
              </span>
              <span className="text-xs text-slate-500 block mt-1">
                {currentPair.meaning1}
              </span>
            </div>

            {hasAnswered && (
              <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-slate-200/60 text-xs font-bold">
                {targetWordChoice === 1 ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Đáp án chính xác!
                  </span>
                ) : userSelected === 1 ? (
                  <span className="text-rose-600 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" />
                    Chưa đúng
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* Option 2: Word 2 */}
          <div
            onClick={() => handleSelectChoice(2)}
            className={`group relative flex flex-col justify-between rounded-2xl border-2 p-5 transition-all cursor-pointer select-none ${
              hasAnswered
                ? targetWordChoice === 2
                  ? "bg-emerald-50/70 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400/30"
                  : userSelected === 2
                  ? "bg-rose-50/70 border-rose-400 text-rose-950"
                  : "bg-slate-50/60 border-slate-200 opacity-60"
                : "bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                Lựa chọn B
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playWord(currentPair.word2);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-emerald-500 hover:text-white transition-colors"
                title="Nghe mẫu từ này"
              >
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="my-4 text-center">
              <span className="text-2xl font-black tracking-tight text-slate-900 block">
                {currentPair.word2}
              </span>
              <span className="ipa text-sm font-semibold text-emerald-600">
                {currentPair.ipa2}
              </span>
              <span className="text-xs text-slate-500 block mt-1">
                {currentPair.meaning2}
              </span>
            </div>

            {hasAnswered && (
              <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-slate-200/60 text-xs font-bold">
                {targetWordChoice === 2 ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Đáp án chính xác!
                  </span>
                ) : userSelected === 2 ? (
                  <span className="text-rose-600 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" />
                    Chưa đúng
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls: Retry or Next */}
        {hasAnswered && (
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            {userSelected !== targetWordChoice && (
              <button
                onClick={handleRetryCurrentQuestion}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-800 transition-all hover:bg-amber-100 active:scale-95 shadow-xs"
              >
                <RotateCcw className="h-4 w-4 text-amber-700" />
                <span>Thử lại câu này</span>
              </button>
            )}

            <button
              onClick={handleNextQuestion}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600 active:scale-95 shadow-xs"
            >
              <span>{userSelected === targetWordChoice ? "Câu hỏi tiếp theo" : "Bỏ qua & Tiếp tục"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
