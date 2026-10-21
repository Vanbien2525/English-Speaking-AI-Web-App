"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useVocabularyStore } from "../stores/useVocabularyStore";
import type { BatchImportResponse } from "@/core/dto/vocabulary.dto";

export function BatchImportModal() {
  const {
    isBatchImportOpen,
    decks,
    selectedDeckId,
    isLoading,
    setBatchImportOpen,
    batchImport,
  } = useVocabularyStore();

  const [rawText, setRawText] = useState("");
  const [deckId, setDeckId] = useState(selectedDeckId || "");
  const [importReport, setImportReport] = useState<BatchImportResponse | null>(null);

  if (!isBatchImportOpen) return null;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetDeckId =
      deckId || selectedDeckId || (decks.length > 0 && decks[0] ? decks[0].id : null);
    if (!targetDeckId) {
      toast.error("Vui lòng chọn một bộ từ để nhập danh sách.");
      return;
    }

    if (!rawText.trim()) {
      toast.warning("Vui lòng dán danh sách từ vựng.");
      return;
    }

    const report = await batchImport(targetDeckId, rawText.trim());
    if (report) {
      setImportReport(report);
      toast.success(
        `Đã bóc tách thành công ${report.successCount}/${report.totalProcessed} từ!`,
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border-subtle bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <div>
            <h3 className="text-xl font-bold text-ink flex items-center gap-2">
              <span>📋</span> Nhập Hàng Loạt Bằng AI (Batch Import)
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Dán danh sách tối đa 20 từ. AI sẽ tự động tách từ, tra cứu IPA chuẩn và bổ sung nghĩa tiếng Việt.
            </p>
          </div>
          <button
            onClick={() => {
              setBatchImportOpen(false);
              setImportReport(null);
            }}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition"
          >
            ✕
          </button>
        </div>

        {!importReport ? (
          <form onSubmit={handleImport} className="flex flex-col gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-ink-muted mb-1">
                Lưu vào bộ từ (Deck):
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

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase text-ink-muted">
                  Danh sách từ tiếng Anh (Tối đa 20 từ):
                </label>
                <span className="text-[11px] text-ink-muted">
                  Phân cách bởi dấu phẩy, dấu chấm phẩy hoặc xuống dòng
                </span>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={6}
                placeholder="Ví dụ:&#10;serendipity, resilience, articulation, ubiquitous, ephemeral&#10;hoặc:&#10;1. eloquence&#10;2. meticulous&#10;3. tenacious"
                className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-border-subtle text-ink font-mono text-sm placeholder:text-ink-muted/50 focus:border-primary outline-none resize-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-ink leading-relaxed">
              <strong>💡 Cơ chế hoạt động:</strong> Mỗi từ trong danh sách sẽ được truy vấn song song qua Free Dictionary API để lấy audio người bản ngữ và IPA; sau đó AI Llama tự động tổng hợp nghĩa tiếng Việt, câu ví dụ và mẹo cấu âm khoang miệng.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setBatchImportOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-surface-raised border border-border-subtle text-ink text-sm hover:border-primary/40 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading || !rawText.trim()}
                className="px-6 py-2.5 rounded-xl bg-primary text-canvas font-bold text-sm hover:brightness-110 disabled:opacity-50 transition shadow"
              >
                {isLoading ? "AI đang bóc tách..." : "Bắt Đầu Tách & Nhập"}
              </button>
            </div>
          </form>
        ) : (
          /* Report Table View */
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-border-subtle">
              <div className="text-sm">
                <span className="font-semibold text-ink">Tổng số từ xử lý: </span>
                <span className="text-primary font-bold">{importReport.totalProcessed}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-400 font-semibold">
                  Thành công: {importReport.successCount}
                </span>
                {importReport.errorCount > 0 && (
                  <span className="text-coral-400 font-semibold">
                    Lỗi: {importReport.errorCount}
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-xl border border-border-subtle">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-raised text-ink-muted font-semibold uppercase sticky top-0 border-b border-border-subtle">
                  <tr>
                    <th className="p-2.5">Từ vựng</th>
                    <th className="p-2.5">Trạng thái</th>
                    <th className="p-2.5">Nghĩa tiếng Việt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-ink">
                  {importReport.results.map((res) => (
                    <tr key={res.word} className="hover:bg-surface-raised/40">
                      <td className="p-2.5 font-bold font-mono">{res.word}</td>
                      <td className="p-2.5">
                        {res.status === "success" ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                            Đã thêm
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-coral-500/20 text-coral-400 font-medium">
                            {res.errorMessage || "Lỗi"}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-ink-muted">
                        {res.item?.definitionVi || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => {
                  setImportReport(null);
                  setRawText("");
                }}
                className="px-4 py-2 rounded-xl bg-surface-raised border border-border-subtle text-ink text-xs hover:border-primary/40 transition"
              >
                Nhập tiếp danh sách khác
              </button>
              <button
                type="button"
                onClick={() => {
                  setBatchImportOpen(false);
                  setImportReport(null);
                  setRawText("");
                }}
                className="px-6 py-2 rounded-xl bg-primary text-canvas font-bold text-xs hover:brightness-110 transition shadow"
              >
                Hoàn tất & Quay lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
