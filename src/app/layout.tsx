import type { Metadata } from "next";
import { AuthProvider } from '@/lib/supabase/auth-provider';
import "./globals.css";

export const metadata: Metadata = {
  title: "CulinarySeoul ERP - 통합 F&B 관리 솔루션",
  description: "FIFO 재고관리, 브랜드 분리 지원, 실시간 대시보드를 제공하는 통합 F&B 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
