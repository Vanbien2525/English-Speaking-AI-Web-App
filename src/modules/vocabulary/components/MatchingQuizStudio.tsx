"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVocabularyStore } from "../stores/useVocabularyStore";

interface MatchTile {
  id: string; // Unique tile ID
  itemId: string; // Refers to VocabularyItem ID
  type: "word" | "definition";
  text: string;
  referenceAudioUrl?: string | null;
  word: string;
  isMatched: boolean;
}

export function MatchingQuizStudio() {
  const { items, selectedDeckId, decks, setSelectedDeckId } = useVocabularyStore();

  const generateTilesFromItems = (itemsArr: typeof items): MatchTile[] => {
    if (itemsArr.length === 0) return [];
    const gameItems = [...itemsArr].sort(() => 0.5 - Math.random()).slice(0, 6);
    const generatedTiles: MatchTile[] = [];
    gameItems.forEach((item) => {
      generatedTiles.push({
        id: `word-${item.id}`,
        itemId: item.id,
        type: "word",
        text: item.word,
        referenceAudioUrl: item.referenceAudioUrl,
        word: item.word,
        isMatched: false,
      });
      generatedTiles.push({
        id: `def-${item.id}`,
        itemId: item.id,
        type: "definition",
        text: item.definitionVi,
        referenceAudioUrl: item.referenceAudioUrl,
        word: item.word,
        isMatched: false,
      });
    });
    return generatedTiles.sort(() => 0.5 - Math.random());
  };

  const [prevDeckId, setPrevDeckId] = useState(selectedDeckId);
  const [tiles, setTiles] = useState<MatchTile[]>(() => generateTilesFromItems(items));
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [, startTransition] = useTransition();

  if (prevDeckId !== selectedDeckId) {
    setPrevDeckId(selectedDeckId);
    setTiles(generateTilesFromItems(items));
    setSelectedTileId(null);
    setMatchedPairsCount(0);
    setIsCompleted(false);
  }

  const playPronunciation = (url: string | null | undefined, wordText: string) => {
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(() => playWebSpeech(wordText));
    } else {
      playWebSpeech(wordText);
    }
  };

  const playWebSpeech = (wordText: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(wordText);
    utterance.lang = "en-GB";
    window.speechSynthesis.speak(utterance);
  };

  const startNewGame = () => {
    setTiles(generateTilesFromItems(items));
    setSelectedTileId(null);
    setMatchedPairsCount(0);
    setIsCompleted(false);
  };

  const handleTileClick = (clickedTile: MatchTile) => {
    if (clickedTile.isMatched) return;

    if (!selectedTileId) {
      setSelectedTileId(clickedTile.id);
      return;
    }

    if (selectedTileId === clickedTile.id) {
      setSelectedTileId(null);
      return;
    }

    const firstTile = tiles.find((t) => t.id === selectedTileId);
    if (!firstTile) {
      setSelectedTileId(clickedTile.id);
      return;
    }

    // Check if matching pair (same itemId but different tile type)
    if (firstTile.itemId === clickedTile.itemId && firstTile.type !== clickedTile.type) {
      // Play audio pronunciation upon successful match
      playPronunciation(clickedTile.referenceAudioUrl, clickedTile.word);

      // Mark tiles as matched
      startTransition(() => {
        setTiles((prev) =>
          prev.map((t) => (t.itemId === clickedTile.itemId ? { ...t, isMatched: true } : t))
        );
        setSelectedTileId(null);
        setMatchedPairsCount((prev) => {
          const nextCount = prev + 1;
          if (nextCount >= Math.min(items.length, 6)) {
            setIsCompleted(true);
          }
          return nextCount;
        });
      });
    } else {
      // Mismatch
      setSelectedTileId(null);
    }
  };

  const currentDeck = decks.find((d) => d.id === selectedDeckId);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-6 rounded-3xl bg-surface border border-border-subtle shadow-xl">
      {/* Deck Selector Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <span>🧩</span> Matching Quiz Studio (Nối Từ & Nghĩa)
          </h2>
          <p className="text-xs text-ink-muted mt-1">
            Chạm nối từ vựng tiếng Anh với nghĩa tiếng Việt tương ứng. Phát âm British RP tự động khi ghép đúng!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-ink-muted font-medium">Bộ từ:</label>
          <select
            value={selectedDeckId || ""}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-surface-raised border border-border-subtle text-ink text-xs focus:border-primary outline-none"
          >
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name} ({deck.itemCount} từ)
              </option>
            ))}
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-12 text-center text-xs text-ink-muted">
          Bộ từ vựng này chưa có dữ liệu. Hãy chọn bộ khác hoặc thêm từ mới!
        </div>
      ) : isCompleted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center p-10 text-center gap-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl"
        >
          <span className="text-5xl">🎉</span>
          <h3 className="text-xl font-bold text-emerald-400">Hoàn Thành Ghép Thẻ Chuẩn Xác!</h3>
          <p className="text-xs text-ink-muted">
            Bạn đã nối thành công tất cả {matchedPairsCount} cặp từ vựng thuộc bộ {currentDeck?.name}.
          </p>
          <button
            type="button"
            onClick={startNewGame}
            className="px-6 py-2.5 rounded-xl bg-primary text-canvas font-bold text-xs shadow-lg hover:brightness-110 transition"
          >
            <span>🔄 Chơi Lại Lượt Mới</span>
          </button>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
            <span>Tiến độ ghép cặp:</span>
            <span className="text-primary font-bold">
              {matchedPairsCount} / {Math.min(items.length, 6)} Cặp
            </span>
          </div>

          {/* Tiles Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <AnimatePresence>
              {tiles.map((tile) => {
                const isSelected = selectedTileId === tile.id;
                const isMatched = tile.isMatched;

                return (
                  <motion.button
                    key={tile.id}
                    type="button"
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: isMatched ? 0.4 : 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => handleTileClick(tile)}
                    disabled={isMatched}
                    className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center min-h-[90px] shadow-sm ${
                      isMatched
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 line-through cursor-default"
                        : isSelected
                        ? "bg-primary text-canvas border-primary font-bold shadow-md ring-2 ring-primary/50"
                        : "bg-surface-raised border-border-subtle hover:border-primary/50 text-ink"
                    }`}
                  >
                    <span className={`text-xs font-bold ${tile.type === "word" ? "font-mono text-sm" : ""}`}>
                      {tile.text}
                    </span>
                    <span className="text-[10px] text-ink-muted/80 mt-1 uppercase font-semibold">
                      {tile.type === "word" ? "Tiếng Anh" : "Tiếng Việt"}
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
