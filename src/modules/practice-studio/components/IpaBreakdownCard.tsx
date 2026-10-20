"use client";

import { motion } from "motion/react";
import { usePracticeStore } from "../stores/usePracticeStore";
import { toDisplayPercent } from "@/core/domain/scoring";

export function IpaBreakdownCard() {
  const assessment = usePracticeStore((s) => s.assessment);
  const selectedPhonemeIndex = usePracticeStore((s) => s.selectedPhonemeIndex);
  const setSelectedPhoneme = usePracticeStore((s) => s.setSelectedPhoneme);

  // Default display data before any assessment is made (Academic baseline)
  const defaultWords = [
    {
      word: "think",
      phonemes: [
        {
          symbol: "θ",
          name: "Phụ âm xát răng",
          status: "minor",
          score: 68,
          desc: "Cần đưa nhẹ đầu lưỡi ra giữa hai kẽ răng",
          place: "Interdental (Giữa 2 răng)",
          manner: "Fricative (Xát)",
          voicing: "Voiceless (Không rung)",
        },
        {
          symbol: "ɪ",
          name: "Nguyên âm trước ngắn",
          status: "good",
          score: 95,
          desc: "Độ mở môi và độ nâng thân lưỡi chuẩn xác",
          place: "Front (Ngạc cứng)",
          manner: "Vowel (Nguyên âm)",
          voicing: "Voiced (Có rung)",
        },
        {
          symbol: "ŋ",
          name: "Phụ âm mũi ngạc mềm",
          status: "good",
          score: 91,
          desc: "Ngạc mềm hạ đúng vị trí để khí thoát qua mũi",
          place: "Velar (Ngạc mềm)",
          manner: "Nasal (Mũi)",
          voicing: "Voiced (Có rung)",
        },
        {
          symbol: "k",
          name: "Phụ âm tắc ngạc mềm",
          status: "major",
          score: 58,
          desc: "Âm bật chưa dứt khoát, bị thay thế bằng /t/",
          place: "Velar (Ngạc mềm)",
          manner: "Plosive (Bật nổ)",
          voicing: "Voiceless (Không rung)",
        },
      ],
    },
  ];

  // Map real assessment data if available
  const words = assessment
    ? assessment.words.map((w) => ({
        word: w.word,
        phonemes: w.phonemes.map((p) => {
          let status: "good" | "minor" | "major" = "minor";
          if (p.severity === "good") status = "good";
          if (p.severity === "major") status = "major";

          return {
            symbol: p.actualIpa || p.expectedIpa || "—",
            name: p.errorType === "correct" ? "Chuẩn xác" : `Lỗi ${p.errorType}`,
            status,
            score: toDisplayPercent(p.gopScoreBp),
            desc:
              p.errorType === "correct"
                ? "Khẩu hình và vị trí luồng hơi chuẩn xác"
                : `Phát âm bị lệch sang âm /${p.actualIpa || "?"}/`,
            place: p.expectedIpa === "θ" ? "Interdental (Kẽ răng)" : "Alveolar/Velar",
            manner: "Fricative / Plosive",
            voicing: "Voiceless",
          };
        }),
      }))
    : defaultWords;

  const fallbackWord = defaultWords[0] as (typeof defaultWords)[number];
  const currentWord: (typeof defaultWords)[number] = words[0] ?? fallbackWord;
  const allPhonemes = currentWord.phonemes;
  const currentPhoneme = allPhonemes[selectedPhonemeIndex] ?? allPhonemes[0] ?? fallbackWord.phonemes[0]!;

  const overallScore = assessment ? toDisplayPercent(assessment.overallScoreBp) : 78;

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-surface p-5 border border-border-subtle shadow-xl">
      {/* 1. Header & Overall Score Badge */}
      <div className="flex items-center justify-between border-b border-border-subtle/50 pb-4">
        <div>
          <h2 className="text-base font-bold text-ink">Phân Tích Âm Vị & Khẩu Hình</h2>
          <p className="text-xs text-ink-muted">Chẩn đoán giải phẫu cơ sinh học (IPA Breakdown)</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-2xl font-black text-ink">
              {overallScore}
              <span className="text-xs font-normal text-ink-muted">/100</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-400">
              {overallScore >= 80 ? "Đạt chuẩn bản xứ" : "Cần tinh chỉnh"}
            </span>
          </div>

          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold border ${
              overallScore >= 80
                ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40"
                : "bg-amber-950/40 text-amber-400 border-amber-500/40"
            }`}
          >
            {overallScore}%
          </div>
        </div>
      </div>

      {/* 2. Interactive Phoneme Chips */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>Chọn âm vị để đồng bộ khoang miệng 3D:</span>
          <span className="text-[11px] text-primary">Từ: &quot;{currentWord.word}&quot;</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {allPhonemes.map((p, idx) => {
            const isSelected = selectedPhonemeIndex === idx;
            let statusColor = "border-emerald-500/40 bg-emerald-950/20 text-emerald-400";
            if (p.status === "minor") {
              statusColor = "border-amber-500/40 bg-amber-950/20 text-amber-400";
            } else if (p.status === "major") {
              statusColor = "border-rose-500/40 bg-rose-950/20 text-rose-400";
            }

            return (
              <motion.button
                key={`${p.symbol}-${idx}`}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedPhoneme(idx)}
                className={`flex flex-col items-center justify-center rounded-xl p-2.5 transition-all border ${statusColor} ${
                  isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-canvas shadow-lg" : "opacity-85 hover:opacity-100"
                }`}
              >
                <span className="ipa text-xl font-bold tracking-wider">/{p.symbol}/</span>
                <span className="mt-1 text-[11px] font-semibold">{p.score}%</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 3. Detailed Articulatory Diagnostic Guide (Học thuật ngữ âm học) */}
      <div className="flex flex-col gap-3 rounded-xl bg-surface-raised p-4 border border-border-subtle">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            Chi tiết cấu âm: /{currentPhoneme.symbol}/
          </span>
          <span className="rounded bg-canvas px-2 py-0.5 text-[10px] font-mono text-ink-muted border border-border-subtle">
            {currentPhoneme.status === "good" ? "Chuẩn xác" : "Lệch âm"}
          </span>
        </div>

        {/* Anatomical Parameters */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-canvas/60 p-2 border border-border-subtle/50">
            <span className="text-[10px] text-ink-muted block">Vị trí cấu âm (Place):</span>
            <span className="font-semibold text-ink">{currentPhoneme.place}</span>
          </div>
          <div className="rounded-lg bg-canvas/60 p-2 border border-border-subtle/50">
            <span className="text-[10px] text-ink-muted block">Phương thức (Manner):</span>
            <span className="font-semibold text-ink">{currentPhoneme.manner}</span>
          </div>
        </div>

        {/* Pedagogical Guidance */}
        <div className="rounded-lg bg-canvas/80 p-2.5 text-xs text-ink-muted border-l-2 border-primary">
          <p className="font-medium text-ink mb-1">Chỉ dẫn thực hành:</p>
          <p className="leading-relaxed">{currentPhoneme.desc}</p>
        </div>
      </div>

      {/* 4. Formant Acoustic Radar Comparison (Acoustic Formants F1 vs F2) */}
      <div className="flex flex-col gap-2 rounded-xl bg-canvas p-3 border border-border-subtle/60 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink-muted">Tần số cộng hưởng Formant (F1/F2):</span>
          <span className="text-[10px] text-emerald-400 font-mono">Độ trùng khớp: 88%</span>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-ink-muted">
              <span>F1 (Độ mở hàm):</span>
              <span className="font-mono text-ink">320 Hz / 310 Hz (RP)</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface-raised overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: "85%" }} />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-ink-muted">
              <span>F2 (Độ lùi lưỡi):</span>
              <span className="font-mono text-ink">2150 Hz / 2200 Hz (RP)</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface-raised overflow-hidden">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: "92%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
