"use client";
/* eslint-disable @next/next/no-img-element -- наклейки: готовые PNG 256 px с заданным размером, оптимизатор не нужен */

import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";

import { SignBrief } from "@/components/sign-card";
import { TraceCanvas } from "@/components/trace-canvas";
import { Arrow, Icon } from "@/components/ui";
import { VideoPlayer } from "@/components/video-player";
import { send } from "@/lib/client-api";
import type { Sign } from "@/lib/data";
import { playNearby } from "@/lib/play-nearby";
import { useSlideMark } from "@/lib/use-slide-mark";

// Живые секции главной: каждая — работающий кусок платформы, а не картинка о ней (бриф главной, THESIS).

type Pic = { slug: string; title: string; picture: string | null; videoUrl: string | null };

// Неверный ответ — мягкое покачивание. Через Web Animations, чтобы и повторный выбор той же плитки получал отклик.
function nudge(el: Element | null) {
  if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.animate([{ translate: "0" }, { translate: "-6px", offset: .3 }, { translate: "4px", offset: .65 }, { translate: "0" }], { duration: 450, easing: "cubic-bezier(.2, .7, .2, 1)" });
}

function DirectionFoot({ href, title, line }: { href: string; title: string; line: string }) {
  return (
    <Link href={href} className="group grid gap-1.5">
      <span className="flex items-center justify-between gap-4 font-display text-[clamp(28px,2.6vw,36px)] leading-none font-semibold tracking-[-0.03em]">
        {title} <span className="ink-dot grid size-12 flex-none place-content-center rounded-full border-[1.5px] border-ink"><Arrow /></span>
      </span>
      <span className="text-ink-2">{line}</span>
    </Link>
  );
}

