import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource/charis-sil/400.css";
import "./globals.css";
import { AppProviders } from "@/shared/providers/AppProviders";
import { AppNavbar } from "@/components/navigation/AppNavbar";

export const metadata: Metadata = {
  title: {
    default: "AI Speaking Tutor 3D · Học Phát Âm IPA Chuẩn Quốc Tế",
    template: "%s · AI Speaking Tutor",
  },
  description:
    "Ứng dụng học phát âm tiếng Anh 44 âm IPA với AI chấm điểm từng âm vị, hướng dẫn khẩu hình chuẩn xác và phòng luyện tập phản xạ.",
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  colorScheme: "light",
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
        <AppProviders>
          <AppNavbar />
          <div className="flex-1 flex flex-col">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}
