import Link from "next/link";

import { Icon } from "@/components/ui";

// Детский мир — своя шапка без взрослого меню (решение заказчика 2026-10-10): ребёнок не потеряется, взрослый выйдет одной кнопкой.
export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="shell flex min-h-[76px] items-center justify-between gap-6 max-md:min-h-[64px]">
        <Link href="/kids" className="flex items-baseline gap-2.5" aria-label="Детский альбом">
          <span className="font-display text-2xl leading-none font-bold tracking-[-0.02em]">Видно</span>
          <span className="rounded-full bg-track px-2.5 py-1 text-[13px] leading-none font-semibold text-ink">Детям</span>
        </Link>
        <Link href="/learn" className="inline-flex min-h-14 items-center gap-2 rounded-full px-4 font-medium text-ink-2 transition-colors hover:bg-track hover:text-ink">
          <Icon name="back" /> Выйти
        </Link>
      </header>
      <main className="shell pt-2 pb-20">{children}</main>
    </>
  );
}