/** Мини-игра «Найди картинку»: та же механика, что в детском мире, в одной колонке. */
function KidsTaste({ sign, options }: { sign: Pic; options: Pic[] }) {
  const [picked, setPicked] = useState<string | null>(null);
  const right = picked === sign.slug;
  // Ширина — как у видео в соседних карточках: демо трёх направлений одной высоты, подписи внизу без дыр.
  return (
    <div className="mx-auto grid w-full max-w-[340px] gap-4">
      <div className="relative aspect-[5/6] w-full overflow-hidden rounded-[20px] bg-frame">
        {sign.videoUrl ? (
          // Портретный кадр, как в hero: подпись демо-ролика за краем, без размытых пятен.
          <video ref={playNearby} src={sign.videoUrl} preload="none" muted loop playsInline aria-label="Жест для мини-игры" className="absolute inset-0 h-full w-full signer" />
        ) : <p className="absolute inset-0 m-0 grid place-content-center p-4 text-center text-sm text-ink-2">Видео появится после съёмки</p>}
      </div>
      <div role="group" aria-label="Что показали?" className="grid grid-cols-3 gap-2.5">
        {options.map((o) => (
          <button key={o.slug} type="button" aria-label={o.title} aria-pressed={picked === o.slug} disabled={right}
            onClick={(e) => { setPicked(o.slug); if (o.slug !== sign.slug) nudge(e.currentTarget); }}
            className={`press group relative grid aspect-[6/5] place-content-center rounded-[18px] border-[2.5px] bg-surface
              ${picked === o.slug ? (right ? "border-accent bg-accent-soft" : "border-line opacity-60") : "border-transparent hover:border-line"}`}>
            {/* Наклейка при наведении отходит от листа и чуть поворачивается, при верном ответе — коротко подпрыгивает. */}
            <img src={`/pictures/${o.picture}`} alt="" width={72} height={72}
              className={`sticker size-16 transition-[rotate,scale,translate] duration-500 ease-[cubic-bezier(.16,1,.3,1)] motion-safe:group-enabled:group-hover:-translate-y-1 motion-safe:group-enabled:group-hover:scale-110 motion-safe:group-enabled:group-hover:-rotate-6 ${picked === o.slug && right ? "anim-bump" : ""}`} />
            {picked === o.slug && right && <span className="absolute top-2 right-2 grid size-7 place-content-center rounded-full bg-accent text-white anim-pop"><Icon name="check" size={16} /></span>}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="m-0 min-h-6 text-ink-2">{right ? `Да, это «${sign.title}»!` : picked ? "Посмотри ещё раз на руки" : "Что показали? Нажми на картинку"}</p>
    </div>
  );
}

const DIRECTION_TITLES = ["Алфавит", "Взрослым", "Детям"];

export function Directions({ letter, adult, kids }: { letter: string; adult: Sign; kids: { sign: Pic; options: Pic[] } }) {
  const [traced, setTraced] = useState(false);
  // Телефон и планшет (выбор заказчика 2026-10-10): карточки листаются вбок, следующая выглядывает с края, под рядом — точки.
  // Блок — около экрана вместо трёх. На поле обводки свайп рисует букву, а не листает: это поле для рисования.
  const track = useRef<HTMLUListElement>(null);
  const [at, setAt] = useState(0);
  const onScroll = () => {
    const ul = track.current, first = ul?.firstElementChild as HTMLElement | null;
    if (!ul || !first) return;
    // У конца ряда последняя карточка не доходит до левого края — округление дало бы предпоследнюю.
    const end = ul.scrollLeft >= ul.scrollWidth - ul.clientWidth - 2;
    setAt(end ? ul.children.length - 1 : Math.round(ul.scrollLeft / (first.offsetWidth + parseFloat(getComputedStyle(ul).columnGap))));
  };
  const go = (i: number) => (track.current?.children[i] as HTMLElement | undefined)?.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", inline: "start", block: "nearest",
  });
  // Правило внутреннего и внешнего: части карточки 16/24 ≤ поля 20/24 < промежутка между карточками 24/40 (остаток высоты над и под демо — до 34).
  // Демо — по центру свободной высоты: подписи внизу на одной линии, а лишнее место не копится над одной из них.
  const panel = "grid w-[82%] flex-none snap-start grid-rows-[1fr_auto] gap-4 rounded-[28px] p-5 sm:w-[min(60%,420px)] lg:w-auto lg:gap-6 lg:p-6 [&>:first-child]:self-center";
  return (
    <div className="grid gap-3 lg:block">
    <ul ref={track} onScroll={onScroll}
      className="m-0 mx-[calc(var(--gutter)*-1)] flex list-none snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain px-(--gutter) py-0 scroll-px-(--gutter) [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-10 lg:overflow-visible lg:px-0">
      <li className={`${panel} bg-surface`}>
        <div className="grid gap-3">
          <div className="mx-auto w-full max-w-[340px]">
            <TraceCanvas letter={letter} compact onDone={() => setTraced(true)} />
          </div>
          {traced && <p className="anim-focus-in m-0 text-center font-semibold text-accent">Так же — все 33 буквы</p>}
        </div>
        {/* Два раздела (решение заказчика 2026-11-10): детский — в детском мире, взрослый — на платформе. */}
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <span className="font-display text-[clamp(28px,2.6vw,36px)] leading-none font-semibold tracking-[-0.03em]">Алфавит</span>
            <span className="text-ink-2">Детям — обводка и камера, взрослым — ролики и тест</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[["/kids/alphabet", "Детям"], ["/alphabet", "Взрослым"]].map(([href, label]) => (
              <Link key={href} href={href} className="group press inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-ink px-4 font-semibold hover:bg-ink hover:text-paper">
                {label} <Arrow />
              </Link>
            ))}
          </div>
        </div>
      </li>
      <li className={`${panel} bg-linear-to-b from-stage to-stage-deep`}>
        {/* Как на первом экране: кадр под человека, вшитая подпись демо-ролика за кадром, управление под видео. */}
        <VideoPlayer src={adult.videoUrl} label={`Жест «${adult.title}»`} autoPlay panel showProgress={false} slowToggle clip={[0.3, 3]}
          frameClass="aspect-[5/6]" videoClass="signer" className="mx-auto w-full max-w-[340px] max-lg:px-2.5 max-lg:pt-2.5"
          caption={<span className="type-gloss block text-[28px] leading-none font-medium">{adult.title}</span>}
          note={<p className="m-0 text-[15px] text-ink-2">{adult.meaning}</p>} />
        <DirectionFoot href="/adults" title="Взрослым" line="Жесты, фразы и экзамены по темам" />
      </li>
      <li className={`${panel} bg-warn-soft`}>
        <KidsTaste sign={kids.sign} options={kids.options} />
        <DirectionFoot href="/kids" title="Детям" line="Игры и альбом наклеек, 3–5 и 6–12 лет" />
      </li>
    </ul>
    {/* Точки — куда пролистано; нажатие ведёт к карточке. Цель нажатия 44 px, точка внутри маленькая. */}
    <div role="group" aria-label="Карточки направлений" className="flex justify-center lg:hidden">
      {DIRECTION_TITLES.map((t, i) => (
        <button key={t} type="button" onClick={() => go(i)} aria-label={`Показать карточку «${t}»`} aria-current={at === i ? "true" : undefined}
          className="group grid size-11 place-content-center">
          <span className={`block h-2 rounded-full transition-[width,background-color] duration-300 ${at === i ? "w-6 bg-ink" : "w-2 bg-ink/25 group-hover:bg-ink/50"}`} />
        </button>
      ))}
    </div>
    </div>
  );
}

