import type { Metadata } from "next";
import { DashboardView } from "@/modules/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "Dashboard Cá Nhân Hóa · AI Speaking Tutor",
  description: "Tổng quan tiến độ thành thạo 44 âm IPA, điểm số phát âm trung bình và mục tiêu luyện tập hôm nay.",
};

export default function DashboardPage() {
  return (
    <main className="w-full flex-1">
      <DashboardView />
    </main>
  );
}
