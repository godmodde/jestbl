"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useSlideMark } from "@/lib/use-slide-mark";

// Меню-пилюля (решение заказчика 2026-10-10): якоря разделов главной. На первом экране — в шапке по центру; при прокрутке
// плавно переезжает вниз по центру экрана, как панель приложения, и подсвечивает раздел, который сейчас на экране.

export type Section = { id: string; label: string };
const FLOAT_AFTER = 160; // px прокрутки: шапка уже уходит из вида

export function NavPill({ items }: { items: Section[] }) {
  const [floating, setFloating] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const list = useRef<HTMLUListElement>(null);
  const mark = useSlideMark<HTMLLIElement>(list, "[aria-current]", active);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setFloating(scrollY > FLOAT_AFTER);
      // Линия на трети высоты, а не посередине: после перехода по якорю короткий раздел (отзывы на телефоне) — текущий.
      const line = innerHeight * 0.35;
      let current: string | null = null;
      for (const item of items) {
        const r = document.getElementById(item.id)?.getBoundingClientRect();
        if (r && r.top <= line && r.bottom >= line) current = item.id;
      }
      setActive(current);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    schedule();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    return () => { removeEventListener("scroll", schedule); removeEventListener("resize", schedule); cancelAnimationFrame(raf); };
  }, [items]);

  // На телефоне пилюля шире экрана и листается вбок: текущий раздел выезжает в её середину.
  useEffect(() => {
    const ul = list.current, el = ul?.querySelector<HTMLElement>("[aria-current]");
    if (!ul || !el || ul.scrollWidth <= ul.clientWidth) return;
    const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    ul.scrollTo({ left: el.offsetLeft - (ul.clientWidth - el.offsetWidth) / 2, behavior: smooth ? "smooth" : "auto" });
  }, [active]);

  return (
    <>
      {/* Пилюля в шапке — с 1024 px; до 1400 px компактнее, чтобы шесть пунктов помещались рядом с логотипом и ссылками.
          Место держим всегда: шапка не прыгает. */}
      <nav aria-label="Разделы главной" inert={floating}
        className={`justify-self-center text-[15px] font-medium transition-[opacity,translate] duration-300 ease-out max-lg:hidden ${floating ? "pointer-events-none opacity-0 motion-safe:-translate-y-2" : ""}`}>
        <ul className="m-0 flex list-none items-center gap-1 rounded-full border border-white/80 bg-surface/50 p-1 shadow-[0_8px_24px_-18px_rgba(29,28,26,0.35)]">
          {items.map((i) => (
            <li key={i.id}><Link href={`/#${i.id}`} className="press inline-flex min-h-10 items-center rounded-full px-3 text-sm whitespace-nowrap hover:bg-surface min-[1400px]:px-4 min-[1400px]:text-[15px]">{i.label}</Link></li>
          ))}
        </ul>
      </nav>

      {/* Та же пилюля внизу экрана. Над плашкой cookie, пока та открыта. */}
      <nav aria-label="Разделы страницы" inert={!floating}
        className={`fixed bottom-[calc(20px+env(safe-area-inset-bottom))] left-1/2 z-40 max-w-[calc(100vw-24px)] -translate-x-1/2 text-[15px] font-medium transition-[opacity,translate] duration-400 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none [body:has([aria-label=Cookie])_&]:bottom-[calc(92px+env(safe-area-inset-bottom))] ${floating ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}>
        {/* Фон — снаружи, листается только ряд: на телефоне края ряда растворяются, а сама пилюля остаётся целой. */}
        <div className="rounded-full bg-ink p-1 text-paper shadow-[0_18px_40px_-16px_rgba(29,28,26,0.6)]">
          <ul ref={list} className="relative m-0 flex list-none items-center gap-1 overflow-x-auto overscroll-x-contain rounded-full [scrollbar-width:none] max-sm:[mask-image:linear-gradient(to_right,transparent,#000_14px,#000_calc(100%-14px),transparent)]">
            {/* Светлая подложка переезжает к разделу, который сейчас на экране. */}
            <li ref={mark} aria-hidden="true" className="slide-mark rounded-full bg-paper opacity-0" />
            {items.map((i) => (
              <li key={i.id}>
                <Link href={`/#${i.id}`} aria-current={active === i.id ? "location" : undefined}
                  className="press relative inline-flex min-h-11 items-center rounded-full px-4 whitespace-nowrap hover:bg-paper/15 aria-[current=location]:text-ink aria-[current=location]:hover:bg-transparent max-sm:px-3 max-sm:text-sm">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
