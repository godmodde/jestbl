import type { Metadata, Viewport } from "next";
import { Geologica, Nunito, Onest } from "next/font/google";

import { CookieNotice } from "@/components/cookie-notice";
import { Metrika } from "@/components/metrika";
import { PlushDefs } from "@/components/plush";
import { VariantSwitch } from "@/components/variant-switch";

import { VARIANT_COOKIE } from "@/lib/variant";

import "./globals.css";

// Заголовки — Geologica, текст и интерфейс — Onest: обе с полноценной кириллицей, отдаются с нашего сервера.
// Вариативная: оси CRSV и slnt дают курсивный «голос жеста» в той же гарнитуре.
const geologica = Geologica({ subsets: ["latin", "cyrillic"], axes: ["CRSV", "slnt"], variable: "--font-geologica" });
const onest = Onest({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], variable: "--font-onest" });
// Плюшевые заголовки детского мира (варианты 2 и 3): круглые концы штрихов — мех и фетр ложатся мягко. Файл грузится, только когда шрифт нужен.
const nunito = Nunito({ subsets: ["latin", "cyrillic"], weight: ["900"], variable: "--font-plush", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3003"),
  title: { default: "pAv — школа русского жестового языка", template: "%s · pAv" },
  description: "Короткие уроки русского жестового языка с видео: смотрите жест, разбирайтесь и сразу пробуйте сами. Можно с нуля, в своём темпе.",
  // «Глухонемые» — только для поиска: в текстах сайта используем «глухие» и «неслышащие» (решение интервью).
  keywords: ["РЖЯ", "русский жестовый язык", "жестовый язык с нуля", "язык жестов", "уроки жестового языка", "глухие", "неслышащие", "глухонемые"],
  openGraph: { siteName: "pAv", locale: "ru_RU", type: "website" },
};

export const viewport: Viewport = { themeColor: "#F5F1EA", viewportFit: "cover" };

const ymId = /^\d+$/.test(process.env.YM_ID ?? "") ? process.env.YM_ID : undefined;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Вариант макета ставится до отрисовки, без вспышки исходника (кнопка «Варианты»); у страниц остаётся статическая отдача.
    <html lang="ru" data-scroll-behavior="smooth" className={`${geologica.variable} ${onest.variable} ${nunito.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.dataset.v=(document.cookie.match(/(?:^|; )${VARIANT_COOKIE}=([123])/)||[0,"1"])[1]` }} />
      </head>
      <body className="min-h-svh antialiased">
        <PlushDefs />
        {children}
        <VariantSwitch />
        <CookieNotice />
        {ymId && <Metrika id={ymId} />}
      </body>
    </html>
  );
}
