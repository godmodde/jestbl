"use client";
/* eslint-disable @next/next/no-img-element -- наклейки: готовые PNG 256 px с заданным размером, оптимизатор не нужен */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Stars, StationIcon } from "@/components/kids-album";
import { Arrow, btn, Icon } from "@/components/ui";
import { send } from "@/lib/client-api";
import { rng, shuffle, stars as starsFor } from "@/lib/exam";

// Пять детских механик и экзамен (ТЗ, п. 5). Каждая тренирует своё: узнать жест по картинке, связать жест с предметом,
// понять просьбу, удержать серию, различить жесты. Ошибка — мягкая подсказка и ещё попытка, без штрафа.

export type KidSign = { slug: string; title: string; picture: string | null; videoUrl: string | null };
type Game = { signs: KidSign[]; rand: () => number; onFinish: (result?: { correct: number; total: number; mistakes: string[] }) => void };

const pic = (s: KidSign) => `/pictures/${s.picture}`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CORRECT_PAUSE = 900;

function Turtle() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 15a7 6 0 0 1 14 0z" /><path d="M18 13.5h2.2a1.8 1.8 0 0 0 0-3.6H19" /><path d="M6 15v2.5M15 15v2.5" /><path d="M8 10.5l3 4.5 3-4.5" />
    </svg>
  );
}

/** Видео жеста для ребёнка: портретный кадр под человека (вшитая подпись демо-ролика за краем), по кругу.
 *  Замедление — под кадром, ничего не лежит на руках. replay растёт при ошибке: жест сам повторяется на 0,5×, рамка пульсирует —
 *  сигнал понятен без чтения. */
