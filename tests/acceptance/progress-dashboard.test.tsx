import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProgressDashboardView } from "@/modules/progress/components/ProgressDashboardView";
import type {
  AchievementItem,
  LeaderboardData,
  UserProgressDashboard,
} from "@/core/dto/progress.dto";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("Progress Dashboard Frontend Acceptance Suite (FEAT-GAMIFICATION-AND-PROGRESS)", () => {
  const mockDashboard: UserProgressDashboard = {
    userId: "019488a0-7b24-789a-bcde-000000000001",
    displayName: "Minh Quân",
    levelInfo: {
      currentLevel: 4,
      currentLevelTitle: "Huấn Viên Âm Vị (Vocal Apprentice)",
      currentXp: "1850",
      xpForNextLevel: "2500",
      progressPercent: 74,
    },
    streakInfo: {
      currentStreakDays: 7,
      longestStreakDays: 14,
      lastActiveDate: "2026-10-21",
      streakFreezesAvailable: 2,
      isFrozenToday: false,
      streakStatus: "active",
    },
    radarAxes: [
      {
        axisKey: "plosives",
        labelVi: "Âm Tắc",
        labelEn: "Plosives",
        scoreBp: 8500,
        percentage: 85,
        phonemesSample: ["/p/", "/b/"],
        attemptsCount: 20,
      },
      {
        axisKey: "fricatives",
        labelVi: "Âm Xát",
        labelEn: "Fricatives",
        scoreBp: 4800,
        percentage: 48,
        phonemesSample: ["/θ/", "/ð/"],
        attemptsCount: 25,
      },
      {
        axisKey: "affricates",
        labelVi: "Âm Tắc Xát",
        labelEn: "Affricates",
        scoreBp: 7200,
        percentage: 72,
        phonemesSample: ["/tʃ/"],
        attemptsCount: 15,
      },
      {
        axisKey: "nasals",
        labelVi: "Âm Mũi",
        labelEn: "Nasals",
        scoreBp: 9200,
        percentage: 92,
        phonemesSample: ["/m/", "/n/"],
        attemptsCount: 18,
      },
      {
        axisKey: "approximants",
        labelVi: "Âm Tiếp Cận",
        labelEn: "Approximants",
        scoreBp: 8100,
        percentage: 81,
        phonemesSample: ["/l/", "/r/"],
        attemptsCount: 16,
      },
      {
        axisKey: "vowels",
        labelVi: "Nguyên Âm",
        labelEn: "Vowels",
        scoreBp: 8400,
        percentage: 84,
        phonemesSample: ["/iː/", "/uː/"],
        attemptsCount: 30,
      },
    ],
    trendHistory: [
      { date: "2026-10-01", averageScoreBp: 6200, percentage: 62, attemptsCount: 4 },
      { date: "2026-10-07", averageScoreBp: 6800, percentage: 68, attemptsCount: 6 },
      { date: "2026-10-14", averageScoreBp: 7200, percentage: 72, attemptsCount: 8 },
      { date: "2026-10-21", averageScoreBp: 7840, percentage: 78.4, attemptsCount: 10 },
    ],
    recentLedger: [
      {
        id: "019488a0-7b24-789a-bcde-000000000010",
        amount: "+50",
        balanceAfter: "1850",
        source: "attempt_scored",
        sourceLabelVi: "Hoàn thành lượt luyện phát âm",
        referenceId: null,
        createdAt: "2026-10-21T08:00:00.000Z",
      },
      {
        id: "019488a0-7b24-789a-bcde-000000000011",
        amount: "+100",
        balanceAfter: "1800",
        source: "streak_bonus",
        sourceLabelVi: "Thưởng chuỗi ngày học liên tục",
        referenceId: null,
        createdAt: "2026-10-21T07:30:00.000Z",
      },
    ],
    summaryStats: {
      totalXp: "1850",
      lessonsCompleted: 8,
      totalAttempts: 124,
      averageMasteryBp: 7840,
    },
  };

  const mockWeeklyLeaderboard: LeaderboardData = {
    timeframe: "weekly",
    topRanked: [
      {
        rank: 1,
        userId: "019488a0-7b24-789a-bcde-000000000002",
        displayName: "Minh Anh (RP Master)",
        score: "4820",
        streakDays: 25,
        isCurrentUser: false,
      },
      {
        rank: 2,
        userId: "019488a0-7b24-789a-bcde-000000000003",
        displayName: "Alexandre T.",
        score: "4210",
        streakDays: 19,
        isCurrentUser: false,
      },
      {
        rank: 3,
        userId: "019488a0-7b24-789a-bcde-000000000004",
        displayName: "Thu Hà",
        score: "3950",
        streakDays: 15,
        isCurrentUser: false,
      },
    ],
    currentUserRank: {
      rank: 14,
      userId: "019488a0-7b24-789a-bcde-000000000001",
      displayName: "Bạn (Minh Quân)",
      score: "1850",
      streakDays: 7,
      isCurrentUser: true,
    },
  };

  const mockAllTimeLeaderboard: LeaderboardData = {
    timeframe: "all_time",
    topRanked: [
      {
        rank: 1,
        userId: "019488a0-7b24-789a-bcde-000000000002",
        displayName: "Minh Anh (RP Master)",
        score: "12800",
        streakDays: 60,
        isCurrentUser: false,
      },
      {
        rank: 2,
        userId: "019488a0-7b24-789a-bcde-000000000003",
        displayName: "Alexandre T.",
        score: "10500",
        streakDays: 45,
        isCurrentUser: false,
      },
      {
        rank: 3,
        userId: "019488a0-7b24-789a-bcde-000000000004",
        displayName: "Thu Hà",
        score: "9200",
        streakDays: 30,
        isCurrentUser: false,
      },
    ],
    currentUserRank: {
      rank: 14,
      userId: "019488a0-7b24-789a-bcde-000000000001",
      displayName: "Bạn (Minh Quân)",
      score: "1850",
      streakDays: 7,
      isCurrentUser: true,
    },
  };

  const mockAchievements: AchievementItem[] = [
    {
      id: "019488a0-7b24-789a-bcde-000000000101",
      code: "streak_7_days",
      titleVi: "Ngọn Lửa Tuần Lễ (7-Day Flame)",
      descriptionVi: "Duy trì chuỗi ngày học phát âm liên tục 7 ngày.",
      icon: "🔥",
      xpReward: 100,
      isUnlocked: true,
      unlockedAt: "2026-10-21T08:30:00.000Z",
    },
    {
      id: "019488a0-7b24-789a-bcde-000000000102",
      code: "vocal_virtuoso_level_10",
      titleVi: "Bậc Thầy Khẩu Hình (Level 10)",
      descriptionVi: "Cán mốc cấp bậc Bậc Thầy Phát Âm RP tại 8,100 XP.",
      icon: "👑",
      xpReward: 500,
      isUnlocked: false,
      unlockedAt: null,
    },
  ];

  it("TC-DASH-01: renders the 5 core sections of the Progress Dashboard", () => {
    render(
      <ProgressDashboardView
        dashboard={mockDashboard}
        weeklyLeaderboard={mockWeeklyLeaderboard}
        allTimeLeaderboard={mockAllTimeLeaderboard}
        achievements={mockAchievements}
      />,
    );

    // 1. Header with Level and Streak
    expect(screen.getByText(/Huấn Viên Âm Vị/)).toBeDefined();
    expect(screen.getByText("7 Ngày Chuỗi")).toBeDefined();
    expect(screen.getByText(/Bảo Vệ: 2/)).toBeDefined();

    // 2. Phoneme Radar Card
    expect(screen.getByText("Biểu Đồ Năng Lực 6 Nhóm Âm Vị")).toBeDefined();
    expect(screen.getByText(/Nhóm Âm Xát/)).toBeDefined(); // Warning for fricatives < 60%

    // 3. Trendline Card
    expect(screen.getByText("Đường Xu Hướng Phát Âm 30 Ngày")).toBeDefined();
    expect(screen.getByText("Gần nhất: 78.4%")).toBeDefined();

    // 4. Leaderboard Card
    expect(screen.getByText("Bảng Xếp Hạng Âm Học")).toBeDefined();
    expect(screen.getByText("Minh Anh (RP Master)")).toBeDefined();

    // 5. Achievements Grid
    expect(screen.getByText("Kho Danh Hiệu & Huy Hiệu")).toBeDefined();
    expect(screen.getByText("Ngọn Lửa Tuần Lễ (7-Day Flame)")).toBeDefined();
    expect(screen.getByText("Bậc Thầy Khẩu Hình (Level 10)")).toBeDefined();
  });

  it("TC-DASH-02: switches leaderboard tabs between Weekly and All-Time smoothly", () => {
    render(
      <ProgressDashboardView
        dashboard={mockDashboard}
        weeklyLeaderboard={mockWeeklyLeaderboard}
        allTimeLeaderboard={mockAllTimeLeaderboard}
        achievements={mockAchievements}
      />,
    );

    // Default is weekly: Minh Anh has 4820 XP
    expect(screen.getByText("4820 XP")).toBeDefined();

    // Switch to All-Time tab
    const allTimeTab = screen.getByText("Toàn Thời Gian");
    fireEvent.click(allTimeTab);

    // In All-Time, Minh Anh has 12800 XP
    expect(screen.getByText("12800 XP")).toBeDefined();
  });

  it("TC-DASH-03: opens and renders StreakFreezeModal when clicking the freeze button", () => {
    render(
      <ProgressDashboardView
        dashboard={mockDashboard}
        weeklyLeaderboard={mockWeeklyLeaderboard}
        allTimeLeaderboard={mockAllTimeLeaderboard}
        achievements={mockAchievements}
      />,
    );

    // Modal is initially not visible
    expect(screen.queryByText("Bảo Vệ Chuỗi Ngày Học")).toBeNull();

    // Click freeze shield button
    const freezeBtn = screen.getByText(/Bảo Vệ: 2/);
    fireEvent.click(freezeBtn);

    // Modal is now open
    expect(screen.getByText("Bảo Vệ Chuỗi Ngày Học")).toBeDefined();
    expect(screen.getByText(/🛡️ 2 Khiên/)).toBeDefined();

    // Click close button
    const closeBtn = screen.getByText("Đã Hiểu & Đóng");
    fireEvent.click(closeBtn);
  });

  it("TC-DASH-04: opens and renders XpLedgerHistoryDrawer when clicking 'Xem Sổ Cái XP'", () => {
    render(
      <ProgressDashboardView
        dashboard={mockDashboard}
        weeklyLeaderboard={mockWeeklyLeaderboard}
        allTimeLeaderboard={mockAllTimeLeaderboard}
        achievements={mockAchievements}
      />,
    );

    // Drawer is initially not visible
    expect(screen.queryByText("Sổ Cái Điểm Thưởng XP")).toBeNull();

    // Click "Xem Sổ Cái XP"
    const openDrawerBtn = screen.getByText("Xem Sổ Cái XP");
    fireEvent.click(openDrawerBtn);

    // Drawer is open
    expect(screen.getByText("Sổ Cái Điểm Thưởng XP")).toBeDefined();
    expect(screen.getAllByText("1850 XP").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Thưởng chuỗi ngày học liên tục")).toBeDefined();

    // Click close button
    const closeBtn = screen.getByLabelText("Đóng sổ cái");
    fireEvent.click(closeBtn);
  });
});
