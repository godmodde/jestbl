"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

const KEY = "vidno-cookie-ok";
const noSubscribe = () => () => {};
const notSeen = () => { try { return !localStorage.getItem(KEY); } catch { return true; } };

// Плашка только информирует (решение интервью): счётчик грузится сразу, кнопка лишь скрывает сообщение.
export function CookieNotice() {
  const fresh = useSyncExternalStore(noSubscribe, notSeen, () => false);
  const [closed, setClosed] = useState(false);
  if (!fresh || closed) return null;
  const close = () => {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setClosed(true);
  };
  return (
    <div role="region" aria-label="Cookie" className="anim-pop fixed inset-x-3 z-40 mx-auto flex max-w-xl items-center gap-4 rounded-md bg-ink py-1.5 pr-1.5 pl-4 text-[13px] text-paper shadow-lg bottom-[calc(8px+env(safe-area-inset-bottom))] md:inset-x-4 md:gap-5 md:py-4 md:pr-5 md:pl-5 md:text-sm md:bottom-[calc(16px+env(safe-area-inset-bottom))] [body:has(.tabbar)_&]:bottom-[calc(76px+env(safe-area-inset-bottom))] md:[body:has(.tabbar)_&]:bottom-[calc(16px+env(safe-area-inset-bottom))]">
      {/* На телефоне — одна строка ≤ 56 px: плашка только информирует и не должна закрывать главную кнопку. */}
      <p className="m-0 min-w-0 flex-1">
        <span className="md:hidden">Сайт использует cookie.</span>
        <span className="max-md:hidden">Сайт использует cookie и Яндекс Метрику.</span>{" "}
        <Link href="/cookies" className="underline underline-offset-2">Подробнее</Link>
      </p>
      <button type="button" onClick={close} className="min-h-11 flex-none rounded-full bg-paper px-4 font-semibold text-ink transition-colors hover:bg-accent-soft md:px-5">
        Понятно
      </button>
    </div>
  );
}