function KidVideo({ sign, label, offset = 0, replay = 0, children }: { sign: KidSign; label: string; offset?: number; replay?: number; children?: React.ReactNode }) {
  const [slow, setSlow] = useState(false);
  const [seen, setSeen] = useState(replay);
  const ref = useRef<HTMLVideoElement>(null);
  // Новая ошибка — замедлить (производное состояние от пропса, без эффекта).
  if (replay !== seen) { setSeen(replay); if (replay > 0) setSlow(true); }
  useEffect(() => { if (ref.current) ref.current.playbackRate = slow ? 0.5 : 1; }, [slow]);
  useEffect(() => {
    const v = ref.current;
    if (!replay || !v) return;
    v.currentTime = 0;
    v.playbackRate = 0.5;
    v.play().catch(() => {});
  }, [replay]);
  return (
    <div className="grid gap-2.5">
      <div className="relative aspect-[5/6] overflow-hidden rounded-[20px] bg-frame">
        {sign.videoUrl ? (
          <video ref={ref} src={sign.videoUrl} autoPlay muted loop playsInline aria-label={label}
            onLoadedMetadata={(e) => { e.currentTarget.currentTime = offset; e.currentTarget.playbackRate = slow ? 0.5 : 1; }}
            className="absolute inset-0 h-full w-full signer" />
        ) : (
          <p className="absolute inset-0 m-0 grid place-content-center p-4 text-center text-sm text-ink-2">Видео появится после съёмки</p>
        )}
        {replay > 0 && (
          // Значок — в углу, где фон: корпус и руки во время медленного повтора открыты.
          <span key={replay} aria-hidden="true" className="anim-ring pointer-events-none absolute inset-0 rounded-[20px] ring-[5px] ring-accent ring-inset">
            <span className="absolute top-3 left-3 grid size-12 place-content-center rounded-full bg-surface/90 text-accent"><Icon name="replay" size={24} /></span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {sign.videoUrl && (
          <button type="button" aria-pressed={slow} aria-label="Медленнее" onClick={() => setSlow(!slow)}
            className="grid size-14 flex-none place-content-center rounded-full border-[1.5px] border-line bg-surface text-ink transition-colors hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper">
            <Turtle />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

function Dots({ total, at }: { total: number; at: number }) {
  return (
    <ol aria-label={`Шаг ${Math.min(at + 1, total)} из ${total}`} className="m-0 flex list-none gap-1.5 p-0">
      {Array.from({ length: total }, (_, i) => (
        <li key={i} className={`size-3 rounded-full transition-colors duration-300 ${i < at ? "bg-accent" : i === at ? "bg-ink" : "bg-line"}`} />
      ))}
    </ol>
  );
}

// Подсказка словами — вторична: главное сообщение об ошибке — повтор жеста и пульс рамки.
function Hint({ text }: { text: string | null }) {
  return <p aria-live="polite" className="m-0 min-h-7 text-center text-ink-2">{text}</p>;
}

/** Кнопка-картинка: предмет крупно, слово мелко под ним — для тех, кто уже читает. */
function PictureButton({ sign, state, onClick, disabled }: { sign: KidSign; state: "idle" | "right" | "wrong" | "picked"; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={sign.title}
      className={`grid min-h-40 place-items-center gap-2 rounded-[22px] border-[2.5px] bg-surface p-4 transition-colors
        ${state === "right" ? "border-accent bg-accent-soft" : state === "wrong" ? "anim-nudge border-line opacity-60" : state === "picked" ? "border-ink bg-track" : "border-transparent hover:border-line"}`}>
      <img src={pic(sign)} alt="" width={112} height={112} className="sticker size-24 md:size-28" />
      <span className="text-[15px] font-medium text-ink-2">{sign.title}</span>
    </button>
  );
}

function VideoButton({ sign, index, state, onClick, disabled, offset }: { sign: KidSign; index: number; state: "idle" | "right" | "wrong" | "picked"; onClick: () => void; disabled?: boolean; offset?: number }) {
  return (
    <div className={`rounded-[24px] border-[2.5px] p-2.5 transition-colors ${state === "right" ? "border-accent bg-accent-soft" : state === "wrong" ? "anim-nudge border-line opacity-60" : state === "picked" ? "border-ink bg-track" : "border-transparent"}`}>
      <KidVideo sign={sign} label={`Видео ${index + 1}`} offset={offset}>
        <button type="button" onClick={onClick} disabled={disabled}
          className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-lg font-semibold text-paper transition-colors hover:bg-accent disabled:bg-line disabled:text-muted">
          {state === "right" ? <Icon name="check" size={22} /> : <>Это <span className="tabular-nums">{index + 1}</span></>}
        </button>
      </KidVideo>
    </div>
  );
}

/** Выбор из трёх с мягкой ошибкой: общая часть «Найди жест», «Накорми», «Маршрута» и экзамена. */
function useChoice(onRight: (firstTry: boolean) => void) {
  const [wrong, setWrong] = useState<string[]>([]);
  const [right, setRight] = useState<string | null>(null);
  const pick = async (slug: string, answer: string) => {
    if (right) return;
    if (slug !== answer) return setWrong((w) => [...w, slug]);
    setRight(slug);
    await wait(CORRECT_PAUSE);
    onRight(wrong.length === 0);
    setWrong([]);
    setRight(null);
  };
  const state = (slug: string) => (right === slug ? "right" : wrong.includes(slug) ? "wrong" : "idle") as "idle" | "right" | "wrong";
  return { pick, state, missed: wrong.length > 0, misses: wrong.length };
}

function rounds(signs: KidSign[], rand: () => number, count: number) {
  return shuffle(signs, rand).slice(0, count).map((answer) => ({
    answer,
    options: shuffle([answer, ...shuffle(signs.filter((s) => s.slug !== answer.slug), rand).slice(0, 2)], rand),
  }));
}

// 1. Найди жест: картинка → какое из трёх видео её показывает.
function FindGame({ signs, rand, onFinish }: Game) {
  const list = useMemo(() => rounds(signs, rand, 4), [signs, rand]);
  const [at, setAt] = useState(0);
  const { pick, state, missed } = useChoice(() => (at + 1 < list.length ? setAt(at + 1) : onFinish()));
  const r = list[at];
  return (
    <div className="grid gap-8">
      <Dots total={list.length} at={at} />
      <div className="grid justify-items-center gap-3">
        <img src={pic(r.answer)} alt={r.answer.title} width={176} height={176} className="sticker size-36 md:size-44" />
      </div>
      <div key={at} className="mx-auto grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {r.options.map((o, i) => <VideoButton key={o.slug} sign={o} index={i} state={state(o.slug)} onClick={() => pick(o.slug, r.answer.slug)} />)}
      </div>
      <Hint text={missed ? "Посмотри ещё раз на руки" : null} />
    </div>
  );
}

// 2. Собери пару: три видео и три картинки — соединить каждое видео со своей картинкой.
function PairGame({ signs, rand, onFinish }: Game) {
  const groups = useMemo(() => {
    const all = shuffle(signs, rand);
    return [all.slice(0, 3), all.slice(3, 6)].filter((g) => g.length === 3).map((g) => ({ videos: g, pictures: shuffle(g, rand) }));
  }, [signs, rand]);
  const [at, setAt] = useState(0);
  const [held, setHeld] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [miss, setMiss] = useState<string | null>(null);
  const g = groups[at];
  async function choose(slug: string) {
    if (!held || done.includes(slug)) return;
    if (slug !== held) { setMiss(slug); setHeld(null); return; }
    const next = [...done, slug];
    setDone(next); setHeld(null); setMiss(null);
    if (next.length === g.videos.length) {
      await wait(CORRECT_PAUSE);
      if (at + 1 < groups.length) { setAt(at + 1); setDone([]); } else onFinish();
    }
  }
  return (
    <div className="grid gap-8">
      <Dots total={groups.length} at={at} />
      <div key={at} className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] md:gap-7">
        <div className="grid grid-cols-3 gap-3">
          {g.videos.map((v, i) => (
            <VideoButton key={v.slug} sign={v} index={i} disabled={done.includes(v.slug)}
              state={done.includes(v.slug) ? "right" : held === v.slug ? "picked" : "idle"} onClick={() => setHeld(v.slug)} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
          {g.pictures.map((p) => (
            <PictureButton key={p.slug} sign={p} disabled={!held && !done.includes(p.slug)}
              state={done.includes(p.slug) ? "right" : miss === p.slug ? "wrong" : "idle"} onClick={() => choose(p.slug)} />
          ))}
        </div>
      </div>
      <Hint text={miss ? "Не та пара — попробуй ещё" : held ? "Теперь выбери картинку" : "Выбери видео"} />
    </div>
  );
}

// 3. Накорми друга: друг просит жестом — ребёнок даёт нужный предмет. Понимание просьбы, а не перевод слова.
function FeedGame({ signs, rand, onFinish }: Game) {
  const list = useMemo(() => rounds(signs, rand, 4), [signs, rand]);
  const [at, setAt] = useState(0);
  const [fed, setFed] = useState(false);
  const { pick, state, missed, misses } = useChoice(() => { setFed(false); if (at + 1 < list.length) setAt(at + 1); else onFinish(); });
  const r = list[at];
  return (
    <div className="grid gap-8">
      <Dots total={list.length} at={at} />
      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-12">
        <div className="relative grid justify-items-center">
          <img src="/kids/friend.png" alt="Мишка" width={220} height={220} className={`sticker size-44 md:size-56 ${fed ? "anim-pop" : missed ? "anim-nudge" : ""}`} />
          {fed && <img src={pic(r.answer)} alt="" width={96} height={96} className="sticker anim-pop absolute bottom-0 size-20" />}
        </div>
        <div key={at} className="relative w-full max-w-[360px] rounded-[24px] bg-surface p-2 shadow-[0_18px_40px_-28px_rgba(29,28,26,0.55)] md:justify-self-start">
          <KidVideo sign={r.answer} label="Что просит мишка" replay={misses} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {r.options.map((o) => (
          <PictureButton key={o.slug} sign={o} state={state(o.slug)} onClick={() => { if (o.slug === r.answer.slug) setFed(true); void pick(o.slug, r.answer.slug); }} />
        ))}
      </div>
      <Hint text={missed ? "Мишка просит другое — посмотри ещё раз" : null} />
    </div>
  );
}

// 4. Пройди маршрут: шесть клеток, каждый верный ответ — шаг вперёд. Держать внимание на серии.
function RouteGame({ signs, rand, onFinish }: Game) {
  const list = useMemo(() => rounds(signs, rand, signs.length), [signs, rand]);
  const [at, setAt] = useState(0);
  const { pick, state, missed, misses } = useChoice(() => (at + 1 < list.length ? setAt(at + 1) : (setAt(list.length), void wait(600).then(() => onFinish()))));
  const r = list[Math.min(at, list.length - 1)];
  return (
    <div className="grid gap-8">
      {/* Клетки фиксированного размера на линии: на широком экране дорожка не раздувается. */}
      <ol aria-label={`Клетка ${at} из ${list.length}`} className="relative m-0 flex list-none items-center justify-between gap-1 p-0">
        <span aria-hidden="true" className="absolute inset-x-6 top-1/2 h-1 -translate-y-1/2 rounded-full bg-track" />
        {Array.from({ length: list.length + 1 }, (_, i) => (
          <li key={i} className={`relative grid size-11 flex-none place-content-center rounded-full sm:size-16 md:size-20 ${i === list.length ? "bg-star/20 text-star" : i < at ? "bg-accent-soft" : "bg-track"}`}>
            {i === list.length && <Icon name="star-fill" size={22} />}
            {i === at && <img src="/kids/friend.png" alt="" width={64} height={64} className="sticker anim-pop absolute top-1/2 left-1/2 w-[130%] max-w-none -translate-x-1/2 -translate-y-[60%]" />}
          </li>
        ))}
      </ol>
      {at < list.length && (
        <div key={at} className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-10">
          <div className="w-full max-w-[360px]"><KidVideo sign={r.answer} label="Жест" replay={misses} /></div>
          <div className="grid grid-cols-3 gap-3">
            {r.options.map((o) => <PictureButton key={o.slug} sign={o} state={state(o.slug)} onClick={() => pick(o.slug, r.answer.slug)} />)}
          </div>
        </div>
      )}
      <Hint text={missed ? "Почти! Посмотри ещё раз" : null} />
    </div>
  );
}

// 5. Найди отличие: два видео — один и тот же жест или разные. Тренирует различение движений.
function DiffGame({ signs, rand, onFinish }: Game) {
  const list = useMemo(() => shuffle(signs, rand).slice(0, 6).map((a, i) => {
    const same = i % 2 === 0;
    return { a, b: same ? a : shuffle(signs.filter((s) => s.slug !== a.slug), rand)[0], same };
  }).sort(() => rand() - 0.5), [signs, rand]);
  const [at, setAt] = useState(0);
  const [wrong, setWrong] = useState<boolean | null>(null);
  const [misses, setMisses] = useState(0);
  const [right, setRight] = useState<boolean | null>(null);
  const r = list[at];
  async function answer(same: boolean) {
    if (right !== null) return;
    if (same !== r.same) { setMisses((m) => m + 1); return setWrong(same); }
    setRight(same); setWrong(null);
    await wait(CORRECT_PAUSE);
    setRight(null); setMisses(0);
    if (at + 1 < list.length) setAt(at + 1); else onFinish();
  }
  const choice = (same: boolean) => `inline-flex min-h-20 items-center justify-center gap-3 rounded-[22px] border-[2.5px] px-6 text-xl font-semibold transition-colors
    ${right === same ? "border-accent bg-accent-soft" : wrong === same ? "anim-nudge border-line text-muted" : "border-ink bg-surface hover:bg-track"}`;
  return (
    <div className="grid gap-8">
      <Dots total={list.length} at={at} />
      <div key={at} className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-3 md:gap-6">
        <KidVideo sign={r.a} label="Первое видео" replay={misses} />
        <KidVideo sign={r.b} label="Второе видео" offset={r.same ? 0.4 : 0} replay={misses} />
      </div>
      <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-3 md:gap-6">
        <button type="button" onClick={() => answer(true)} className={choice(true)}><span aria-hidden="true" className="font-display text-4xl leading-none">=</span> Одинаковые</button>
        <button type="button" onClick={() => answer(false)} className={choice(false)}><span aria-hidden="true" className="font-display text-4xl leading-none">≠</span> Разные</button>
      </div>
      <Hint text={wrong !== null ? "Посмотри на руки ещё раз" : null} />
    </div>
  );
}

// 6. Экзамен: шесть вопросов вперемешку; звёзды — за ответы с первой попытки (ТЗ: скорость не условие).
function ExamGame({ signs, rand, onFinish }: Game) {
  const list = useMemo(() => rounds(signs, rand, 6).map((r, i) => ({ ...r, kind: i % 2 ? "video" : "picture" })), [signs, rand]);
  const [at, setAt] = useState(0);
  const first = useRef<string[]>([]);
  const mistakes = useRef<string[]>([]);
  const { pick, state, missed, misses } = useChoice((firstTry) => {
    (firstTry ? first : mistakes).current.push(list[at].answer.slug);
    if (at + 1 < list.length) setAt(at + 1);
    else onFinish({ correct: first.current.length, total: list.length, mistakes: mistakes.current });
  });
  const r = list[at];
  return (
    <div className="grid gap-8">
      <Dots total={list.length} at={at} />
      {r.kind === "picture" ? (
        <div key={at} className="grid gap-6">
          <img src={pic(r.answer)} alt={r.answer.title} width={176} height={176} className="sticker size-36 justify-self-center md:size-44" />
          <div className="mx-auto grid w-full max-w-4xl gap-4 sm:grid-cols-3">
            {r.options.map((o, i) => <VideoButton key={o.slug} sign={o} index={i} state={state(o.slug)} onClick={() => pick(o.slug, r.answer.slug)} />)}
          </div>
        </div>
      ) : (
        <div key={at} className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-10">
          <div className="w-full max-w-[360px]"><KidVideo sign={r.answer} label="Жест" replay={misses} /></div>
          <div className="grid grid-cols-3 gap-3">
            {r.options.map((o) => <PictureButton key={o.slug} sign={o} state={state(o.slug)} onClick={() => pick(o.slug, r.answer.slug)} />)}
          </div>
        </div>
      )}
      <Hint text={missed ? "Ничего страшного — попробуй ещё раз" : null} />
    </div>
  );
}

const GAMES: Record<string, (g: Game) => React.ReactNode> = {
  find: FindGame, pair: PairGame, feed: FeedGame, route: RouteGame, diff: DiffGame, exam: ExamGame,
};

export function KidsGame({ kind, title, signs, seed, topic, station, reward }: {
  kind: string;
  title: string;
  signs: KidSign[];
  seed: string;
  topic: { slug: string; title: string };
  station: string;
  reward: KidSign | null;
}) {
  const rand = useMemo(() => rng(seed), [seed]);
  const [stars, setStars] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const Game = GAMES[kind] ?? FindGame;

  async function finish(result?: { correct: number; total: number; mistakes: string[] }) {
    setDone(true);
    if (result) {
      setStars(starsFor(result.correct, result.total));
      const passed = signs.map((s) => s.slug).filter((s) => !result.mistakes.includes(s));
      void send("/exams", "POST", { lesson: station, total: result.total, correct: result.correct, mistakes: result.mistakes, passed });
    } else {
      void send(`/lessons/${station}/progress`, "PUT", { step: 0, completed: true });
    }
  }

  const albumHref = `/kids/${topic.slug}${reward ? `?new=${reward.slug}` : ""}`;
  return (
    <div className="grid gap-10 md:gap-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href={`/kids/${topic.slug}`} className="inline-flex min-h-14 items-center gap-2 rounded-full pr-4 font-medium text-ink-2 hover:text-ink">
          <Icon name="back" /> {topic.title}
        </Link>
        <h1 className="m-0 flex items-center gap-3 font-display text-[clamp(26px,3vw,36px)] font-semibold tracking-[-0.02em]">
          <span className="grid size-12 place-content-center rounded-full bg-accent-soft text-accent"><StationIcon kind={kind} /></span>
          {title}
        </h1>
      </header>

      {!done ? (
        <Game signs={signs} rand={rand} onFinish={finish} />
      ) : (
        <section aria-live="polite" className="grid justify-items-center gap-6 py-10 text-center">
          {kind === "exam" ? (
            <>
              <span className="anim-pop"><Stars n={stars ?? 1} size={72} /></span>
              <h2 className="m-0 font-display text-[clamp(32px,4vw,48px)] font-semibold tracking-[-0.03em]">{stars === 3 ? "Отлично!" : stars === 2 ? "Хорошо!" : "Получилось!"}</h2>
            </>
          ) : null}
          {reward && (
            <>
              <img src={pic(reward)} alt="" width={200} height={200} className="sticker sticker-land size-40 -rotate-3 md:size-48" />
              <p className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">{kind === "exam" ? <span className="type-gloss">{reward.title}</span> : <>Новая наклейка: <span className="type-gloss">{reward.title}</span></>}</p>
            </>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={albumHref} className={btn.primary}>В альбом <Arrow /></Link>
            <button type="button" onClick={() => location.reload()} className={btn.ghost}>Ещё раз</button>
          </div>
        </section>
      )}
    </div>
  );
}
