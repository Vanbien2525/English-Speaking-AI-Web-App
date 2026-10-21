"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Flame,
} from "lucide-react";
import { IPA_PHONEMES } from "@/core/data/ipa-dataset";
import { speechService } from "@/shared/lib/speech";
import { toast } from "sonner";

interface QuizQuestion {
  targetWord: string;
  targetIpa: string;
  targetMeaning: string;
  phonemeSymbol: string;
  options: { word: string; ipa: string; isCorrect: boolean }[];
}

export function ListeningPractice() {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Generate random quiz question
  const generateQuestion = (): QuizQuestion => {
    // Pick random phoneme
    const randomPhoneme = IPA_PHONEMES[Math.floor(Math.random() * IPA_PHONEMES.length)] ?? IPA_PHONEMES[0]!;
    // Pick random word from this phoneme
    const correctWord = randomPhoneme.words[Math.floor(Math.random() * randomPhoneme.words.length)] ?? randomPhoneme.words[0]!;

    // Pick 3 distractors from other phonemes
    const otherWords: { word: string; ipa: string }[] = [];
    IPA_PHONEMES.filter((p) => p.id !== randomPhoneme.id).forEach((p) => {
      p.words.forEach((w) => {
        otherWords.push({ word: w.word, ipa: w.ipa });
      });
    });

    const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 3);

    const options = [
      { word: correctWord.word, ipa: correctWord.ipa, isCorrect: true },
      ...shuffledOthers.map((o) => ({ ...o, isCorrect: false })),
    ].sort(() => 0.5 - Math.random());

    return {
      targetWord: correctWord.word,
      targetIpa: correctWord.ipa,
      targetMeaning: correctWord.meaningVi,
      phonemeSymbol: randomPhoneme.symbol,
      options,
    };
  };

  const loadNext = useCallback(() => {
    const q = generateQuestion();
    setCurrentQuestion(q);
    setSelectedOptionIndex(null);
    setHasAnswered(false);

    // Auto play audio of target word
    setTimeout(() => {
      speechService.speak(q.targetWord, 0.85);
    }, 300);
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadNext, 0);
    return () => clearTimeout(timer);
  }, [loadNext]);

  const handlePlayAudio = async () => {
    if (!currentQuestion) return;
    setIsPlaying(true);
    try {
      await speechService.speak(currentQuestion.targetWord, 0.85);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (hasAnswered || !currentQuestion) return;
    setSelectedOptionIndex(idx);
    setHasAnswered(true);

    const chosen = currentQuestion.options[idx];
    if (!chosen) return;
    if (chosen.isCorrect) {
      setStreakCount((s) => s + 1);
      setTotalScore((t) => t + 10 + streakCount * 2);
      toast.success("Chính xác! Tai nghe âm vị rất nhạy.");
    } else {
      setStreakCount(0);
      toast.error("Chưa chính xác! Hãy quan sát phiên âm đúng.");
    }
  };

  if (!currentQuestion) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border-2 border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                Thử Thách Thính Giác (Listening Quiz)
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Nhận diện âm /{currentQuestion.phonemeSymbol}/
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              Nghe Âm Thanh &amp; Chọn Từ Chuẩn Xác
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Luyện phản xạ bóc tách âm thanh trực tiếp từ người bản xứ mà không cần nhìn trước mặt chữ.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 shadow-xs">
              <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>Streak: {streakCount}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-xs">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span>{totalScore} XP</span>
            </div>
          </div>
        </div>

        {/* Audio Center Stage */}
        <div className="my-8 flex flex-col items-center justify-center space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Bấm nút để nghe lại âm thanh
          </span>

          <button
            onClick={handlePlayAudio}
            className={`group relative flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-lg shadow-emerald-200 transition-all hover:scale-105 active:scale-95 ${
              isPlaying ? "ring-4 ring-emerald-300 animate-pulse" : ""
            }`}
          >
            <Volume2 className="h-8 w-8" />
          </button>

          <span className="text-xs font-medium text-slate-500">
            Chọn 1 trong 4 đáp án phiên âm dưới đây
          </span>
        </div>

        {/* 4 Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOptionIndex === idx;

            let optStyle = "bg-white border-slate-200 hover:border-emerald-400 hover:shadow-xs";
            if (hasAnswered) {
              if (option.isCorrect) {
                optStyle = "bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400/30";
              } else if (isSelected) {
                optStyle = "bg-rose-50 border-rose-400 text-rose-950";
              } else {
                optStyle = "bg-slate-50 border-slate-200 opacity-50";
              }
            }

            return (
              <div
                key={option.word}
                onClick={() => handleSelectOption(idx)}
                className={`flex items-center justify-between rounded-2xl border-2 p-5 transition-all cursor-pointer select-none ${optStyle}`}
              >
                <div>
                  <span className="text-lg font-black tracking-tight text-slate-900 block">
                    {option.word}
                  </span>
                  <span className="ipa text-sm font-semibold text-emerald-600 block mt-0.5">
                    {option.ipa}
                  </span>
                </div>

                {hasAnswered && (
                  <div>
                    {option.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : isSelected ? (
                      <XCircle className="h-5 w-5 text-rose-500" />
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Question Footer: Meaning & Next Button */}
        {hasAnswered && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-5">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-800">Từ được đọc: </span>
              <span className="font-semibold">{currentQuestion.targetWord}</span> — {currentQuestion.targetMeaning}
            </div>

            <button
              onClick={loadNext}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-emerald-600 active:scale-95 shadow-xs"
            >
              <span>Câu hỏi tiếp theo</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
