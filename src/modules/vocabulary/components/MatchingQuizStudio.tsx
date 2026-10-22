"use client";

import { useState, useEffect, useCallback } from "react";
import type { MatchingQuizPair } from "@/core/dto/vocabulary.dto";
import { useVocabularyStore } from "../stores/useVocabularyStore";
import { Volume2, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";

interface ShuffledItem {
  id: string;
  text: string;
  type: "word" | "definition";
  pairId: string;
  audioUrl?: string | null;
}

export function MatchingQuizStudio() {
  const { selectedDeckId, incrementDailyPracticed } = useVocabularyStore();
  const [pairs, setPairs] = useState<MatchingQuizPair[]>([]);
  const [englishItems, setEnglishItems] = useState<ShuffledItem[]>([]);
  const [vietnameseItems, setVietnameseItems] = useState<ShuffledItem[]>([]);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [selectedDefId, setSelectedDefId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [shakePair, setShakePair] = useState<{ wordId: string; defId: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);


  const playWithWebSpeech = (word: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-GB";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const playPronunciation = useCallback((word: string, audioUrl?: string | null) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => playWithWebSpeech(word));
    } else {
      playWithWebSpeech(word);
    }
  }, []);

  const loadPairs = useCallback(async () => {
    setIsLoading(true);
    setSelectedWordId(null);
    setSelectedDefId(null);
    setMatchedIds(new Set());
    setShakePair(null);
    setShowCompletion(false);

    try {
      const effectiveDeckId = selectedDeckId === "system:due" ? "due" : selectedDeckId === "system:today" ? "today" : selectedDeckId;
      const url = effectiveDeckId
        ? `/api/vocabulary/quiz/matching?deckId=${encodeURIComponent(effectiveDeckId)}&limit=15`
        : "/api/vocabulary/quiz/matching?limit=15";

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const rawPairs = (data.pairs || []) as MatchingQuizPair[];
        setPairs(rawPairs);

        // Prepare and shuffle English column
        const eng: ShuffledItem[] = rawPairs.map((p) => ({
          id: `eng-${p.id}`,
          pairId: p.id,
          text: p.word,
          type: "word",
          audioUrl: p.audioUrl,
        }));
        setEnglishItems([...eng].sort(() => 0.5 - Math.random()));

        // Prepare and shuffle Vietnamese column
        const vi: ShuffledItem[] = rawPairs.map((p) => ({
          id: `vi-${p.id}`,
          pairId: p.id,
          text: p.definitionVi,
          type: "definition",
        }));
        setVietnameseItems([...vi].sort(() => 0.5 - Math.random()));
      }
    } catch {
      setPairs([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeckId]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const effectiveDeckId = selectedDeckId === "system:due" ? "due" : selectedDeckId === "system:today" ? "today" : selectedDeckId;
      const url = effectiveDeckId
        ? `/api/vocabulary/quiz/matching?deckId=${encodeURIComponent(effectiveDeckId)}&limit=15`
        : "/api/vocabulary/quiz/matching?limit=15";

        const res = await fetch(url);
        if (!ignore && res.ok) {
          const data = await res.json();
          const rawPairs = (data.pairs || []) as MatchingQuizPair[];
          setPairs(rawPairs);

          const eng: ShuffledItem[] = rawPairs.map((p) => ({
            id: `eng-${p.id}`,
            pairId: p.id,
            text: p.word,
            type: "word",
            audioUrl: p.audioUrl,
          }));
          setEnglishItems([...eng].sort(() => 0.5 - Math.random()));

          const vi: ShuffledItem[] = rawPairs.map((p) => ({
            id: `vi-${p.id}`,
            pairId: p.id,
            text: p.definitionVi,
            type: "definition",
          }));
          setVietnameseItems([...vi].sort(() => 0.5 - Math.random()));
        }
      } catch {
        if (!ignore) setPairs([]);
      } finally {
        if (!ignore) {
          setIsLoading(false);
          setShowCompletion(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [selectedDeckId]);

  // Check matching logic when both word and definition are selected
  const handleSelectWord = (item: ShuffledItem) => {
    if (matchedIds.has(item.pairId) || shakePair) return;
    setSelectedWordId(item.pairId);

    if (selectedDefId) {
      verifyMatch(item.pairId, selectedDefId, item.text, item.audioUrl);
    }
  };

  const handleSelectDef = (item: ShuffledItem) => {
    if (matchedIds.has(item.pairId) || shakePair) return;
    setSelectedDefId(item.pairId);

    if (selectedWordId) {
      const matchedWord = englishItems.find((e) => e.pairId === selectedWordId);
      verifyMatch(selectedWordId, item.pairId, matchedWord?.text || "", matchedWord?.audioUrl);
    }
  };

  const verifyMatch = (
    wordPairId: string,
    defPairId: string,
    wordText: string,
    audioUrl?: string | null,
  ) => {
    if (wordPairId === defPairId) {
      // MATCH SUCCESS!
      // 1. Play pronunciation aloud immediately
      playPronunciation(wordText, audioUrl);
      // 2. Mark as matched
      const newMatched = new Set([...matchedIds, wordPairId]);
      setMatchedIds(newMatched);
      setSelectedWordId(null);
      setSelectedDefId(null);
      incrementDailyPracticed();

      // Delay showing completion screen so final audio finishes playing
      if (newMatched.size === pairs.length) {
        setTimeout(() => {
          setShowCompletion(true);
        }, 1300);
      }
    } else {
      // MATCH FAILED: Trigger gentle shake animation with amber styling
      setShakePair({ wordId: wordPairId, defId: defPairId });
      setTimeout(() => {
        setShakePair(null);
        setSelectedWordId(null);
        setSelectedDefId(null);
      }, 500);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border-subtle bg-surface">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-sm font-semibold text-ink-muted">Đang nạp các cặp từ vựng...</span>
      </div>
    );
  }

    return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-6 rounded-2xl border border-border-subtle bg-surface shadow-sm">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <h3 className="text-lg font-bold text-ink flex items-center gap-2">
            <span>🧩</span> Nối Từ Vựng &amp; Nghĩa Tiếng Việt
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Chọn 1 từ tiếng Anh và 1 nghĩa tiếng Việt tương ứng. Khi nối đúng, hệ thống sẽ phát âm tiếng Anh từ đó lên!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-ink px-3 py-1.5 rounded-xl bg-surface-raised border border-border-subtle">
            Đã nối: {matchedIds.size}/{pairs.length}
          </span>
          <button
            type="button"
            onClick={loadPairs}
            className="p-2 rounded-xl bg-surface-raised border border-border-subtle hover:border-primary/50 text-ink transition active:scale-95"
            title="Đổi bộ thẻ khác"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Completion View */}
      {showCompletion ? (
        <div className="flex flex-col items-center justify-center p-10 text-center gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl">
            🎉
          </div>
          <h4 className="text-xl font-bold text-ink">
            Xuất sắc! Bạn đã nối chính xác toàn bộ {pairs.length} cặp từ vựng
          </h4>
          <p className="text-xs text-ink-muted max-w-md">
            Trí nhớ phản xạ thính giác và ngữ nghĩa đã được kích hoạt thành công.
          </p>
          <button
            type="button"
            onClick={loadPairs}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-canvas font-bold hover:brightness-110 transition shadow-sm active:scale-95 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Luyện Tập Lượt Tiếp Theo</span>
          </button>
        </div>
      ) : (
        /* Matching Grid (2 Columns: Left English, Right Vietnamese) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: English Words */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider px-1">
              Từ Vựng Tiếng Anh
            </span>
            {englishItems.map((item) => {
              const isMatched = matchedIds.has(item.pairId);
              const isSelected = selectedWordId === item.pairId;
              const isShaking = shakePair?.wordId === item.pairId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectWord(item)}
                  disabled={isMatched}
                  className={`w-full min-h-[76px] h-[76px] px-4 py-3 rounded-xl text-left font-bold transition-all flex items-center justify-between border cursor-pointer ${
                    isMatched
                      ? "bg-emerald-500/10 border-emerald-400 text-emerald-600 font-bold cursor-not-allowed"
                      : isShaking
                        ? "animate-shake bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400"
                        : isSelected
                          ? "bg-primary/10 border-primary text-primary ring-2 ring-primary/40 shadow-sm"
                          : "bg-surface-raised border-border-subtle hover:border-primary/50 text-ink shadow-2xs"
                  }`}
                >
                  <span className="text-base font-extrabold truncate max-w-[200px]">{item.text}</span>
                  {isMatched ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-ink-muted opacity-60 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Column 2: Vietnamese Meanings */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider px-1">
              Nghĩa Tiếng Việt
            </span>
            {vietnameseItems.map((item) => {
              const isMatched = matchedIds.has(item.pairId);
              const isSelected = selectedDefId === item.pairId;
              const isShaking = shakePair?.defId === item.pairId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectDef(item)}
                  disabled={isMatched}
                  className={`w-full min-h-[76px] h-[76px] px-4 py-3 rounded-xl text-left font-medium transition-all flex items-center justify-between gap-2 border cursor-pointer ${
                    isMatched
                      ? "bg-emerald-500/10 border-emerald-400 text-emerald-600 font-semibold cursor-not-allowed"
                      : isShaking
                        ? "animate-shake bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400"
                        : isSelected
                          ? "bg-primary/10 border-primary text-primary ring-2 ring-primary/40 shadow-sm"
                          : "bg-surface-raised border-border-subtle hover:border-primary/50 text-ink shadow-2xs"
                  }`}
                >
                  <span className="text-sm font-semibold line-clamp-2 leading-snug">{item.text}</span>
                  {isMatched && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
