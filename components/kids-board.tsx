"use client";
/* eslint-disable @next/next/no-img-element -- наклейки: готовые PNG 256 px с заданным размером, оптимизатор не нужен */

import Link from "next/link";
import { useState } from "react";

import { LetterGlyph, Stars, StationIcon, WorldSwitch } from "@/components/kids-album";
import { PlushText } from "@/components/plush";
import { Icon } from "@/components/ui";
import type { KidsTopic, KidsWorld } from "@/lib/directions";
import { gameFor, type Variant } from "@/lib/variant";

// Детский альбом в вариантах макета 2 и 3 — по наброску Леры (2026-11-10): блок с дугой «← Тема →»,
// слева две карточки (жест и что он значит), в центре слово и игры, справа список жестов темы.

const PADS = ["var(--plush-a)", "var(--plush-b)", "var(--plush-c)", "var(--plush-d)"];
// Цвет значка на подушке: по умолчанию тушь, на тёмном меху вариант задаёт светлый (--plush-fg-*).
const FG = ["var(--plush-fg-a, var(--color-ink))", "var(--plush-fg-b, var(--color-ink))", "var(--plush-fg-c, var(--color-ink))", "var(--plush-fg-d, var(--color-ink))"];

function Chevron({ back = false }: { back?: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={back ? "m14.5 5-7 7 7 7" : "m9.5 5 7 7-7 7"} />
    </svg>
  );
}

