"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Box,
  Flame,
  CheckCircle2,
  Volume2,
} from "lucide-react";
import { getStoredPhonemeScores, getStoredErrorWords } from "@/shared/lib/ipa-storage";
import { getRealDailyStreak } from "@/shared/lib/streak-tracker";

export function AppNavbar() {
  const pathname = usePathname();
  const [masteredCount, setMasteredCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [streakDays, setStreakDays] = useState(1);

  useEffect(() => {
    const updateStats = () => {
      const scores = getStoredPhonemeScores();
      const mastered = Object.values(scores).filter((s) => s >= 80).length;
      setMasteredCount(mastered);

      const errors = getStoredErrorWords();
      setErrorCount(errors.length);

      setStreakDays(getRealDailyStreak());
    };

    const timer = setTimeout(updateStats, 0);
    window.addEventListener("storage", updateStats);
    window.addEventListener("ast3d_ipa_storage_updated", updateStats);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage", updateStats);
      window.removeEventListener("ast3d_ipa_storage_updated", updateStats);
    };
  }, [pathname]);

  const isIpaActive = pathname.startsWith("/ipa");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:px-12">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-200">
              <Volume2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
                AI Speaking Tutor
              </span>
              <span className="text-[11px] font-medium text-emerald-600">
                Phòng Luyện Phát Âm 3D
              </span>
            </div>
          </Link>

          {/* Primary Navigation Links */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Main Navigation">
            {/* 1. Dashboard */}
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                pathname === "/dashboard" || pathname === "/"
                  ? "bg-slate-100 text-slate-900 shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>

            {/* 2. IPA Nav Group: Toàn bộ phân hệ IPA (Gồm Lưới 44 âm & Phòng Luyện Tập) */}
            <Link
              href="/ipa"
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                isIpaActive
                  ? "bg-emerald-50 text-emerald-700 shadow-xs ring-1 ring-emerald-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <BookOpen className="h-4 w-4 text-emerald-600" />
              <span>Học IPA (44 Âm &amp; Luyện Tập)</span>
              {masteredCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {masteredCount}/44
                </span>
              )}
              {errorCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  {errorCount} lỗi
                </span>
              )}
            </Link>

            {/* 3. 3D Model (Coming Soon) - Disabled state */}
            <div
              className="relative group flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-400 bg-slate-100/60 cursor-not-allowed select-none opacity-70"
              title="Tính năng mô phỏng khoang miệng 3D đang được tinh chỉnh hoàn thiện"
            >
              <Box className="h-4 w-4 text-slate-400" />
              <span>3D Model</span>
              <span className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                Coming Soon
              </span>
            </div>
          </nav>
        </div>

        {/* Right Status Badge */}
        <div className="flex items-center gap-3">
          {/* Quick Stats: Mastered count */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Thành thạo (≥80%):</span>
            <span className="font-bold text-emerald-600">{masteredCount}</span>
            <span className="text-slate-400">/ 44</span>
          </div>

          {/* Quick Stats: Daily Streak */}
          <div className="flex items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-1.5 text-xs font-bold text-amber-700 shadow-xs">
            <Flame className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse" />
            <span>{streakDays} Ngày</span>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden border-t border-slate-100 bg-white/90 px-3 py-2 justify-around">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 rounded-lg ${
            pathname === "/dashboard" || pathname === "/" ? "text-emerald-600 font-bold" : "text-slate-600"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          href="/ipa"
          className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 rounded-lg ${
            isIpaActive ? "text-emerald-600 font-bold" : "text-slate-600"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Học IPA &amp; Luyện Tập
        </Link>
        <div className="flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 text-slate-300 cursor-not-allowed">
          <Box className="h-4 w-4" />
          3D (Soon)
        </div>
      </div>
    </header>
  );
}
