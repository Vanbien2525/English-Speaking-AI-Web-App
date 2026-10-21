"use client";

import { useVocabularyStore } from "../stores/useVocabularyStore";

export function VocabularyTable() {
  const { items, isLoading, selectedDeckId, decks, setSelectedDeckId } = useVocabularyStore();

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

  return (
    <div className="w-full flex flex-col gap-4 p-6 rounded-2xl border border-border-subtle bg-surface shadow-md">
      {/* Table Header & Deck Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div>
          <h3 className="text-lg font-bold text-ink flex items-center gap-2">
            <span>📚</span> Danh Sách Từ Vựng Trong Bộ
          </h3>
          <p className="text-xs text-ink-muted">
            {currentDeck ? currentDeck.description || "Bộ từ vựng phản xạ" : "Tất cả các từ trong kho lưu trữ"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-ink-muted">Chọn Bộ từ:</label>
          <select
            value={selectedDeckId || ""}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-surface-raised border border-border-subtle text-ink text-xs focus:border-primary outline-none"
          >
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Table */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-ink-muted animate-pulse">
          Đang tải danh sách từ vựng...
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-xs text-ink-muted">
          Chưa có từ vựng nào trong bộ từ này. Hãy nhấn &ldquo;Nhập 1-Chạm&rdquo; hoặc &ldquo;Nhập hàng loạt&rdquo; để thêm từ mới!
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
                <th className="p-3">Chu Kỳ SM-2</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3 text-right">Phát âm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-ink">
              {items.map((item) => {
                const scorePercent =
                  item.lastMasteryScoreBp !== null ? Math.round(item.lastMasteryScoreBp / 100) : null;
                const scoreColor =
                  scorePercent === null
                    ? "text-ink-muted"
                    : scorePercent >= 80
                    ? "text-emerald-400 font-bold"
                    : scorePercent >= 60
                    ? "text-amber-400 font-semibold"
                    : "text-coral-400 font-semibold";

                return (
                  <tr key={item.id} className="hover:bg-surface-raised/40 transition">
                    <td className="p-3 font-bold font-mono text-sm">{item.word}</td>
                    <td className="p-3 ipa text-primary font-medium">/{item.ipa}/</td>
                    <td className="p-3 font-medium max-w-xs truncate" title={item.definitionVi}>
                      {item.definitionVi}
                    </td>
                    <td className={`p-3 ${scoreColor}`}>
                      {scorePercent !== null ? `${scorePercent}/100` : "Chưa kiểm tra"}
                    </td>
                    <td className="p-3 text-ink-muted">
                      {item.sm2IntervalDays} ngày ({item.sm2Repetition} lần)
                    </td>
                    <td className="p-3">
                      {item.isMastered ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                          ✓ Đã thuộc
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-medium">
                          ⏳ Đang học
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handlePlayAudio(item.referenceAudioUrl, item.word)}
                        className="px-2.5 py-1 rounded-lg bg-surface-raised border border-border-subtle hover:border-primary/50 text-ink text-xs transition"
                        title="Nghe giọng British RP"
                      >
                        🔊 Nghe
                      </button>
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
