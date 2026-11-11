"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { NEW_GAMES, parseVariant, VARIANT_COOKIE, VARIANTS, type Variant } from "@/lib/variant";

// Кнопка «Варианты» слева снизу (решение 2026-11-10): заказчик переключает макет и сравнивает.
// Вариант виден сразу — data-v на <html> (стили); затем refresh: детский альбом меняет раскладку на сервере.

const read = () => parseVariant(document.documentElement.dataset.v);
const noSubscribe = () => () => {};
function apply(v: Variant) {
  document.cookie = `${VARIANT_COOKIE}=${v}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.dataset.v = String(v);
}

export function VariantSwitch() {
  const router = useRouter();
  const current = useSyncExternalStore(noSubscribe, read, () => 1 as Variant);
  const [picked, setPicked] = useState<Variant | null>(null);
  const v = picked ?? current;
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent | PointerEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !panel.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", close); };
  }, [open]);

  function choose(next: Variant) {
    apply(next);
    setPicked(next);
    router.refresh();
  }

  return (
    <div ref={panel} className="variant-switch fixed left-3 z-50 bottom-[calc(12px+env(safe-area-inset-bottom))] md:left-4 md:bottom-[calc(16px+env(safe-area-inset-bottom))]">
      {open && (
        <div id="variants" role="dialog" aria-label="Варианты макета" className="anim-pop mb-2 grid w-[min(320px,calc(100vw-24px))] gap-1 rounded-[20px] bg-ink p-2 text-paper shadow-[0_24px_48px_-20px_rgba(29,28,26,0.6)]">
          <p className="m-0 px-3 pt-2 pb-1 text-[13px] text-paper/70">Варианты макета</p>
          {VARIANTS.map((o) => (
            <button key={o.v} type="button" aria-pressed={v === o.v} onClick={() => choose(o.v)}
              className="grid min-h-14 grid-cols-[32px_minmax(0,1fr)] items-center gap-3 rounded-[14px] px-3 py-2 text-left transition-colors hover:bg-paper/10 aria-pressed:bg-paper aria-pressed:text-ink">
              <span className="font-display text-xl leading-none font-semibold tabular-nums">{o.v}</span>
              <span className="grid gap-0.5">
                <span className="font-semibold leading-tight">{o.title}</span>
                <span className="text-[13px] leading-snug opacity-70">{o.note}</span>
              </span>
            </button>
          ))}
          <p className="m-0 px-3 pt-2 pb-2 text-[13px] leading-snug text-paper/70">
            Детские игры в вариантах 2 и 3: {Object.values(NEW_GAMES).map((g) => g.title).join(", ")}.
          </p>
        </div>
      )}
      <button type="button" aria-expanded={open} aria-controls="variants" onClick={() => setOpen(!open)}
        className="press inline-flex min-h-12 items-center gap-2.5 rounded-full bg-ink py-1.5 pr-5 pl-1.5 font-semibold text-paper shadow-[0_12px_28px_-14px_rgba(29,28,26,0.7)]">
        <span className="grid size-9 place-content-center rounded-full bg-paper font-display text-lg leading-none text-ink tabular-nums">{v}</span>
        Варианты
      </button>
    </div>
  );
}
