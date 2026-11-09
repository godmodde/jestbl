"use client";
/* eslint-disable @next/next/no-img-element -- наклейки: готовые PNG 256 px с заданным размером, оптимизатор не нужен */

import Link from "next/link";
import { useState } from "react";

import { Icon } from "@/components/ui";
import type { KidsTopic, Sticker } from "@/lib/directions";

// Детский альбом (бриф .impeccable/surfaces): тема — разворот, игра вклеивает наклейку, нажатие на наклейку снова показывает жест.

const TILT = ["-rotate-6", "rotate-3", "-rotate-2", "rotate-6", "-rotate-3", "rotate-2"];

export function Stars({ n, size = 20, label = true }: { n: number; size?: number; label?: boolean }) {
  return (
    <span role={label ? "img" : undefined} aria-label={label ? `${n} из 3 звёзд` : undefined} aria-hidden={label ? undefined : true} className="inline-flex gap-0.5 text-star">
      {[1, 2, 3].map((i) => <Icon key={i} name={i <= n ? "star-fill" : "star"} size={size} />)}
    </span>
  );
}

/** Значки механик: ребёнок узнаёт игру по картинке, а не по подписи. */
export function StationIcon({ kind, size = 28 }: { kind: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    find: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
    pair: <><rect x="3" y="5" width="7" height="14" rx="2" /><rect x="14" y="5" width="7" height="14" rx="2" /><path d="M10 12h4" /></>,
    feed: <><path d="M4 12h16a8 8 0 0 1-16 0z" /><path d="M9 8c0-2 2-2 2-4M14 8c0-2 2-2 2-4" /></>,
    route: <><circle cx="5" cy="18" r="2" /><circle cx="19" cy="6" r="2" /><path d="M7 18h6a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h6" /></>,
    diff: <><path d="M4 9h7M4 15h7" /><path d="M14 8h6M14 16h6M19 5l-4 14" /></>,
    exam: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[kind] ?? paths.find}
    </svg>
  );
}

function Viewer({ sticker }: { sticker: Sticker }) {
  return (
    <figure className="m-0 grid content-start gap-4">
      <div className="relative aspect-[5/6] overflow-hidden rounded-[20px] bg-frame ring-8 ring-white shadow-[0_24px_48px_-30px_rgba(29,28,26,0.5)]">
        {sticker.videoUrl ? (
          // Кадр как на первом экране: человек по центру, вшитая подпись демо-ролика за кадром (обрывок слова выглядел бы поломкой).
          <video key={sticker.slug} src={sticker.videoUrl} autoPlay muted loop playsInline aria-label={`Жест «${sticker.title}»`}
            className="absolute inset-0 h-full w-full signer" />
        ) : (
          <p className="absolute inset-0 m-0 grid place-content-center p-6 text-center text-ink-2">Видео появится после съёмки</p>
        )}
      </div>
      <figcaption className="flex items-center gap-3">
        {sticker.picture && <img src={`/pictures/${sticker.picture}`} alt="" width={44} height={44} className="sticker size-11" />}
        <span className="font-display text-[28px] leading-none font-semibold tracking-[-0.02em]">{sticker.title}</span>
      </figcaption>
    </figure>
  );
}