/** «Платформа в действии» (ТЗ, п. 4): цикл настоящего урока в одной панели высотой с экран — задание → карточка → прогресс.
 *  Упражнение другое, чем в «Как учимся» (там — «что означает жест»): здесь «найдите жест по слову» среди трёх роликов.
 *  Карточка открывается после ответа — сначала попытка, потом разбор (ТЗ, п. 3). Цифры — только по этому устройству. */
const LIVE_STEPS = ["Задание", "Карточка", "Прогресс"] as const;
type LiveSign = Sign;

export function PlatformLive({ sign, choices, lesson, learned: initial }: {
  sign: LiveSign;
  /** Три ролика на выбор, среди них ответ; порядок задан сервером. */
  choices: LiveSign[];
  lesson: { slug: string; title: string }[];
  learned: string[];
}) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [learned, setLearned] = useState(initial);
  const right = picked === sign.slug;
  const count = lesson.filter((l) => learned.includes(l.slug)).length;
  // Сколько изученных человек уже видел на шаге «Прогресс»: новая цифра наводится в резкость один раз, при первом показе.
  const [seen, setSeen] = useState(count);
  const fresh = count !== seen;
  const tabs = useRef<HTMLDivElement>(null);
  const mark = useSlideMark<HTMLSpanElement>(tabs, "[aria-selected=true]", step);
  const go = (i: number) => {
    const n = Math.max(0, Math.min(LIVE_STEPS.length - 1, i));
    if (step === 2 && n !== 2) setSeen(count); // повторное нажатие «Прогресс» не обрывает проявление
    setStep(n);
  };

  function pick(slug: string, el: Element) {
    if (right) return;
    setPicked(slug);
    if (slug !== sign.slug) nudge(el.closest("[data-tile]"));
    if (slug !== sign.slug || learned.includes(sign.slug)) return;
    setLearned((l) => [...l, sign.slug]);
    void send(`/signs/${sign.slug}/review`, "POST", { grade: "good" });
  }
  // Стрелки на клавиатуре — как у вкладок: влево и вправо по шагам.
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") go(step + 1);
    if (e.key === "ArrowLeft") go(step - 1);
  }
  const nav = "press grid size-12 place-content-center rounded-full border-[1.5px] border-line hover:border-ink disabled:opacity-40 disabled:hover:border-line";

  return (
    <div className="grid grid-rows-[auto_minmax(0,1fr)_auto] gap-5 rounded-[28px] bg-surface p-5 [--ph:min(640px,calc(100svh-250px))] lg:h-(--ph) lg:gap-6 lg:p-7">
      {/* Правило внутреннего и внешнего, телефон / десктоп: плитка 8 < варианты 12/16 < шаг 16/20 < части панели 20/24 ≤ поле 20/28 < заголовок → панель 40/48. */}
      {/* На телефоне колонки по длине подписей: «Прогресс 0/5» шире «Задания» и в равную треть не помещается. */}
      <div ref={tabs} role="tablist" aria-label="Шаги" onKeyDown={onKey} className="relative mx-auto grid w-full max-w-xl grid-cols-[minmax(0,.85fr)_minmax(0,1fr)_minmax(0,1.2fr)] rounded-full bg-track p-1 sm:grid-cols-3">
        {/* Подсветка шага переезжает под кнопками — видно, куда ведёт «дальше». */}
        <span ref={mark} aria-hidden="true" className="slide-mark rounded-full bg-surface opacity-0 shadow-[0_6px_16px_-10px_rgba(29,28,26,0.45)]" />
        {LIVE_STEPS.map((t, i) => (
          <button key={t} type="button" role="tab" aria-selected={step === i} tabIndex={step === i ? 0 : -1} onClick={() => go(i)}
            className="relative z-10 inline-flex min-h-11 items-center justify-center rounded-full px-1 text-[13px] font-semibold text-ink-2 transition-colors aria-selected:text-ink min-[380px]:text-sm sm:text-[15px]">
            {/* Замок открывается и уходит, как только задание решено: карточка доступна. */}
            {i === 1 && (
              <span aria-hidden="true" className={`grid overflow-hidden transition-[width,margin,opacity,scale] duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${right ? "mr-0 w-0 scale-50 opacity-0" : "mr-1.5 w-3.5"}`}>
                <Icon name="lock" size={14} />
              </span>
            )}
            {t}
            {/* Счётчик подпрыгивает, когда ответ в задании добавил жест. */}
            {i === 2 && <span key={count} className={`ml-1.5 rounded-full bg-accent-soft px-1.5 text-xs text-accent tabular-nums ${count > initial.length ? "anim-bump" : ""}`}>{count}/{lesson.length}</span>}
          </button>
        ))}
      </div>

      {/* Шаги смонтированы все и только прячутся: ролики в плитках не перезагружаются при возврате на «Задание». */}
      <div className="min-h-0 overflow-y-auto">
        <div role="tabpanel" aria-label={LIVE_STEPS[0]} hidden={step !== 0} className="anim-focus-in h-full gap-4 [--fy:0px] lg:gap-5 [align-content:safe_center] [&:not([hidden])]:grid">
            <>
              <h3 className="m-0 text-center font-display text-[clamp(24px,2.2vw,32px)] leading-tight font-semibold tracking-[-0.02em]">
                Найдите жест <span className="type-gloss">«{sign.title}»</span>
              </h3>
              <div role="group" aria-label="Варианты ответа" className="mx-auto flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible lg:gap-4 lg:w-[calc((var(--ph)-400px)*5/6*3+40px)]">
                {choices.map((c, i) => {
                  const state = picked === c.slug ? (right ? "right" : "wrong") : "idle";
                  return (
                    <div key={c.slug} data-tile className={`group/tile grid w-[62%] shrink-0 snap-center gap-2 rounded-[18px] border-[2px] p-2 transition-[background-color,border-color,opacity] duration-300 sm:w-auto ${state === "right" ? "border-accent bg-accent-soft" : state === "wrong" ? "border-line bg-warn-soft opacity-70" : "border-transparent"}`}>
                      <div className="relative aspect-[5/6] overflow-hidden rounded-[12px] bg-frame">
                        {/* Наведение на кнопку чуть приближает её ролик: видно, какой вариант выбираете. */}
                        {c.videoUrl && <video ref={playNearby} src={c.videoUrl} preload="none" muted loop playsInline aria-label={`Вариант ${i + 1}`}
                          className="absolute inset-0 h-full w-full signer signer-tight transition-[scale] duration-700 ease-[cubic-bezier(.16,1,.3,1)] motion-safe:group-has-[button:enabled:hover]/tile:scale-[1.05]" />}
                        {state === "right" && <span className="anim-bump absolute top-2.5 right-2.5 grid size-8 place-content-center rounded-full bg-accent text-white shadow-[0_6px_14px_-6px_rgba(24,76,61,0.6)]"><Icon name="check" size={18} /></span>}
                      </div>
                      <button type="button" onClick={(e) => pick(c.slug, e.currentTarget)} disabled={right} aria-pressed={picked === c.slug}
                        className="press inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-3 text-sm font-semibold text-paper hover:bg-accent disabled:bg-line disabled:text-muted sm:text-[15px]">
                        {state === "right" ? <><Icon name="check" size={16} /> Верно</> : `Вариант ${i + 1}`}
                      </button>
                    </div>
                  );
                })}
              </div>
              <p aria-live="polite" className="m-0 min-h-6 text-center text-ink-2">
                {right ? "Жест в изученных — откройте карточку." : picked ? "Пока не совсем. Посмотрите ещё раз на руки." : ""}
              </p>
            </>
        </div>
        <div role="tabpanel" aria-label={LIVE_STEPS[1]} hidden={step !== 1} className="anim-focus-in h-full gap-4 [--fy:0px] lg:gap-5 [align-content:safe_center] [&:not([hidden])]:grid">
          {right ? (
            <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-5">
              <VideoPlayer src={sign.videoUrl} label={`Жест «${sign.title}»`} autoPlay showProgress={false} slowToggle frameClass="aspect-[5/6]" videoClass="signer"
                className="w-full max-lg:mx-auto max-lg:max-w-[360px] lg:w-[calc((var(--ph)-300px)*5/6)]" />
              <SignBrief sign={sign} />
            </div>
          ) : (
            <div className="grid justify-items-center gap-4 text-center">
              <span className="grid size-14 place-content-center rounded-full bg-track text-ink-2"><Icon name="lock" size={22} /></span>
              <p className="m-0 max-w-[30ch] text-[17px] text-ink-2">Карточка откроется после ответа.</p>
              <button type="button" onClick={() => go(0)} className="press inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-ink px-5 font-semibold hover:bg-ink hover:text-paper">К заданию</button>
            </div>
          )}
        </div>
        <div role="tabpanel" aria-label={LIVE_STEPS[2]} hidden={step !== 2} className="anim-focus-in h-full gap-4 [--fy:0px] lg:gap-5 [align-content:safe_center] [&:not([hidden])]:grid">
            <div className="grid justify-items-center gap-4 text-center lg:gap-5">
              <span className="text-ink-2">Изучено в первом уроке</span>
              <span className="font-display text-[clamp(72px,7vw,112px)] leading-[0.85] font-semibold tracking-[-0.045em] tabular-nums">
                <span key={count} className={`inline-block ${fresh ? "anim-focus-in [--d:.15s]" : ""}`}>{count}</span><span className="text-muted"> / {lesson.length}</span>
              </span>
              <ul className="m-0 flex list-none flex-wrap justify-center gap-2 p-0">
                {lesson.map((l) => {
                  const done = learned.includes(l.slug);
                  return (
                    <li key={l.slug} className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-[15px] ${done ? "bg-accent text-white" : "bg-track text-ink-2"} ${done && fresh && l.slug === sign.slug ? "anim-fill" : ""}`}>
                      {done && <Icon name="check" size={16} />}{l.title}
                    </li>
                  );
                })}
              </ul>
              <p className="m-0 text-ink-2">{learned.includes(sign.slug) ? `«${sign.title}» вернётся в повторение завтра.` : "Цифра изменится после ответа."}</p>
            </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
        <button type="button" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Предыдущий шаг" className={`${nav} [&_svg]:rotate-180`}><Arrow /></button>
        {step < LIVE_STEPS.length - 1 ? (
          <button type="button" onClick={() => go(step + 1)}
            className={`group press inline-flex min-h-12 items-center gap-2 rounded-full px-6 font-semibold whitespace-nowrap max-[380px]:px-4 max-[380px]:text-[15px] ${step === 0 && right ? "bg-accent text-white hover:bg-accent-strong" : "border-[1.5px] border-ink hover:bg-ink hover:text-paper"}`}>
            Дальше: {LIVE_STEPS[step + 1].toLowerCase()} <Arrow />
          </button>
        ) : (
          <Link href="/learn/zdorovaemsya" className="group press inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-white hover:bg-accent-strong">
            Весь первый урок <Arrow />
          </Link>
        )}
      </div>
    </div>
  );
}

/** Первый экран (референсы заказчика, 2026-10-10; выбран вариант B — коллаж): слева смысл и кнопка, справа коллаж —
 *  крупное видео жеста и две карточки других жестов лесенкой. Карточки рабочие: нажатие переносит жест в главное окно,
 *  где есть пауза, замедление и повтор. */
export function HeroCollage({ signs }: { signs: Sign[] }) {
  const [order, setOrder] = useState([0, 1, 2]);
  const collage = useRef<HTMLDivElement>(null);
  const main = signs[order[0]];
  const reorder = (i: number) => setOrder((o) => { const n = o.slice(); [n[0], n[i]] = [n[i], n[0]]; return n; });
  // Карточка перетекает в главное окно, а главный жест — на её место (общие имена кадров и подписей, View Transitions).
  // Без поддержки или при «уменьшении движения» — просто меняются местами.
  const swap = (i: number) => {
    if (!("startViewTransition" in document) || matchMedia("(prefers-reduced-motion: reduce)").matches) return reorder(i);
    document.startViewTransition(async () => {
      flushSync(() => reorder(i));
      // Переставленные кадры — новые <video>: ждём первый кадр (не дольше 250 мс), чтобы перетекание пришло не в пустую рамку.
      const loading = [...(collage.current?.querySelectorAll("video") ?? [])].filter((v) => v.readyState < 2);
      await Promise.race([
        Promise.all(loading.map((v) => new Promise((ok) => { v.addEventListener("loadeddata", ok, { once: true }); v.addEventListener("error", ok, { once: true }); }))),
        new Promise((ok) => setTimeout(ok, 250)),
      ]);
    });
  };
  const vt = (slug: string, part: "f" | "t") => ({ "--vt": `vt-${part}-${slug}` }) as CSSProperties;
  return (
    <section aria-labelledby="hero-title"
      className="shell grid gap-y-5 bg-paper pt-3 pb-14 sm:pt-4 lg:min-h-[calc(100svh-88px)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-12 lg:pt-2 lg:pb-8">
      <div className="grid gap-5 lg:gap-8">
        <div className="grid gap-2.5 sm:gap-3 lg:gap-5">
          <p className="anim-focus-in m-0 -mb-1 text-xs font-semibold tracking-[0.14em] lg:-mb-2.5 text-muted uppercase sm:text-[13px]">Русский жестовый язык</p>
          <h1 id="hero-title" className="m-0 font-display text-[34px] leading-[1.02] min-[400px]:text-[40px] font-semibold tracking-[-0.035em] sm:text-[clamp(44px,6.3vw,128px)] sm:leading-[0.94] lg:tracking-[-0.04em]">
            {/* Строки наводятся в резкость по очереди — мотив «Видно». */}
            <span className="lg:block"><span className="line-in [--d:.05s]">Начните</span></span>{" "}
            <span className="lg:block"><span className="line-in [--d:.15s]">с&nbsp;первого</span></span>{" "}
            <span className="type-gloss font-semibold text-muted lg:block"><span className="line-in [--d:.27s]">жеста</span></span>
          </h1>
          <p className="anim-focus-in [--d:.38s] m-0 max-w-[36ch] text-base leading-snug text-muted sm:text-lg sm:leading-normal 2xl:max-w-[40ch] 2xl:text-xl">
            Смотрите, разбирайтесь и&nbsp;сразу пробуйте сами. Короткие уроки без перегруза и&nbsp;лишней теории.
          </p>
        </div>
        <div className="anim-focus-in [--d:.46s] grid justify-items-start gap-3 max-md:justify-items-stretch max-md:text-center">
          <Link href="/learn/zdorovaemsya" className="group press inline-flex min-h-13 items-center justify-center gap-2.5 rounded-full bg-accent px-7 sm:min-h-14 text-[17px] font-semibold text-white hover:bg-accent-strong hover:shadow-[0_18px_34px_-18px_rgba(24,76,61,0.7)]">
            Начать первый урок <Arrow />
          </Link>
          <span className="text-[15px] text-muted">Можно с нуля · в своём темпе</span>
        </div>
      </div>

      {/* Телефон и планшет (выбор заказчика 2026-10-10): коллаж сверху, компактный — главное видео 2/3 ширины, рядом две карточки
          столбиком, высоты колонок совпадают; кнопка урока остаётся в первом экране. В разметке текст первым: заголовок — первым
          для чтения с экрана и в порядке Tab.
          Десктоп — заполнение по ширине (референс заказчика, 2026-10-10): текст от левого поля ~треть ширины, коллаж до правого поля ~половина.
          Коллаж крупный, чтобы между ним и текстом не было пустоты.
          Высота от окна (300 px — шапка, поля и кнопки плеера), чтобы всё помещалось в первый экран.
          Кадры 5:6 и 4:5 со сдвигом вправо: вшитый титр демо-роликов за кадром. */}
      <div ref={collage} className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-x-9 max-lg:order-first sm:gap-x-10 lg:flex lg:gap-10">
        <div style={vt(main.slug, "f")} className="lg:mt-[6svh] lg:w-[clamp(280px,calc((100svh-300px)*5/6),640px)]">
          <VideoPlayer src={main.videoUrl} label={`Жест «${main.title}»`} autoPlay panel eager={order[0] === 0} posterAt={1.3}
            showProgress={false} slowToggle clip={main.slug === "zdravstvuj" ? [0.3, 3] : undefined}
            frameClass="aspect-[6/7] md:aspect-[5/6] [view-transition-name:var(--vt)]" videoClass="signer"
            caption={<span style={vt(main.slug, "t")} className="type-gloss block w-fit text-lg leading-none sm:text-[28px] font-medium tracking-[-0.015em] [view-transition-name:var(--vt)]">{main.title}</span>} />
        </div>
        <ul aria-label="Другие жесты" className="anim-focus-in [--d:.5s] m-0 grid list-none gap-5.5 p-0 lg:flex lg:w-[clamp(180px,calc((100svh-300px)*0.34),300px)] lg:flex-none lg:flex-col lg:gap-5 lg:pr-2.5">
          {[1, 2].map((i) => {
            const s = signs[order[i]];
            return (
              <li key={s.slug} className="min-w-0">
                <button type="button" onClick={() => swap(i)} aria-label={`Показать жест «${s.title}» крупно`}
                  className="group press grid w-full grid-cols-[minmax(0,1fr)] gap-3.5 text-left active:scale-[.98]">
                  {/* Наведение: карточка приподнимается, тень глубже, жест в кадре чуть ближе. */}
                  <span style={vt(s.slug, "f")} className="relative block aspect-[8/9] overflow-hidden rounded-[18px] md:aspect-[5/6] lg:aspect-[4/5] bg-frame shadow-[0_0_0_1px_rgba(29,28,26,0.06),0_0_0_10px_#fff,0_1px_2px_10px_rgba(29,28,26,0.05),0_36px_70px_-30px_rgba(29,28,26,0.42)] transition-[translate,box-shadow] duration-500 ease-[cubic-bezier(.16,1,.3,1)] [view-transition-name:var(--vt)] motion-safe:group-hover:-translate-y-1.5 group-hover:shadow-[0_0_0_1px_rgba(29,28,26,0.06),0_0_0_10px_#fff,0_1px_2px_10px_rgba(29,28,26,0.05),0_48px_80px_-30px_rgba(29,28,26,0.5)]">
                    {s.videoUrl && <video ref={playNearby} src={s.videoUrl} preload="none" muted loop playsInline aria-hidden="true" className="absolute inset-0 h-full w-full signer transition-[scale] duration-700 ease-[cubic-bezier(.16,1,.3,1)] motion-safe:group-hover:scale-[1.05]" />}
                  </span>
                  <span className="flex items-center justify-between gap-1.5 px-1 max-[380px]:px-0 sm:gap-2">
                    <span style={vt(s.slug, "t")} className="type-gloss min-w-0 truncate text-base leading-tight font-medium [view-transition-name:var(--vt)] sm:text-xl">{s.title}</span>
                    <span className="ink-dot grid size-5 flex-none place-content-center rounded-full border border-line max-[359px]:hidden sm:size-9 [&_svg]:size-2.5 sm:[&_svg]:size-3.5"><Icon name="play" size={14} /></span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
