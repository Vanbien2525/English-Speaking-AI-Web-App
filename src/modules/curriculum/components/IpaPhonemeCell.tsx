"use client";

import { motion } from "motion/react";
import type { IpaPhonemeItemDto } from "@/core/dto/curriculum.dto";

interface IpaPhonemeCellProps {
  phoneme: IpaPhonemeItemDto;
  isSelected?: boolean;
  onSelect: () => void;
}

export function IpaPhonemeCell({ phoneme, isSelected = false, onSelect }: IpaPhonemeCellProps) {
  // Map OKLCH luxury color styles
  const colorStyles = {
    emerald:
      "bg-emerald-950/30 text-emerald-400 border-emerald-500/40 hover:border-emerald-400/80 shadow-emerald-950/20",
    amber:
      "bg-amber-950/30 text-amber-400 border-amber-500/40 hover:border-amber-400/80 shadow-amber-950/20",
    coral:
      "bg-rose-950/30 text-rose-400 border-rose-500/40 hover:border-rose-400/80 shadow-rose-950/20",
    neutral:
      "bg-surface/50 text-ink-muted border-border-subtle/60 hover:border-border-subtle hover:text-ink",
  }[phoneme.statusColor];

  const scoreDisplay =
    phoneme.attemptsCount > 0 && phoneme.averageScoreBp !== null
      ? `${Math.round(phoneme.averageScoreBp / 100)}%`
      : "Chưa luyện";

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`group relative flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer min-h-[110px] ${colorStyles} ${
        isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-canvas shadow-xl" : ""
      }`}
    >
      {/* Top Meta: Voicing badge & Score Badge */}
      <div className="flex items-center justify-between w-full text-[10px] font-semibold tracking-wider">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            phoneme.isVoiced ? "bg-primary" : "bg-ink-muted/50"
          }`}
          title={phoneme.isVoiced ? "Hữu thanh (Voiced)" : "Vô thanh (Voiceless)"}
        />
        <span className="font-mono opacity-80">{scoreDisplay}</span>
      </div>

      {/* Center: Large IPA Symbol */}
      <div className="my-1 flex items-center justify-center">
        <span className="ipa text-2xl md:text-3xl font-extrabold tracking-wide transition-transform duration-200 group-hover:scale-110">
          /{phoneme.ipaSymbol}/
        </span>
      </div>

      {/* Bottom: Example Word */}
      <div className="flex items-center justify-between w-full pt-1 border-t border-white/5 text-[11px] text-ink-muted">
        <span className="truncate italic font-medium">{phoneme.exampleWord}</span>
        {phoneme.attemptsCount > 0 && (
          <span className="text-[10px] opacity-60">{phoneme.attemptsCount}x</span>
        )}
      </div>
    </motion.button>
  );
}
