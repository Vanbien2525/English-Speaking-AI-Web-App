"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IpaPhonemeItemDto, PhonemeDetailDrawerDto } from "@/core/dto/curriculum.dto";
import { IpaPhonemeCell } from "./IpaPhonemeCell";
import { IpaDetailDrawer } from "./IpaDetailDrawer";

interface IpaHeatmapGridProps {
  phonemes: IpaPhonemeItemDto[];
}

export function IpaHeatmapGrid({ phonemes }: IpaHeatmapGridProps) {
  const router = useRouter();
  const [selectedPhoneme, setSelectedPhoneme] = useState<PhonemeDetailDrawerDto | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Split into 3 international phonetic sections
  const monophthongs = phonemes.filter((p) => p.category === "monophthong");
  const diphthongs = phonemes.filter((p) => p.category === "diphthong");
  const consonants = phonemes.filter((p) => p.category === "consonant");

  const handleSelectPhoneme = (item: IpaPhonemeItemDto) => {
    // Construct drawer details (with mock / embedded guides)
    const drawerDetails: PhonemeDetailDrawerDto = {
      ...item,
      articulationGuideVi:
        item.category === "consonant"
          ? "Kiểm soát độ bật của luồng khí, vị trí đầu lưỡi và rung thanh quản chuẩn xác theo hướng dẫn khẩu hình 3D."
          : "Cố định độ mở hàm và độ nâng của thân lưỡi để duy trì độ vang nguyên âm ổn định.",
      commonVnSubstitutions:
        item.ipaSymbol === "θ"
          ? ["s", "t"]
          : item.ipaSymbol === "ð"
            ? ["d", "z"]
            : item.ipaSymbol === "ʃ"
              ? ["s"]
              : item.ipaSymbol === "tʃ"
                ? ["tr", "s"]
                : [],
      referenceVoice: "en-GB-SoniaNeural",
      relatedLessons: [
        {
          id: "019488a0-7b24-789a-8020-000000000001",
          slug: "dental-fricatives-th-dh",
          titleEn: "Dental Fricatives: /θ/ vs /ð/",
          titleVi: "Phân biệt cặp âm xát răng Think & This",
          cefr: "B1",
          xpReward: 50,
        },
      ],
    };

    setSelectedPhoneme(drawerDetails);
    setIsDrawerOpen(true);
  };

  const handleViewRelatedLessons = (phonemeId: string) => {
    router.push(`/learn?view=lessons&phonemeId=${phonemeId}`);
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface/50 border border-border-subtle/60 text-xs">
        <span className="font-semibold text-ink">Bản đồ nhiệt 44 Âm Vị IPA:</span>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500 border border-emerald-400" />
            <span className="text-ink-muted">Thành thạo (&gt;= 80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-500 border border-amber-400" />
            <span className="text-ink-muted">Lệch nhẹ (60% - 79%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500 border border-rose-400" />
            <span className="text-ink-muted">Cần cải thiện (&lt; 60%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-slate-700 border border-slate-600" />
            <span className="text-ink-muted">Chưa luyện (0%)</span>
          </div>
        </div>
      </div>

      {/* 1. Monophthongs (12 nguyên âm đơn) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>1. Nguyên Âm Đơn (Monophthongs)</span>
            <span className="text-xs text-ink-muted font-normal">({monophthongs.length} âm)</span>
          </h2>
          <span className="text-xs text-ink-muted">Sắp xếp theo vị trí lưỡi &amp; độ mở hàm</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {monophthongs.map((p) => (
            <IpaPhonemeCell
              key={p.id}
              phoneme={p}
              isSelected={selectedPhoneme?.id === p.id && isDrawerOpen}
              onSelect={() => handleSelectPhoneme(p)}
            />
          ))}
        </div>
      </section>

      {/* 2. Diphthongs (8 nguyên âm đôi) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>2. Nguyên Âm Đôi (Diphthongs)</span>
            <span className="text-xs text-ink-muted font-normal">({diphthongs.length} âm)</span>
          </h2>
          <span className="text-xs text-ink-muted">Trượt âm Centring (/ə/) &amp; Closing (/ɪ/, /ʊ/)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {diphthongs.map((p) => (
            <IpaPhonemeCell
              key={p.id}
              phoneme={p}
              isSelected={selectedPhoneme?.id === p.id && isDrawerOpen}
              onSelect={() => handleSelectPhoneme(p)}
            />
          ))}
        </div>
      </section>

      {/* 3. Consonants (24 phụ âm) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>3. Phụ Âm (Consonants)</span>
            <span className="text-xs text-ink-muted font-normal">({consonants.length} âm)</span>
          </h2>
          <span className="text-xs text-ink-muted">Cặp Vô thanh / Hữu thanh theo Place &amp; Manner</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {consonants.map((p) => (
            <IpaPhonemeCell
              key={p.id}
              phoneme={p}
              isSelected={selectedPhoneme?.id === p.id && isDrawerOpen}
              onSelect={() => handleSelectPhoneme(p)}
            />
          ))}
        </div>
      </section>

      {/* Slide-over Drawer */}
      <IpaDetailDrawer
        phoneme={selectedPhoneme}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onViewRelatedLessons={handleViewRelatedLessons}
      />
    </div>
  );
}
