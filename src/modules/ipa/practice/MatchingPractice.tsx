"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Shuffle,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Award,
} from "lucide-react";
import { IPA_PHONEMES } from "@/core/data/ipa-dataset";
import { speechService } from "@/shared/lib/speech";
import { toast } from "sonner";

interface MatchItem {
  id: string;
  word: string;
  ipa: string;
  meaningVi: string;
}

export function MatchingPractice() {
  const [items, setItems] = useState<MatchItem[]>([]);
  const [shuffledIpa, setShuffledIpa] = useState<MatchItem[]>([]);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [selectedIpaId, setSelectedIpaId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongPair, setWrongPair] = useState<{ wordId: string; ipaId: string } | null>(null);
  const [roundScore, setRoundScore] = useState(0);
  const [, startTransition] = useTransition();

  // Initialize a round with 5 distinct random words
  const initRound = () => {
    startTransition(() => {
      // Pick 5 distinct words across phonemes
      const allWords: MatchItem[] = [];
      for (const p of IPA_PHONEMES) {
        if (p.words.length > 0) {
          const w = p.words[0]!;
          allWords.push({
            id: `${p.id}_${w.id}`,
            word: w.word,
            ipa: w.ipa,
            meaningVi: w.meaningVi,
          });
        }
        if (allWords.length >= 12) break;
      }

      // Shuffle & pick 5
      const chosen = [...allWords].sort(() => 0.5 - Math.random()).slice(0, 5);
      const shuffled = [...chosen].sort(() => 0.5 - Math.random());

      setItems(chosen);
      setShuffledIpa(shuffled);
      setMatchedIds([]);
      setSelectedWordId(null);
      setSelectedIpaId(null);
      setWrongPair(null);
    });
  };

  useEffect(() => {
    initRound();
  }, []);

  // Handle Word selection
  const handleSelectWord = (id: string) => {
    if (matchedIds.includes(id)) return;
    setSelectedWordId(id);
    setWrongPair(null);

    // If IPA is already selected, verify match
    if (selectedIpaId) {
      checkMatch(id, selectedIpaId);
    }
  };

  // Handle IPA selection
  const handleSelectIpa = (id: string) => {
    if (matchedIds.includes(id)) return;
    setSelectedIpaId(id);
    setWrongPair(null);

    // If Word is already selected, verify match
    if (selectedWordId) {
      checkMatch(selectedWordId, id);
    }
  };

  const checkMatch = (wordId: string, ipaId: string) => {
    if (wordId === ipaId) {
      // Correct match!
      setMatchedIds((prev) => [...prev, wordId]);
      setSelectedWordId(null);
      setSelectedIpaId(null);
      setRoundScore((s) => s + 10);

      // Play word sound with British RP Male voice
      const matchedItem = items.find((i) => i.id === wordId);
      if (matchedItem) {
        speechService.speak(matchedItem.word, 0.88, 0.92);
      }
      toast.success("Khớp chính xác! +10 XP");
    } else {
      // Wrong match
      setWrongPair({ wordId, ipaId });
      toast.error("Chưa khớp! Hãy thử ghép lại.");
      setTimeout(() => {
        setSelectedWordId(null);
        setSelectedIpaId(null);
        setWrongPair(null);
      }, 700);
    }
  };

  const isRoundComplete = items.length > 0 && matchedIds.length === items.length;

  return (
    <div className="space-y-6">
      {/* Container Card */}
      <div className="rounded-3xl border-2 border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                Minigame Nối Từ &amp; Phiên Âm
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Đã nối: {matchedIds.length} / {items.length}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              Ghép Thẻ Mặt Chữ &amp; Ký Tự IPA
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chạm vào một từ bên cột 1, sau đó chọn phiên âm tương ứng ở cột 2 đối diện.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200 text-xs font-bold text-slate-700">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span>Điểm game:</span>
              <span className="text-emerald-600 font-extrabold text-sm">{roundScore} XP</span>
            </div>

            <button
              onClick={initRound}
              title="Làm mới bộ thẻ từ"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Matching Board Grid: Symmetrical 2 Columns (Requirement 7) */}
        <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: English Words */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Cột 1: Từ Vựng Tiếng Anh
              </span>
              <span className="text-[11px] font-semibold text-slate-400">5 Thẻ từ</span>
            </div>

            {items.map((item) => {
              const isMatched = matchedIds.includes(item.id);
              const isSelected = selectedWordId === item.id;
              const isWrong = wrongPair?.wordId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectWord(item.id)}
                  className={`h-[76px] flex items-center justify-between rounded-2xl border-2 px-5 py-3.5 transition-all select-none cursor-pointer ${
                    isMatched
                      ? "bg-emerald-50 border-emerald-400 text-emerald-950 opacity-80 cursor-default"
                      : isWrong
                      ? "bg-rose-50 border-rose-400 text-rose-950 animate-shake"
                      : isSelected
                      ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-400/30 scale-[1.01]"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div className="flex flex-col justify-center">
                    <span className="text-base font-bold text-slate-900 block leading-tight">
                      {item.word}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5 truncate max-w-[200px]">
                      {item.meaningVi}
                    </span>
                  </div>

                  {isMatched ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <div
                      className={`h-4 w-4 rounded-full border-2 transition-colors shrink-0 ${
                        isSelected ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: IPA Transcriptions - EXACT SAME HEIGHT & SYMMETRY */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Cột 2: Phiên Âm Chuẩn IPA
              </span>
              <span className="text-[11px] font-semibold text-slate-400">5 Phiên âm</span>
            </div>

            {shuffledIpa.map((item) => {
              const isMatched = matchedIds.includes(item.id);
              const isSelected = selectedIpaId === item.id;
              const isWrong = wrongPair?.ipaId === item.id;

              return (
                <div
                  key={`ipa_${item.id}`}
                  onClick={() => handleSelectIpa(item.id)}
                  className={`h-[76px] flex items-center justify-between rounded-2xl border-2 px-5 py-3.5 transition-all select-none cursor-pointer ${
                    isMatched
                      ? "bg-emerald-50 border-emerald-400 text-emerald-950 opacity-80 cursor-default"
                      : isWrong
                      ? "bg-rose-50 border-rose-400 text-rose-950 animate-shake"
                      : isSelected
                      ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-400/30 scale-[1.01]"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div className="flex flex-col justify-center">
                    <span className="ipa text-lg font-bold text-slate-800 block leading-tight">
                      {item.ipa}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Phiên âm quốc tế
                    </span>
                  </div>

                  {isMatched ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <div
                      className={`h-4 w-4 rounded-full border-2 transition-colors shrink-0 ${
                        isSelected ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Round Complete Victory Celebration */}
        {isRoundComplete && (
          <div className="mt-8 rounded-2xl bg-emerald-500 p-6 text-white text-center shadow-lg shadow-emerald-200 space-y-3">
            <Award className="h-10 w-10 mx-auto" />
            <h3 className="text-xl font-black">Xuất Sắc! Bạn Đã Nối Chính Xác Tất Cả</h3>
            <p className="text-xs text-emerald-100 max-w-md mx-auto">
              Tai nghe và mắt bạn đã nhận diện chính xác mối tương quan giữa mặt chữ tiếng Anh và phiên âm IPA.
            </p>
            <button
              onClick={initRound}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 active:scale-95"
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span>Chơi Vòng Tiếp Theo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
