import { describe, expect, it } from "vitest";
import { calculateUserLevel } from "@/core/domain/level-calculator";

describe("Level & Progression Calculator (Domain Logic)", () => {
  it("TC-LVL-01: returns Level 1 with 0% progress for a new user with 0 XP", () => {
    const levelInfo = calculateUserLevel(0n);

    expect(levelInfo.currentLevel).toBe(1);
    expect(levelInfo.currentLevelTitle).toBe("Người Mới Bắt Đầu (Novice Speaker)");
    expect(levelInfo.currentXp).toBe("0");
    expect(levelInfo.xpForNextLevel).toBe("100");
    expect(levelInfo.progressPercent).toBe(0);
  });

  it("TC-LVL-02: calculates correct progress percentage within Level 1", () => {
    const levelInfo = calculateUserLevel(50n);

    expect(levelInfo.currentLevel).toBe(1);
    expect(levelInfo.currentXp).toBe("50");
    expect(levelInfo.xpForNextLevel).toBe("100");
    expect(levelInfo.progressPercent).toBe(50);
  });

  it("TC-LVL-03: accurately promotes to Level 2 at exact threshold 100 XP", () => {
    const levelInfo = calculateUserLevel(100n);

    expect(levelInfo.currentLevel).toBe(2);
    expect(levelInfo.currentLevelTitle).toBe("Tập Sự Ngữ Âm (Phonetic Explorer)");
    expect(levelInfo.currentXp).toBe("100");
    expect(levelInfo.xpForNextLevel).toBe("400"); // 2^2 * 100 = 400
    expect(levelInfo.progressPercent).toBe(0);
  });

  it("TC-LVL-04: calculates progress percentage for higher levels (Level 4: Vocal Apprentice)", () => {
    // Level 4 is from 3^2 * 100 = 900 XP to 4^2 * 100 = 1600 XP (range = 700 XP)
    // At 1250 XP: (1250 - 900) / 700 = 350 / 700 = 50%
    const levelInfo = calculateUserLevel(1250n);

    expect(levelInfo.currentLevel).toBe(4);
    expect(levelInfo.currentLevelTitle).toBe("Huấn Viên Âm Vị (Vocal Apprentice)");
    expect(levelInfo.currentXp).toBe("1250");
    expect(levelInfo.xpForNextLevel).toBe("1600");
    expect(levelInfo.progressPercent).toBe(50);
  });

  it("TC-LVL-05: reaches Level 10 (RP Master) at 8,100 XP", () => {
    const levelInfo = calculateUserLevel(8100n);

    expect(levelInfo.currentLevel).toBe(10);
    expect(levelInfo.currentLevelTitle).toBe("Bậc Thầy Phát Âm RP (Received Pronunciation Master)");
    expect(levelInfo.currentXp).toBe("8100");
    expect(levelInfo.xpForNextLevel).toBe("10000"); // 10^2 * 100
    expect(levelInfo.progressPercent).toBe(0);
  });

  it("TC-LVL-06: clamps negative XP gracefully to 0 without throwing", () => {
    const levelInfo = calculateUserLevel(-50n);

    expect(levelInfo.currentLevel).toBe(1);
    expect(levelInfo.currentXp).toBe("0");
    expect(levelInfo.progressPercent).toBe(0);
  });
});
