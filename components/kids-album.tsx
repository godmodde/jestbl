"use client";
/* eslint-disable @next/next/no-img-element -- наклейки: готовые PNG 256 px с заданным размером, оптимизатор не нужен */

import Link from "next/link";
import { useState } from "react";

import { Icon } from "@/components/ui";
import { plural } from "@/lib/plural";
import type { KidsTopic, KidsWorld, Sticker } from "@/lib/directions";

// Детский альбом (бриф .impeccable/surfaces): тема — разворот, игра вклеивает наклейку, нажатие на наклейку снова показывает жест.

const TILT = ["-rotate-6", "rotate-3", "-rotate-2", "rotate-6", "-rotate-3", "rotate-2"];

/** Звёзды ступенями 3 / 5 / 10 (сверка с заказчиком 2026-11-10): в альбоме и закладках — значок и число. */
export function Stars({ n, size = 20, label = true }: { n: number; size?: number; label?: boolean }) {
  return (
    <span role={label ? "img" : undefined} aria-label={label ? `${n} ${plural(n, ["звезда", "звезды", "звёзд"])}` : undefined} aria-hidden={label ? undefined : true}
      style={{ fontSize: size }} className={`inline-flex items-center gap-1 leading-none font-display font-semibold tabular-nums ${n ? "text-star" : "text-muted"}`}>
      <Icon name={n ? "star-fill" : "star"} size={size} />{n}
    </span>
  );
}

/** Итог экзамена: россыпь из 3, 5 или 10 звёзд, по одной вспыхивают. */
export function StarBurst({ n }: { n: number }) {
  return (
    <span role="img" aria-label={`${n} ${plural(n, ["звезда", "звезды", "звёзд"])}`} className={`${n > 5 ? "grid grid-cols-5 sm:inline-flex" : "inline-flex"} justify-center gap-1 text-star`}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="anim-pop" style={{ animationDelay: `${i * 70}ms` }}><Icon name="star-fill" size={n > 5 ? 44 : 64} /></span>
      ))}
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
    trace: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13 7 4 4" /></>,
    choose: <><rect x="2.5" y="7" width="5.5" height="10" rx="1.5" /><rect x="9.25" y="7" width="5.5" height="10" rx="1.5" /><rect x="16" y="7" width="5.5" height="10" rx="1.5" /></>,
    show: <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6 7-2.6 0-4.2-1.4-5.6-3.7L3.2 13a1.5 1.5 0 0 1 2.5-1.6L8 14" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[kind] ?? paths.find}
    </svg>
  );
}

