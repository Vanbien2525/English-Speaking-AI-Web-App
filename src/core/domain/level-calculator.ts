import type { UserLevel } from "@/core/dto/progress.dto";

const LEVEL_TITLES: Record<number, string> = {
  1: "Người Mới Bắt Đầu (Novice Speaker)",
  2: "Tập Sự Ngữ Âm (Phonetic Explorer)",
  3: "Người Luyện Âm Chăm Chỉ (Vocal Apprentice)",
  4: "Huấn Viên Âm Vị (Vocal Apprentice)",
  5: "Chiến Binh Khẩu Hình (Articulatory Adept)",
  6: "Học Giả Ngữ Âm (Phonetics Scholar)",
  7: "Chuyên Gia Ngữ Điệu (Prosody Expert)",
  8: "Bậc Thầy Giọng Điệu (Accent Specialist)",
  9: "Cao Thủ Bản Xứ (Near-Native Virtuoso)",
  10: "Bậc Thầy Phát Âm RP (Received Pronunciation Master)",
};

export function calculateUserLevel(rawTotalXp: bigint): UserLevel {
  const safeXp = rawTotalXp < 0n ? 0n : rawTotalXp;
  const xpNum = Number(safeXp);

  // L(total_xp) = floor(sqrt(total_xp / 100)) + 1
  const currentLevel = Math.floor(Math.sqrt(xpNum / 100)) + 1;

  const floorXp = Math.pow(currentLevel - 1, 2) * 100;
  const nextLevelXp = Math.pow(currentLevel, 2) * 100;
  const range = nextLevelXp - floorXp;

  const progressPercent = range > 0 ? Math.round(((xpNum - floorXp) / range) * 100) : 0;
  const clampedProgress = Math.max(0, Math.min(100, progressPercent));

  const currentLevelTitle =
    LEVEL_TITLES[currentLevel] ?? "Bậc Thầy Huyền Thoại (Legendary RP Virtuoso)";

  return {
    currentLevel,
    currentLevelTitle,
    currentXp: safeXp.toString(),
    xpForNextLevel: nextLevelXp.toString(),
    progressPercent: clampedProgress,
  };
}
