import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";
import Link from "next/link";
import Nav from "@/components/nav"; // ⬅️ เพิ่มบรรทัดนี้

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KKU Classroom Companion",
  description: "แดชบอร์ดสำหรับล็อกอิน ค้นหาเพื่อนร่วมชั้น และแบ่งปันสถานะ",
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="th">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppProviders>
          <header className="app-header">
            <div className="container navbar">
              <Link href="/profile" className="brand" aria-label="KKU Classroom Companion">
                <span className="brand__dot" />
                <span>KKU Classroom</span>
              </Link>
              <Nav /> {/* ⬅️ ใช้ client nav */}
            </div>
          </header>
          <main className="container section--lg">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
