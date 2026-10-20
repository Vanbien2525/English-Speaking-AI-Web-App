import Link from "next/link";
import type { Metadata } from "next";
import { getLeaderboardService } from "@/core/services/leaderboard-service";

export const metadata: Metadata = {
  title: "Bảng Xếp Hạng Âm Học Toàn Quốc | AI Speaking Tutor 3D",
  description: "Bảng vinh danh học viên có điểm số phát âm và chuỗi ngày học cao nhất toàn quốc.",
};

const DEFAULT_USER_ID = "019488a0-7b24-789a-bcde-000000000001";

interface LeaderboardPageProps {
  searchParams: Promise<{
    timeframe?: string;
  }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const resolvedParams = await searchParams;
  const timeframe: "weekly" | "all_time" =
    resolvedParams.timeframe === "all_time" ? "all_time" : "weekly";

  const leaderboardService = getLeaderboardService();
  const data = await leaderboardService.getLeaderboard(timeframe, DEFAULT_USER_ID);

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-8 md:px-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
        <Link href="/progress" className="hover:text-primary transition-colors flex items-center gap-1">
          <span>&larr;</span>
          <span>Bảng Điều Khiển Tiến Độ</span>
        </Link>
        <span>/</span>
        <span className="text-ink">Bảng Xếp Hạng Toàn Quốc</span>
      </div>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 rounded-2xl bg-surface p-6 border border-border-subtle shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/25">
            🏆 Vinh Danh Nỗ Lực Học Tập
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink mt-2">
            Bảng Xếp Hạng Âm Học Toàn Quốc
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Cạnh tranh lành mạnh, cùng nhau chinh phục chuẩn bản xứ British RP
          </p>
        </div>

        {/* Tab switcher */}
        <div className="inline-flex p-1 rounded-xl bg-surface-raised border border-border-subtle shrink-0">
          <Link
            href="/progress/leaderboard?timeframe=weekly"
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              timeframe === "weekly"
                ? "bg-primary/20 text-ink border border-primary/40 shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Tuần Này
          </Link>
          <Link
            href="/progress/leaderboard?timeframe=all_time"
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              timeframe === "all_time"
                ? "bg-primary/20 text-ink border border-primary/40 shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Toàn Thời Gian
          </Link>
        </div>
      </header>

      {/* Table Container */}
      <div className="rounded-2xl bg-surface border border-border-subtle shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-raised/60 text-ink-muted border-b border-border-subtle text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4 w-16 text-center">Hạng</th>
              <th className="py-3.5 px-4">Học Viên</th>
              <th className="py-3.5 px-4 text-center">Chuỗi Ngày</th>
              <th className="py-3.5 px-4 text-right">Điểm XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/40">
            {data.topRanked.map((entry) => {
              const isGold = entry.rank === 1;
              const isSilver = entry.rank === 2;
              const isBronze = entry.rank === 3;

              return (
                <tr
                  key={entry.userId}
                  className={`transition-colors ${
                    entry.isCurrentUser
                      ? "bg-primary/10 font-bold"
                      : "hover:bg-surface-raised/40"
                  }`}
                >
                  <td className="py-3.5 px-4 text-center">
                    {isGold ? (
                      <span className="text-base">🥇</span>
                    ) : isSilver ? (
                      <span className="text-base">🥈</span>
                    ) : isBronze ? (
                      <span className="text-base">🥉</span>
                    ) : (
                      <span className="text-ink-muted font-bold">#{entry.rank}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{entry.displayName}</span>
                      {entry.isCurrentUser && (
                        <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                          Bạn
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center text-ink-muted">
                    {entry.streakDays ? `🔥 ${entry.streakDays}d` : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-amber-400">
                    {entry.score} XP
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
