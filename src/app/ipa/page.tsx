import type { Metadata } from "next";
import { PhonemicChart } from "@/modules/ipa/PhonemicChart";

export const metadata: Metadata = {
  title: "Bản Đồ 44 Âm IPA Tiếng Anh",
  description: "Bảng âm vị quốc tế IPA với 44 âm tiếng Anh chuẩn British RP, phân biệt hữu thanh vô thanh và luyện phát âm từng âm vị.",
};

export default function IpaChartPage() {
  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12">
      <PhonemicChart />
    </main>
  );
}
