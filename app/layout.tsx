import type { Metadata, Viewport } from "next";
import { Geologica, Onest } from "next/font/google";

import { CookieNotice } from "@/components/cookie-notice";
import { Metrika } from "@/components/metrika";

import "./globals.css";

// Заголовки — Geologica, текст и интерфейс — Onest: обе с полноценной кириллицей, отдаются с нашего сервера.
// Вариативная: оси CRSV и slnt дают курсивный «голос жеста» в той же гарнитуре.
const geologica = Geologica({ subsets: ["latin", "cyrillic"], axes: ["CRSV", "slnt"], variable: "--font-geologica" });
const onest = Onest({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], variable: "--font-onest" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3003"),
  title: { default: "Видно — школа русского жестового языка", template: "%s · Видно" },
  description: "Короткие уроки русского жестового языка с видео: смотрите жест, разбирайтесь и сразу пробуйте сами. Можно с нуля, в своём темпе.",
  // «Глухонемые» — только для поиска: в текстах сайта используем «глухие» и «неслышащие» (решение интервью).
  keywords: ["РЖЯ", "русский жестовый язык", "жестовый язык с нуля", "язык жестов", "уроки жестового языка", "глухие", "неслышащие", "глухонемые"],
  openGraph: { siteName: "Видно", locale: "ru_RU", type: "website" },
};

export const viewport: Viewport = { themeColor: "#F5F1EA", viewportFit: "cover" };

const ymId = /^\d+$/.test(process.env.YM_ID ?? "") ? process.env.YM_ID : undefined;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth" className={`${geologica.variable} ${onest.variable}`}>
      <body className="min-h-svh antialiased">
        {children}
        <CookieNotice />
        {ymId && <Metrika id={ymId} />}
      </body>
    </html>
  );
}
