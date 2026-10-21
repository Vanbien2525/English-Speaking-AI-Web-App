"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useVocabularyStore } from "../stores/useVocabularyStore";

export function CreateDeckModal() {
  const { isCreateDeckModalOpen, setCreateDeckModalOpen, createDeck } = useVocabularyStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreateDeckModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên bộ từ vựng");
      return;
    }

    setIsSubmitting(true);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const success = await createDeck({
      name: name.trim(),
      description: description.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });

    setIsSubmitting(false);

    if (success) {
      toast.success(`Đã tạo thành công bộ từ: "${name.trim()}"`);
      setName("");
      setDescription("");
      setTagsInput("");
      setCreateDeckModalOpen(false);
    } else {
      toast.error("Không thể tạo bộ từ vựng, vui lòng thử lại");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md p-6 rounded-2xl border border-border-subtle bg-surface shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="text-xl">📁</span>
            <h3 className="text-base font-bold text-ink">Tạo Bộ Từ Vựng Mới</h3>
          </div>
          <button
            type="button"
            onClick={() => setCreateDeckModalOpen(false)}
            className="text-ink-muted hover:text-ink text-sm p-1 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink">
              Tên bộ từ vựng <span className="text-coral-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Từ vựng Phỏng Vấn & Công Sở, IELTS Speaking..."
              className="px-3.5 py-2 rounded-xl bg-surface-raised border border-border-subtle text-ink text-sm outline-none focus:border-primary"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink">Mô tả mục tiêu</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: 50 từ vựng cốt lõi phục vụ phản xạ nói trong buổi họp và phỏng vấn việc làm"
              rows={3}
              className="px-3.5 py-2 rounded-xl bg-surface-raised border border-border-subtle text-ink text-sm outline-none focus:border-primary resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink">
              Thẻ phân loại (Tags, phân cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="VD: Business, Interview, C1, Advanced"
              className="px-3.5 py-2 rounded-xl bg-surface-raised border border-border-subtle text-ink text-sm outline-none focus:border-primary"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setCreateDeckModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-surface-raised text-ink-muted hover:text-ink text-xs font-semibold transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-primary text-canvas text-xs font-bold hover:brightness-110 active:scale-95 transition shadow disabled:opacity-50"
            >
              {isSubmitting ? "Đang lưu..." : "Tạo Thư Mục / Bộ Từ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
