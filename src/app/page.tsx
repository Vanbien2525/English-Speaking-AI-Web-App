import type { Metadata } from "next";
import { DashboardView } from "@/modules/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "AI Speaking Tutor · Luyện Phát Âm Tiếng Anh Chuẩn IPA",
  description: "Nền tảng học phát âm tiếng Anh chuẩn 44 âm IPA với AI chấm điểm từng âm vị và phòng luyện tập phản xạ.",
};

export default function HomePage() {
  return (
    <main className="w-full flex-1">
      <DashboardView />
    </main>
  );
}
