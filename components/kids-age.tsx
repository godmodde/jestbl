"use client";
/* eslint-disable @next/next/no-img-element -- картинки детского мира: готовые PNG 256 px с заданным размером */

import { useRouter } from "next/navigation";

import { AGE_COOKIE, type KidsAge } from "@/lib/device";

// Возраст в детском мире (сверка с заказчиком 2026-11-10): малышам 3–5 игры проще, детям 6–12 — как есть. Помнится на этом устройстве.

function remember(age: KidsAge | null) {
  document.cookie = `${AGE_COOKIE}=${age ?? ""}; path=/; max-age=${age ? 60 * 60 * 24 * 365 : 0}; samesite=lax`;
}

const AGES: { age: KidsAge; title: string; years: string; picture: string }[] = [
  { age: "small", title: "Малыши", years: "3–5 лет", picture: "medved.png" },
  { age: "big", title: "Дети", years: "6–12 лет", picture: "velosiped.png" },
];

/** Первый вход: две большие карточки — выбирает взрослый или ребёнок по картинке. */
export function AgePicker() {
  const router = useRouter();
  return (
    <section aria-labelledby="age" className="grid justify-items-center gap-10 py-10 text-center">
      <h1 id="age" className="m-0 font-display text-[clamp(32px,4vw,48px)] font-semibold tracking-[-0.03em]">Сколько лет?</h1>
      <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        {AGES.map((a) => (
          <button key={a.age} type="button" onClick={() => { remember(a.age); router.refresh(); }}
            className="press group grid justify-items-center gap-4 rounded-[28px] bg-surface p-8 shadow-[0_30px_60px_-44px_rgba(29,28,26,0.45)] transition-colors hover:bg-stage">
            <img src={`/pictures/${a.picture}`} alt="" width={140} height={140}
              className="sticker size-28 transition-[rotate,scale] duration-500 ease-[cubic-bezier(.16,1,.3,1)] motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-6" />
            <span className="font-display text-[32px] leading-none font-semibold tracking-[-0.02em]">{a.title}</span>
            <span className="text-xl text-ink-2 tabular-nums">{a.years}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** В шапке: выбранный возраст; нажатие — снова выбор. */
export function AgeChip({ age }: { age: KidsAge }) {
  const router = useRouter();
  return (
    <button type="button" onClick={() => { remember(null); router.refresh(); }}
      className="press inline-flex min-h-14 items-center gap-2 rounded-full bg-track px-4 font-semibold text-ink-2 transition-colors hover:text-ink">
      {AGES.find((a) => a.age === age)!.years}
      <span className="text-sm font-medium text-muted max-sm:sr-only">сменить</span>
    </button>
  );
}
