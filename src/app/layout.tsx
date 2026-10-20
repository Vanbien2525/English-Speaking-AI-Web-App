import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource/charis-sil/400.css";
import "./globals.css";
import { AppProviders } from "@/shared/providers/AppProviders";

export const metadata: Metadata = {
  title: {
    default: "AI Speaking Tutor 3D",
    template: "%s · AI Speaking Tutor 3D",
  },
  description:
    "Luyện phát âm tiếng Anh chuẩn British RP với AI chấm điểm từng âm vị và mô phỏng 3D khẩu hình miệng.",
};

export const viewport: Viewport = {
  themeColor: "#0f1320",
  colorScheme: "dark",
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="vi">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
