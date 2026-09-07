import type { Metadata } from "next";
import { Geist } from "next/font/google";

import "./globals.css";

// 「細いサンセリフ」の基調フォント。等幅は使わないので Geist_Mono は入れない（docs/08 §8）。
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EC-PORTFOLIO",
    template: "%s | EC-PORTFOLIO",
  },
  description: "EC-PORTFOLIO — a minimal, monotone apparel brand.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* ここは <html><body> のシェルとフォント・globals だけ。
          個別レイアウト（(shop) / admin）は children 側に入る。
          QueryProvider / CartHydration はカート・認証の Step で追加する。 */}
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