export function KidsAlbum({ topics, current, fresh }: { topics: KidsTopic[]; current: string; fresh?: string }) {
  const topic = topics.find((t) => t.slug === current)!;
  const nextIndex = topic.stations.findIndex((s) => s.open && !s.completed);
  const earned = topic.stickers.filter((s) => s.earned);
  const [selected, setSelected] = useState(fresh ?? (topic.stickers[nextIndex] ?? earned.at(-1) ?? topic.stickers[0])?.slug);
  const shown = topic.stickers.find((s) => s.slug === selected) ?? topic.stickers[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-10">
      <section aria-labelledby="topic" className="relative grid gap-10 rounded-[28px] bg-surface p-[clamp(20px,3vw,48px)] shadow-[0_30px_60px_-44px_rgba(29,28,26,0.45)] md:grid-cols-2 md:gap-[clamp(40px,5vw,96px)]">
        {/* Корешок разворота. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-8 left-1/2 w-8 -translate-x-1/2 bg-linear-to-r from-transparent via-ink/[0.045] to-transparent max-md:hidden" />
        {shown && <Viewer sticker={shown} />}

        <div className="grid content-start gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 id="topic" className="m-0 font-display text-[clamp(40px,4.5vw,64px)] leading-[0.95] font-semibold tracking-[-0.035em]">{topic.title}</h1>
            <Stars n={topic.stars} size={26} />
          </div>
          <ol aria-label="Наклейки темы" className="m-0 grid list-none grid-cols-3 gap-[clamp(12px,1.6vw,24px)] p-0">
            {topic.stations.map((station, i) => {
              const sticker = topic.stickers[i];
              const isNext = i === nextIndex;
              // flex, а не grid с place-content: в дорожке по содержимому проценты у картинки схлопываются.
              const slot = "relative flex aspect-square items-center justify-center rounded-[22px]";
              return (
                <li key={station.slug}>
                  {sticker?.earned ? (
                    <button type="button" onClick={() => setSelected(sticker.slug)} aria-pressed={selected === sticker.slug}
                      aria-label={`Наклейка «${sticker.title}». Показать жест`}
                      className={`${slot} w-full transition-colors hover:bg-track/50 aria-pressed:bg-stage/70`}>
                      <img src={`/pictures/${sticker.picture}`} alt="" width={120} height={120}
                        className={`sticker w-[86%] h-auto ${TILT[i]} ${fresh === sticker.slug ? "sticker-land" : ""}`} />
                    </button>
                  ) : isNext ? (
                    <Link href={`/kids/${topic.slug}/${station.slug}`} aria-label={`Играть: ${station.title}`}
                      className={`${slot} flex-col gap-2 border-[2.5px] border-dashed border-accent bg-accent-soft text-accent transition-colors hover:bg-stage-deep`}>
                      <StationIcon kind={station.kind} size={34} />
                      <span className="text-[15px] font-semibold">Играть</span>
                    </Link>
                  ) : (
                    <span aria-label={`${station.title}: откроется позже`} className={`${slot} border-2 border-dashed border-line text-muted`}>
                      {sticker?.picture && <img src={`/pictures/${sticker.picture}`} alt="" width={96} height={96} className="w-[62%] h-auto opacity-[0.16] grayscale" />}
                      <span className="absolute"><StationIcon kind={station.kind} size={26} /></span>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="m-0 text-ink-2 tabular-nums">{earned.length} из {topic.stickers.length} наклеек</p>
        </div>
      </section>

      <nav aria-label="Темы альбома" className="-mx-[var(--gutter)] overflow-x-auto px-[var(--gutter)] lg:m-0 lg:overflow-visible lg:p-0">
        <ul className="m-0 flex list-none gap-4 p-0 lg:grid">
          {topics.map((t, ti) => {
            const done = t.stickers.filter((s) => s.earned).length;
            const body = (
              <>
                {t.stickers[0]?.picture
                  ? <img src={`/pictures/${t.stickers[0].picture}`} alt="" width={52} height={52} className={`size-13 ${t.open ? "sticker" : "opacity-40 grayscale"}`} />
                  : <span className="grid size-13 place-content-center rounded-full bg-track text-muted"><Icon name="lock" /></span>}
                <span className="grid gap-1">
                  <span className="font-display text-lg leading-tight font-semibold">{t.title}</span>
                  {t.status === "soon" ? (
                    <span className="text-sm text-muted">Готовится</span>
                  ) : t.open ? (
                    <span className="flex items-center gap-2 text-sm text-ink-2 tabular-nums">{done}/{t.stickers.length} <Stars n={t.stars} size={14} label={false} /></span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm text-muted"><Icon name="lock" size={14} /> после «{topics[ti - 1]?.title}»</span>
                  )}
                </span>
              </>
            );
            const cls = "grid min-h-[76px] min-w-56 grid-cols-[52px_minmax(0,1fr)] items-center gap-3 rounded-[18px] p-3";
            return (
              <li key={t.slug}>
                {t.open ? (
                  <Link href={`/kids/${t.slug}`} aria-current={t.slug === current ? "page" : undefined}
                    className={`${cls} transition-colors hover:bg-track aria-[current=page]:bg-surface aria-[current=page]:shadow-[0_12px_28px_-20px_rgba(29,28,26,0.5)]`}>
                    {body}
                  </Link>
                ) : (
                  <span className={`${cls} text-ink-2`}>{body}</span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
