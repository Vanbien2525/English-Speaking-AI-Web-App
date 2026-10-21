import type { Metadata } from "next";
import { PracticeStudioPage } from "@/modules/ipa/practice/PracticeStudioPage";

export const metadata: Metadata = {
  title: "Phòng Luyện Phản Xạ Âm Vị IPA",
  description:
    "Luyện tập phản xạ phát âm với Cặp âm nhầm lẫn (Minimal Pairs), Nối từ & phiên âm IPA, Nghe & Chọn, và Sổ tay ôn tập lỗi sai.",
};

export default function PracticePage() {
  return (
    <main className="w-full flex-1">
      <PracticeStudioPage />
    </main>
  );
}
