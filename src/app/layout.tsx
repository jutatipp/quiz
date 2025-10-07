import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";
import { Navbar } from "@/components/nav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KKU Classroom Companion",
  description: "แดชบอร์ดสำหรับล็อกอิน ค้นหาเพื่อนร่วมชั้น และแบ่งปันสถานะ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AppProviders>
          <Navbar />
          <main className="container" style={{ paddingBlock: "24px 56px" }}>
            {children}
          </main>
        </AppProviders>
      </body>
    </html>
  );
}