export function KidsBoard({ topics, current, fresh, world = "kids", small = false, v }: {
  topics: KidsTopic[]; current: string; fresh?: string; world?: KidsWorld; small?: boolean; v: Variant;
}) {
  const topic = topics.find((t) => t.slug === current)!;
  const letters = world === "kids-alphabet";
  const open = topics.filter((t) => t.open);
  const at = open.findIndex((t) => t.slug === current);
  const [prev, next] = [open[at - 1], open[at + 1]];
  const earned = topic.stickers.filter((s) => s.earned).length;
  const [selected, setSelected] = useState(fresh ?? topic.stickers.find((s) => !s.earned)?.slug ?? topic.stickers[0]?.slug);
  const shown = topic.stickers.find((s) => s.slug === selected) ?? topic.stickers[0];
  const name = shown ? (letters ? `${shown.title}${shown.title.toLowerCase()}` : shown.title) : "";

  const arrow = "plush-pad grid size-14 place-content-center rounded-full text-ink transition-transform hover:scale-105 md:size-16";
  return (
    <div className="grid gap-6">
      {!small && <WorldSwitch world={world} />}
      <section aria-labelledby="topic" className="grid rounded-[36px] bg-surface shadow-[0_30px_60px_-44px_rgba(29,28,26,0.45)]">
        {/* Дуга со стрелками: тема листается, как страница книжки. */}
        <header className="grid grid-cols-[56px_minmax(0,1fr)_56px] items-center gap-3 rounded-t-[36px] rounded-b-[50%_40px] bg-accent-soft px-[clamp(14px,3vw,40px)] pt-6 pb-10 md:grid-cols-[64px_minmax(0,1fr)_64px] md:pb-12">
          {prev ? <Link href={`/kids/${prev.slug}`} aria-label={`Назад: ${prev.title}`} className={arrow} style={{ "--pad": "var(--plush-base)" } as React.CSSProperties}><Chevron back /></Link> : <span />}
          <div className="grid justify-items-center gap-2 text-center">
            <h1 id="topic" className="m-0 font-display text-[clamp(40px,6vw,80px)] leading-none font-semibold tracking-[-0.02em]"><PlushText text={topic.title} /></h1>
          </div>
          {next ? <Link href={`/kids/${next.slug}`} aria-label={`Дальше: ${next.title}`} className={arrow} style={{ "--pad": "var(--plush-base)" } as React.CSSProperties}><Chevron /></Link> : <span />}
        </header>

        <div className="grid gap-8 p-[clamp(18px,3vw,44px)] lg:grid-cols-[minmax(0,4fr)_minmax(0,4fr)_minmax(250px,3fr)] lg:gap-[clamp(28px,3vw,48px)]">
          {/* Слева две карточки: жест и что он значит. */}
          {shown && (
            <div className="grid content-start gap-8">
              <div className="fluffy mx-auto w-full max-w-[380px]" style={{ "--fluff": "var(--plush-a)" } as React.CSSProperties}>
                <div className="relative aspect-[5/6] overflow-hidden rounded-[22px] bg-frame">
                  {shown.videoUrl ? (
                    <video key={shown.slug} src={shown.videoUrl} autoPlay muted loop playsInline aria-label={`Жест «${shown.title}»`} className="absolute inset-0 h-full w-full signer" />
                  ) : (
                    <p className="absolute inset-0 m-0 grid place-content-center p-6 text-center text-ink-2">Видео появится после съёмки</p>
                  )}
                </div>
              </div>
              <div aria-hidden="true" className="plush-pad mx-auto grid aspect-[3/2] w-full max-w-[380px] place-items-center rounded-[32px] max-lg:hidden" style={{ "--pad": "var(--plush-d)" } as React.CSSProperties}>
                {shown.picture
                  ? <img key={shown.slug} src={`/pictures/${shown.picture}`} alt="" width={160} height={160} className="sticker anim-pop size-40" />
                  : <LetterGlyph title={shown.title} className="text-[88px] text-ink" />}
              </div>
            </div>
          )}

          {/* В центре — слово и игры. */}
          <div className="grid content-start gap-10 lg:content-between">
            <div className="grid gap-4">
            <p className="m-0 flex items-center gap-4 font-display text-[clamp(44px,5vw,72px)] leading-none font-semibold">
              {shown?.picture && <img src={`/pictures/${shown.picture}`} alt="" width={72} height={72} className="sticker size-16 lg:hidden" />}
              <PlushText text={name} />
            </p>
            <span className="flex items-center gap-3 text-ink-2 tabular-nums"><Stars n={topic.stars} size={22} /> <span>{earned} из {topic.stickers.length} наклеек</span></span>
            </div>
            <ol aria-label={letters ? "Задания" : "Игры"} className="m-0 grid list-none grid-cols-3 gap-x-3 gap-y-7 p-0">
              {topic.stations.map((st, i) => {
                const g = gameFor(st.kind, st.title, v);
                const pad = (
                  <span className="plush-pad relative grid size-[84px] place-content-center rounded-full text-ink md:size-24" style={{ "--pad": PADS[i % PADS.length], color: FG[i % FG.length] } as React.CSSProperties}>
                    <StationIcon kind={g.kind} size={34} />
                    {st.completed && <span className="absolute -top-1 -right-1 grid size-7 place-content-center rounded-full bg-accent text-white ring-3 ring-surface"><Icon name="check" size={15} /></span>}
                  </span>
                );
                const label = <span className="text-[15px] leading-tight font-semibold">{g.title}</span>;
                const cls = "grid justify-items-center gap-2.5 text-center";
                return (
                  <li key={st.slug}>
                    {st.open ? (
                      <Link href={`/kids/${topic.slug}/${st.slug}`} aria-label={`${st.completed ? "Ещё раз" : "Играть"}: ${g.title}`} className={`press ${cls} rounded-[24px] py-1`}>{pad}{label}</Link>
                    ) : (
                      <span aria-label={`${g.title}: откроется позже`} className={`${cls} opacity-45 grayscale`}>{pad}{label}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Справа — все жесты темы: нажал — жест в кадре. */}
          <ol aria-label={letters ? "Буквы группы" : "Жесты темы"} className="m-0 grid list-none content-start gap-1.5 rounded-[28px] bg-paper p-2.5 sm:max-lg:grid-cols-2">
            {topic.stickers.map((s) => (
              <li key={s.slug}>
                <button type="button" onClick={() => setSelected(s.slug)} aria-pressed={selected === s.slug}
                  aria-label={`${letters ? `Буква ${s.title}` : s.title}${s.earned ? ", наклейка" : ""}. Показать жест`}
                  className="grid min-h-16 w-full grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] px-2.5 text-left transition-colors hover:bg-track/60 aria-pressed:bg-surface aria-pressed:shadow-[0_10px_24px_-18px_rgba(29,28,26,0.6)]">
                  {s.picture
                    ? <img src={`/pictures/${s.picture}`} alt="" width={48} height={48} className={`size-12 ${s.earned ? "sticker" : "opacity-40 grayscale"}`} />
                    : <LetterGlyph title={s.title} sticker={s.earned} className="text-2xl" />}
                  <span className="truncate text-[17px] font-semibold">{s.title}</span>
                  {s.earned && <span className="grid size-6 place-content-center rounded-full bg-accent text-white"><Icon name="check" size={14} /></span>}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