/** Буква как наклейка: заглавная и строчная; вклеенная — с белой вырубкой по контуру, как картинки альбома. */
export function LetterGlyph({ title, sticker = false, className = "" }: { title: string; sticker?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-block font-display leading-none font-semibold tracking-[-0.03em] ${sticker ? "sticker text-accent" : ""} ${className}`}>
      {title}{title.toLowerCase()}
    </span>
  );
}

/** Два альбома детского мира — переключатель сверху: значок темы и «Аа» понятны без чтения. */
function WorldSwitch({ world }: { world: KidsWorld }) {
  const tab = "inline-flex min-h-14 items-center gap-2.5 rounded-full px-5 font-semibold text-ink-2 transition-colors aria-[current=page]:bg-surface aria-[current=page]:text-ink aria-[current=page]:shadow-[0_8px_20px_-14px_rgba(29,28,26,0.5)]";
  return (
    <nav aria-label="Альбомы" className="flex w-fit gap-1 rounded-full bg-track p-1">
      <Link href="/kids" aria-current={world === "kids" ? "page" : undefined} className={tab}>
        <img src="/pictures/kot.png" alt="" width={28} height={28} className="size-7" /> Темы
      </Link>
      <Link href="/kids/alphabet" aria-current={world === "kids-alphabet" ? "page" : undefined} className={tab}>
        <span aria-hidden="true" className="font-display text-xl leading-none">Аа</span> Буквы
      </Link>
    </nav>
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
        <span className="font-display text-[28px] leading-none font-semibold tracking-[-0.02em]">{sticker.picture ? sticker.title : `${sticker.title}${sticker.title.toLowerCase()}`}</span>
      </figcaption>
    </figure>
  );
}

export function KidsAlbum({ topics, current, fresh, world = "kids", small = false }: {
  topics: KidsTopic[]; current: string; fresh?: string; world?: KidsWorld; small?: boolean;
}) {
  const topic = topics.find((t) => t.slug === current)!;
  const letters = world === "kids-alphabet";
  const earned = topic.stickers.filter((s) => s.earned);
  const [selected, setSelected] = useState(fresh ?? topic.stickers.find((s) => !s.earned)?.slug ?? topic.stickers[0]?.slug);
  const shown = topic.stickers.find((s) => s.slug === selected) ?? topic.stickers[0];

  return (
    <div className="grid gap-6">
    {/* Малышам 3–5 буквы рано — у них только темы. */}
    {!small && <WorldSwitch world={world} />}
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
          {/* База (сверка с заказчиком 2026-11-10, «всё как у взрослых»): любой жест можно открыть и посмотреть.
              Вклеенные — цветные: в темах их дают игры, в буквах — тест. */}
          <ol aria-label={letters ? "Буквы группы" : "Жесты темы"} className="m-0 grid list-none grid-cols-3 gap-[clamp(12px,1.6vw,24px)] p-0">
            {topic.stickers.map((s, i) => (
              <li key={s.slug}>
                <button type="button" onClick={() => setSelected(s.slug)} aria-pressed={selected === s.slug}
                  aria-label={`${letters ? `Буква ${s.title}` : s.title}${s.earned ? ", наклейка" : ""}. Показать жест`}
                  className={`flex aspect-square w-full items-center justify-center rounded-[22px] transition-colors hover:bg-track/50 aria-pressed:bg-stage/70 ${s.earned ? "" : "border-2 border-dashed border-line"}`}>
                  {letters ? (
                    <LetterGlyph title={s.title} sticker={s.earned} className={`text-[clamp(40px,5vw,64px)] ${s.earned ? TILT[i % TILT.length] : "text-ink-2"}`} />
                  ) : s.earned ? (
                    <img src={`/pictures/${s.picture}`} alt="" width={120} height={120} className={`sticker h-auto w-[86%] ${TILT[i % TILT.length]} ${fresh === s.slug ? "sticker-land" : ""}`} />
                  ) : (
                    <img src={`/pictures/${s.picture}`} alt="" width={96} height={96} className="h-auto w-[62%] opacity-35 grayscale" />
                  )}
                </button>
              </li>
            ))}
          </ol>
          <ol aria-label={letters ? "Задания" : "Игры"} className="m-0 grid list-none grid-cols-3 gap-3 p-0">
            {topic.stations.map((st) => {
              const body = (
                <>
                  <StationIcon kind={st.kind} size={30} />
                  <span className="text-[15px] leading-tight font-semibold">{st.title}</span>
                  {st.completed && <span className="absolute top-2 right-2 grid size-6 place-content-center rounded-full bg-accent text-white"><Icon name="check" size={14} /></span>}
                </>
              );
              const cls = "relative grid min-h-28 content-center justify-items-center gap-2 rounded-[22px] p-3 text-center";
              return (
                <li key={st.slug}>
                  {st.open ? (
                    <Link href={`/kids/${topic.slug}/${st.slug}`} aria-label={`${st.completed ? "Ещё раз" : "Играть"}: ${st.title}`}
                      className={`press ${cls} bg-accent-soft text-accent hover:bg-stage-deep ${st.completed ? "" : "border-[2.5px] border-dashed border-accent"}`}>
                      {body}
                    </Link>
                  ) : (
                    <span aria-label={`${st.title}: откроется позже`} className={`${cls} border-2 border-dashed border-line text-muted`}>{body}</span>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="m-0 text-ink-2 tabular-nums">{earned.length} из {topic.stickers.length} наклеек</p>
        </div>
      </section>

      <nav aria-label={letters ? "Группы букв" : "Темы альбома"} className="-mx-[var(--gutter)] overflow-x-auto px-[var(--gutter)] lg:m-0 lg:overflow-visible lg:p-0">
        <ul className="m-0 flex list-none gap-4 p-0 lg:grid">
          {topics.map((t, ti) => {
            const done = t.stickers.filter((s) => s.earned).length;
            const body = (
              <>
                {t.stickers[0]?.picture
                  ? <img src={`/pictures/${t.stickers[0].picture}`} alt="" width={52} height={52} className={`size-13 ${t.open ? "sticker" : "opacity-40 grayscale"}`} />
                  : letters && t.stickers[0]
                    ? <span className={`grid size-13 place-content-center rounded-[16px] ${t.open ? "bg-accent-soft text-accent" : "bg-track text-muted"}`}><LetterGlyph title={t.stickers[0].title} className="text-xl" /></span>
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
    </div>
  );
}
