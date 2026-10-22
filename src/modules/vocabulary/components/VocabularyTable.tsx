"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { VocabularyItem } from "@/core/dto/vocabulary.dto";
import { useVocabularyStore } from "../stores/useVocabularyStore";

export function VocabularyTable() {
  const {
    allItems,
    items,
    isLoading,
    selectedDeckId,
    decks,
    learnItemNow,
    setCreateDeckModalOpen,
    updateItemLevelManual,
    deleteItem,
    deleteDeck,
  } = useVocabularyStore();

  const [levelFilter, setLevelFilter] = useState<"all" | "again" | "good" | "easy">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handlePlayAudio = (url: string | null | undefined, word: string) => {
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(() => playWebSpeech(word));
    } else {
      playWebSpeech(word);
    }
  };

  const playWebSpeech = (word: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-GB";
    window.speechSynthesis.speak(utterance);
  };

  const currentDeck = decks.find((d) => d.id === selectedDeckId);

  // Filter items based on selected filters and sort newest first
  const filteredItems = useMemo(() => {
    const result = items.filter((item) => {
      // 1. Text Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchWord = item.word.toLowerCase().includes(query);
        const matchDef = item.definitionVi.toLowerCase().includes(query);
        if (!matchWord && !matchDef) return false;
      }

      // 2. SM-2 Level Filter
      if (levelFilter !== "all") {
        const score = item.lastMasteryScoreBp ?? 0;
        let itemLevel: "again" | "good" | "easy" = "again";
        if (score >= 9000 || item.sm2IntervalDays >= 7) {
          itemLevel = "easy";
        } else if (score >= 8000 || item.sm2IntervalDays >= 2) {
          itemLevel = "good";
        }

        if (itemLevel !== levelFilter) return false;
      }

      return true;
    });

    // Sắp xếp từ mới nhất lên đầu
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [items, searchQuery, levelFilter]);

  return (
    <div className="w-full flex flex-col gap-4 p-6 rounded-2xl border border-border-subtle bg-surface shadow-md">
      {/* Table Header & Deck Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div>
          <h3 className="text-lg font-bold text-ink flex items-center gap-2">
            <span>📚</span> Quản Lý Bộ Từ Vựng
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCreateDeckModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition flex items-center gap-1 cursor-pointer"
            title="Tạo bộ từ vựng mới"
          >
            <span>+</span> Tạo Bộ
          </button>
          {selectedDeckId && currentDeck && (
            <button
              type="button"
              onClick={async () => {
                const count = (allItems || items).filter((i) => i.deckId === selectedDeckId).length;
                const confirmed = window.confirm(
                  `Bạn có chắc chắn muốn xóa bộ từ "${currentDeck.name}" cùng ${count} từ vựng trong bộ này không?`
                );
                if (confirmed) {
                  const success = await deleteDeck(selectedDeckId);
                  if (success) {
                    toast.success(`Đã xóa bộ từ "${currentDeck.name}" thành công`);
                  } else {
                    toast.error(`Không thể xóa bộ từ "${currentDeck.name}"`);
                  }
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold hover:bg-red-500/20 transition flex items-center gap-1 cursor-pointer"
              title={`Xóa bộ từ "${currentDeck.name}"`}
            >
              <span>🗑️</span> Xóa Bộ
            </button>
          )}
        </div>
      </div>

      {/* Multi-Dimensional Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-surface-raised border border-border-subtle">
        {/* Search input */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-xs text-ink-muted">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo từ hoặc nghĩa..."
            className="w-full bg-surface border border-border-subtle rounded-lg px-2.5 py-1 text-xs text-ink placeholder:text-ink-muted outline-none focus:border-primary"
          />
        </div>

        {/* Level Filter Tabs */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-ink-muted font-medium mr-1">Cấp độ:</span>
          <button
            type="button"
            onClick={() => setLevelFilter("all")}
            className={`px-2.5 py-1 rounded-lg transition text-xs font-medium ${
              levelFilter === "all"
                ? "bg-primary text-canvas font-bold"
                : "bg-surface text-ink-muted hover:text-ink"
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setLevelFilter("again")}
            className={`px-2.5 py-1 rounded-lg transition text-xs font-medium flex items-center gap-1 ${
              levelFilter === "again"
                ? "bg-red-600 text-white font-bold"
                : "bg-surface text-red-500 hover:bg-red-500/10"
            }`}
          >
            <span>🔴</span> Again (Cấp 1)
          </button>
          <button
            type="button"
            onClick={() => setLevelFilter("good")}
            className={`px-2.5 py-1 rounded-lg transition text-xs font-medium flex items-center gap-1 ${
              levelFilter === "good"
                ? "bg-amber-500 text-canvas font-bold"
                : "bg-surface text-amber-500 hover:bg-amber-500/10"
            }`}
          >
            <span>🟡</span> Good (Cấp 2)
          </button>
          <button
            type="button"
            onClick={() => setLevelFilter("easy")}
            className={`px-2.5 py-1 rounded-lg transition text-xs font-medium flex items-center gap-1 ${
              levelFilter === "easy"
                ? "bg-emerald-500 text-canvas font-bold"
                : "bg-surface text-emerald-500 hover:bg-emerald-500/10"
            }`}
          >
            <span>🟢</span> Easy (Cấp 3)
          </button>
        </div>
      </div>

      {/* Items Table */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-ink-muted animate-pulse">
          Đang tải danh sách từ vựng...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 text-center text-xs text-ink-muted">
          Không tìm thấy từ vựng nào khớp với bộ lọc. Hãy thay đổi điều kiện lọc hoặc thêm từ mới!
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-subtle">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised text-ink-muted uppercase font-semibold border-b border-border-subtle">
              <tr>
                <th className="p-3">Từ vựng</th>
                <th className="p-3">Phiên âm IPA</th>
                <th className="p-3">Nghĩa tiếng Việt</th>
                <th className="p-3">Điểm Nói</th>
                <th className="p-3">Cấp Độ</th>
                <th className="p-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-ink">
              {filteredItems.map((item: VocabularyItem) => {
                const scorePercent =
                  item.lastMasteryScoreBp !== null ? Math.round(item.lastMasteryScoreBp / 100) : null;
                const scoreColor =
                  scorePercent === null
                    ? "text-ink-muted"
                    : scorePercent >= 80
                    ? "text-emerald-500 font-bold"
                    : scorePercent >= 60
                    ? "text-amber-500 font-semibold"
                    : "text-red-500 font-semibold";

                // Determine level tag
                const isEasy = (scorePercent ?? 0) >= 90 || item.sm2IntervalDays >= 7;
                const isGood = (scorePercent ?? 0) >= 80 || item.sm2IntervalDays >= 2;

                return (
                  <tr key={item.id} className="hover:bg-surface-raised/40 transition">
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => {
                          learnItemNow(item.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="font-bold font-mono text-sm text-primary hover:underline flex items-center gap-1.5"
                        title="Bấm để học lại từ này ngay lập tức"
                      >
                        <span>{item.word}</span>
                      </button>
                    </td>
                    <td className="p-3 ipa text-primary font-medium">/{item.ipa.replace(/^\/+|\/+$/g, "")}/</td>
                    <td className="p-3 font-medium max-w-xs truncate" title={item.definitionVi}>
                      {item.definitionVi}
                    </td>
                    <td className={`p-3 ${scoreColor}`}>
                      {scorePercent !== null ? `${scorePercent}/100` : "Chưa kiểm tra"}
                    </td>
                    <td className="p-3">
                      <select
                        value={isEasy ? "easy" : isGood ? "good" : "again"}
                        onChange={(e) => updateItemLevelManual(item.id, e.target.value === "again" ? "new" : e.target.value === "good" ? "learning" : "mastered")}
                        className="text-xs font-bold px-2 py-1.5 rounded-lg border border-border-subtle bg-surface text-ink cursor-pointer outline-none focus:border-primary shadow-2xs"
                        title="Tự chọn cấp độ"
                      >
                        <option value="again">🔴 Again (Cấp 1)</option>
                        <option value="good">🟡 Good (Cấp 2)</option>
                        <option value="easy">🟢 Easy (Cấp 3)</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            learnItemNow(item.id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-primary text-canvas font-semibold text-xs hover:brightness-110 transition shadow flex items-center gap-1"
                          title="Mở Thẻ 3D để luyện lại từ này ngay"
                        >
                          <span>⚡</span> Luyện lại
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(item.referenceAudioUrl, item.word)}
                          className="px-2.5 py-1 rounded-lg bg-surface-raised border border-border-subtle hover:border-primary/50 text-ink text-xs transition flex items-center gap-1"
                          title="Nghe giọng British RP"
                        >
                          <span>🔊 Nghe</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa từ "${item.word}" khỏi bộ từ vựng không?`);
                            if (confirmed) {
                              const success = await deleteItem(item.id);
                              if (success) {
                                toast.success(`Đã xóa từ "${item.word}" thành công`);
                              } else {
                                toast.error(`Không thể xóa từ "${item.word}"`);
                              }
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-500 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                          title={`Xóa từ "${item.word}"`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
