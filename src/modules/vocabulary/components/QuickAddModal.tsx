"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useVocabularyStore } from "../stores/useVocabularyStore";

export function QuickAddModal() {
  const {
    isQuickAddOpen,
    decks,
    selectedDeckId,
    isEnriching,
    isLoading,
    setQuickAddOpen,
    enrichWord,
    createItem,
  } = useVocabularyStore();

  const [inputWord, setInputWord] = useState("");
  const [deckId, setDeckId] = useState(selectedDeckId || "");
  const [ipa, setIpa] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("noun");
  const [definitionVi, setDefinitionVi] = useState("");
  const [exampleSentenceEn, setExampleSentenceEn] = useState("");
  const [exampleSentenceVi, setExampleSentenceVi] = useState("");
  const [articulatoryTipVi, setArticulatoryTipVi] = useState("");
  const [referenceAudioUrl, setReferenceAudioUrl] = useState<string | null>(null);

  if (!isQuickAddOpen) return null;

  const handleEnrich = async () => {
    const trimmed = inputWord.trim();
    if (!trimmed) {
      toast.warning("Vui lòng nhập từ tiếng Anh cần tra cứu.");
      return;
    }

    const data = await enrichWord(trimmed);
    if (data) {
      setIpa(data.ipa);
      setPartOfSpeech(data.partOfSpeech || "noun");
      setDefinitionVi(data.definitionVi);
      setExampleSentenceEn(data.exampleSentenceEn || "");
      setExampleSentenceVi(data.exampleSentenceVi || "");
      setArticulatoryTipVi(data.articulatoryTipVi || "");
      setReferenceAudioUrl(data.referenceAudioUrl);
      toast.success(`Đã nạp dữ liệu cho từ "${data.word}"`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetDeckId =
      deckId || selectedDeckId || (decks.length > 0 && decks[0] ? decks[0].id : null);
    if (!targetDeckId) {
      toast.error("Vui lòng chọn một bộ từ (Deck) để lưu.");
      return;
    }

    if (!inputWord.trim() || !ipa.trim() || !definitionVi.trim()) {
      toast.warning("Vui lòng điền đủ từ, phiên âm IPA và nghĩa tiếng Việt.");
      return;
    }

    const success = await createItem({
      deckId: targetDeckId,
      word: inputWord.trim().toLowerCase(),
      ipa: ipa.trim(),
      partOfSpeech,
      definitionVi: definitionVi.trim(),
      exampleSentenceEn: exampleSentenceEn.trim(),
      exampleSentenceVi: exampleSentenceVi.trim(),
      articulatoryTipVi: articulatoryTipVi.trim(),
      referenceAudioUrl,
    });

    if (success) {
      toast.success(`Đã thêm từ "${inputWord.trim()}" vào bộ từ!`);
      // Reset form
      setInputWord("");
      setIpa("");
      setDefinitionVi("");
      setExampleSentenceEn("");
      setExampleSentenceVi("");
      setArticulatoryTipVi("");
      setReferenceAudioUrl(null);
      setQuickAddOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border-subtle bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <div>
            <h3 className="text-xl font-bold text-ink flex items-center gap-2">
              <span>⚡</span> Nhập Từ Thông Minh 1-Chạm
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Tự động tích hợp Free Dictionary API (IPA + audio) & AI (nghĩa tiếng Việt + khẩu hình)
            </p>
          </div>
          <button
            onClick={() => setQuickAddOpen(false)}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          {/* Deck Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase text-ink-muted mb-1">
              Bộ từ (Deck):
            </label>
            <select
              value={deckId || selectedDeckId || ""}
              onChange={(e) => setDeckId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-ink text-sm focus:border-primary outline-none"
            >
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Word Lookup */}
          <div>
            <label className="block text-xs font-semibold uppercase text-ink-muted mb-1">
              Từ tiếng Anh:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleEnrich();
                  }
                }}
                placeholder="Ví dụ: serendipity, eloquence, articulation..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-raised border border-border-subtle text-ink placeholder:text-ink-muted/50 focus:border-primary outline-none"
              />
              <button
                type="button"
                onClick={handleEnrich}
                disabled={isEnriching || !inputWord.trim()}
                className="px-4 py-2.5 rounded-xl bg-primary text-canvas font-semibold text-sm hover:brightness-110 disabled:opacity-50 transition active:scale-95"
              >
                {isEnriching ? "Đang tra cứu..." : "1-Chạm Tra Cứu"}
              </button>
            </div>
          </div>

          {/* Auto-filled details (Editable by user) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Phiên âm IPA:
              </label>
              <input
                type="text"
                value={ipa}
                onChange={(e) => setIpa(e.target.value)}
                placeholder="/ˌser.ənˈdɪp.ə.ti/"
                className="ipa w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-ink text-sm focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">Từ loại:</label>
              <select
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-ink text-sm focus:border-primary outline-none"
              >
                <option value="noun">noun (danh từ)</option>
                <option value="verb">verb (động từ)</option>
                <option value="adjective">adjective (tính từ)</option>
                <option value="adverb">adverb (trạng từ)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">
              Định nghĩa tiếng Việt:
            </label>
            <input
              type="text"
              value={definitionVi}
              onChange={(e) => setDefinitionVi(e.target.value)}
              placeholder="Sự tình cờ phát hiện ra những điều thú vị, may mắn"
              className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-ink text-sm focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">
              Câu ví dụ tiếng Anh:
            </label>
            <input
              type="text"
              value={exampleSentenceEn}
              onChange={(e) => setExampleSentenceEn(e.target.value)}
              placeholder="Finding this charming cafe was pure serendipity."
              className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-ink text-sm focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">
              Dịch câu ví dụ:
            </label>
            <input
              type="text"
              value={exampleSentenceVi}
              onChange={(e) => setExampleSentenceVi(e.target.value)}
              placeholder="Việc tìm thấy quán cà phê xinh xắn này là một sự tình cờ may mắn."
              className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-ink text-sm focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">
              Mẹo khẩu hình & đặt lưỡi:
            </label>
            <textarea
              value={articulatoryTipVi}
              onChange={(e) => setArticulatoryTipVi(e.target.value)}
              rows={2}
              placeholder="Trọng âm rơi vào âm tiết thứ 3 /ˈdɪp/. Giữ đầu lưỡi linh hoạt khi lướt qua âm /r/ và /l/..."
              className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-ink text-sm focus:border-primary outline-none resize-none"
            />
          </div>

          {referenceAudioUrl && (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span>🔊</span>
              <span>Đã tích hợp file phát âm bản ngữ chuẩn</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setQuickAddOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-surface-raised border border-border-subtle text-ink text-sm hover:border-primary/40 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || !inputWord.trim() || !definitionVi.trim()}
              className="px-6 py-2.5 rounded-xl bg-primary text-canvas font-bold text-sm hover:brightness-110 disabled:opacity-50 transition shadow"
            >
              {isLoading ? "Đang lưu..." : "Lưu vào Thẻ Học"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
