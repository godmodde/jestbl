"use client";
/* eslint-disable @next/next/no-img-element -- наклейки: готовые PNG 256 px с заданным размером, оптимизатор не нужен */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { CameraCheck } from "@/components/camera-check";
import { LetterGlyph, StarBurst, StationIcon } from "@/components/kids-album";
import { PlushText } from "@/components/plush";
import { TraceCanvas } from "@/components/trace-canvas";
import { Arrow, btn, Icon } from "@/components/ui";
import { send } from "@/lib/client-api";
import { rng, shuffle, stars as starsFor } from "@/lib/exam";
import type { Templates } from "@/lib/handshape";

// Пять детских механик и экзамен (ТЗ, п. 5). Каждая тренирует своё: узнать жест по картинке, связать жест с предметом,
// понять просьбу, удержать серию, различить жесты. Ошибка — мягкая подсказка и ещё попытка, без штрафа.

export type KidSign = { slug: string; title: string; picture: string | null; videoUrl: string | null };
type Game = {
  signs: KidSign[]; rand: () => number; onFinish: (result?: { correct: number; total: number; mistakes: string[] }) => void;
  /** Образцы формы руки для теста «Покажи букву»; null — камеры нет, тест идёт выбором. */
  templates?: Templates | null;
  /** Малыши 3–5 (сверка с заказчиком 2026-11-10): два варианта вместо трёх, меньше раундов. */
  small?: boolean;
};

// У малышей два варианта ответа: сетка в два столбца.
const cols = (small?: boolean) => (small ? "grid-cols-2" : "grid-cols-3");

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
      <div className="fluffy">
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
      className={`kid-card grid min-h-40 place-items-center gap-2 rounded-[22px] border-[2.5px] bg-surface p-4 transition-colors
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

function rounds(signs: KidSign[], rand: () => number, count: number, small?: boolean) {
  return shuffle(signs, rand).slice(0, count).map((answer) => ({
    answer,
    options: shuffle([answer, ...shuffle(signs.filter((s) => s.slug !== answer.slug), rand).slice(0, small ? 1 : 2)], rand),
  }));
}

// 1. Найди жест: картинка → какое из трёх видео её показывает.
function FindGame({ signs, rand, onFinish, small }: Game) {
  const list = useMemo(() => rounds(signs, rand, small ? 3 : 4, small), [signs, rand, small]);
  const [at, setAt] = useState(0);
  const { pick, state, missed } = useChoice(() => (at + 1 < list.length ? setAt(at + 1) : onFinish()));
  const r = list[at];
  return (
    <div className="grid gap-8">
      <Dots total={list.length} at={at} />
      <div className="grid justify-items-center gap-3">
        <img src={pic(r.answer)} alt={r.answer.title} width={176} height={176} className="sticker size-36 md:size-44" />
      </div>
      <div key={at} className={`mx-auto grid w-full gap-4 ${small ? "max-w-2xl sm:grid-cols-2" : "max-w-4xl sm:grid-cols-3"}`}>
        {r.options.map((o, i) => <VideoButton key={o.slug} sign={o} index={i} state={state(o.slug)} onClick={() => pick(o.slug, r.answer.slug)} />)}
      </div>
      <Hint text={missed ? "Посмотри ещё раз на руки" : null} />
    </div>
  );
}

// 2. Собери пару: три видео и три картинки — соединить каждое видео со своей картинкой.
function PairGame({ signs, rand, onFinish, small }: Game) {
  const groups = useMemo(() => {
    const all = shuffle(signs, rand);
    const n = small ? 2 : 3;
    return [all.slice(0, n), all.slice(n, n * 2)].filter((g) => g.length === n).map((g) => ({ videos: g, pictures: shuffle(g, rand) }));
  }, [signs, rand, small]);
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
        <div className={`grid gap-3 ${cols(small)}`}>
          {g.videos.map((v, i) => (
            <VideoButton key={v.slug} sign={v} index={i} disabled={done.includes(v.slug)}
              state={done.includes(v.slug) ? "right" : held === v.slug ? "picked" : "idle"} onClick={() => setHeld(v.slug)} />
          ))}
        </div>
        <div className={`grid gap-3 md:grid-cols-1 ${cols(small)}`}>
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
function FeedGame({ signs, rand, onFinish, small }: Game) {
  const list = useMemo(() => rounds(signs, rand, small ? 3 : 4, small), [signs, rand, small]);
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
      <div className={`grid gap-3 ${cols(small)}`}>
        {r.options.map((o) => (
          <PictureButton key={o.slug} sign={o} state={state(o.slug)} onClick={() => { if (o.slug === r.answer.slug) setFed(true); void pick(o.slug, r.answer.slug); }} />
        ))}
      </div>
      <Hint text={missed ? "Мишка просит другое — посмотри ещё раз" : null} />
    </div>
  );
}

// 4. Пройди маршрут: шесть клеток, каждый верный ответ — шаг вперёд. Держать внимание на серии.
function RouteGame({ signs, rand, onFinish, small }: Game) {
  const list = useMemo(() => rounds(signs, rand, small ? 4 : signs.length, small), [signs, rand, small]);
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
          <div className={`grid gap-3 ${cols(small)}`}>
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
function ExamGame({ signs, rand, onFinish, small }: Game) {
  const list = useMemo(() => rounds(signs, rand, small ? 4 : 6, small).map((r, i) => ({ ...r, kind: i % 2 ? "video" : "picture" })), [signs, rand, small]);
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
          <div className={`mx-auto grid w-full gap-4 ${small ? "max-w-2xl sm:grid-cols-2" : "max-w-4xl sm:grid-cols-3"}`}>
            {r.options.map((o, i) => <VideoButton key={o.slug} sign={o} index={i} state={state(o.slug)} onClick={() => pick(o.slug, r.answer.slug)} />)}
          </div>
        </div>
      ) : (
        <div key={at} className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-10">
          <div className="w-full max-w-[360px]"><KidVideo sign={r.answer} label="Жест" replay={misses} /></div>
          <div className={`grid gap-3 ${cols(small)}`}>
            {r.options.map((o) => <PictureButton key={o.slug} sign={o} state={state(o.slug)} onClick={() => pick(o.slug, r.answer.slug)} />)}
          </div>
        </div>
      )}
      <Hint text={missed ? "Ничего страшного — попробуй ещё раз" : null} />
    </div>
  );
}

// ——— Алфавит (решение заказчика 2026-11-10): обвести, найти букву по жесту, показать букву рукой ———

/** Кнопка-буква: заглавная и строчная крупно — ребёнок узнаёт букву, а не читает слово. */
function LetterButton({ sign, state, onClick }: { sign: KidSign; state: "idle" | "right" | "wrong"; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={`Буква ${sign.title}`}
      className={`press grid min-h-32 place-items-center rounded-[22px] border-[2.5px] bg-surface transition-colors
        ${state === "right" ? "border-accent bg-accent-soft text-accent" : state === "wrong" ? "anim-nudge border-line opacity-60" : "border-transparent hover:border-line"}`}>
      <LetterGlyph title={sign.title} className="text-[clamp(52px,7vw,80px)]" />
    </button>
  );
}

/** Вопросы «жест → буква»: каждая буква с видео по разу, варианты — две другие буквы группы. */
function letterRounds(signs: KidSign[], rand: () => number) {
  return shuffle(signs.filter((s) => s.videoUrl), rand).map((answer) => ({
    answer,
    options: shuffle([answer, ...shuffle(signs.filter((s) => s.slug !== answer.slug), rand).slice(0, 2)], rand),
  }));
}

type LetterRound = ReturnType<typeof letterRounds>[number];

function LetterQuestion({ r, misses, state, pick }: { r: LetterRound; misses: number; state: (slug: string) => "idle" | "right" | "wrong"; pick: (slug: string, answer: string) => void }) {
  return (
    <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-10">
      {/* На телефоне видео меньше: буквы-ответы остаются в первом экране. */}
      <div className="mx-auto w-full max-w-[240px] md:max-w-[360px]"><KidVideo sign={r.answer} label="Жест буквы" replay={misses} /></div>
      <div role="group" aria-label="Какая это буква?" className="grid grid-cols-3 gap-3">
        {r.options.map((o) => <LetterButton key={o.slug} sign={o} state={state(o.slug)} onClick={() => pick(o.slug, r.answer.slug)} />)}
      </div>
    </div>
  );
}

const NoVideo = () => <p className="m-0 py-16 text-center text-ink-2">Видео букв появятся после съёмки</p>;

// Обведи букву: каждая буква группы — заглавная, потом строчная, рядом её жест. Обводку можно пропустить.
function TraceGame({ signs, onFinish }: Game) {
  const steps = useMemo(() => signs.flatMap((s) => [{ sign: s, glyph: s.title }, { sign: s, glyph: s.title.toLowerCase() }]), [signs]);
  const [at, setAt] = useState(0);
  const step = steps[at];
  const next = () => (at + 1 < steps.length ? setAt(at + 1) : onFinish());
  return (
    <div className="grid gap-8">
      <Dots total={signs.length} at={Math.floor(at / 2)} />
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-10">
        <div className="mx-auto w-full max-w-[220px] md:max-w-[320px]"><KidVideo sign={step.sign} label={`Жест буквы ${step.sign.title}`} /></div>
        {/* Обводка — сама задача: на телефоне поле первым, жест-подсказка под ним. */}
        <div className="mx-auto w-full max-w-[min(100%,calc((100svh-420px)*100/140))] max-md:order-first">
          <TraceCanvas letter={step.glyph} onDone={async () => { await wait(CORRECT_PAUSE); next(); }} onSkip={next} />
        </div>
      </div>
    </div>
  );
}

// Найди букву: жест → одна из трёх букв. Ошибка — жест повторяется медленнее, буква мягко качается.
function ChooseGame({ signs, rand, onFinish }: Game) {
  const list = useMemo(() => letterRounds(signs, rand), [signs, rand]);
  const [at, setAt] = useState(0);
  const { pick, state, missed, misses } = useChoice(() => (at + 1 < list.length ? setAt(at + 1) : onFinish()));
  if (!list.length) return <NoVideo />;
  return (
    <div className="grid gap-8">
      <Dots total={list.length} at={at} />
      <LetterQuestion key={at} r={list[at]} misses={misses} state={state} pick={pick} />
      <Hint text={missed ? "Посмотри на руки ещё раз" : null} />
    </div>
  );
}

// Покажи букву (тест): камера проверяет форму руки, без камеры — тот же вопрос выбором. Звёзды — за ответы с первой попытки.
function ShowGame({ signs, rand, onFinish, templates }: Game) {
  const list = useMemo(() => letterRounds(signs, rand), [signs, rand]);
  const [camera, setCamera] = useState(!!templates);
  const [granted, setGranted] = useState(false);
  const [at, setAt] = useState(0);
  const failed = useRef(false);
  const first = useRef<string[]>([]);
  const mistakes = useRef<string[]>([]);
  const advance = (firstTry: boolean) => {
    (firstTry ? first : mistakes).current.push(list[at].answer.slug);
    failed.current = false;
    if (at + 1 < list.length) setAt(at + 1);
    else onFinish({ correct: first.current.length, total: list.length, mistakes: mistakes.current });
  };
  const choice = useChoice(advance);
  if (!list.length) return <NoVideo />;
  const r = list[at];
  return (
    <div className="grid gap-8">
      <Dots total={list.length} at={at} />
      {camera && templates ? (
        <div className="mx-auto grid w-full max-w-2xl gap-5">
          {/* Со второй буквы камера включается сама: доступ уже дан. Неудача — ошибка первой попытки, но можно ещё раз. */}
          <CameraCheck key={at} letter={r.answer.title} templates={templates} autoStart={granted}
            onResult={async (ok) => {
              setGranted(true);
              if (!ok) { failed.current = true; return; }
              await wait(CORRECT_PAUSE);
              advance(!failed.current);
            }}
            onNoCamera={() => setCamera(false)} />
          <button type="button" onClick={() => setCamera(false)} className={`${btn.ghost} justify-self-center`}>Без камеры</button>
        </div>
      ) : (
        <>
          <LetterQuestion key={at} r={r} misses={choice.misses} state={choice.state} pick={choice.pick} />
          <Hint text={choice.missed ? "Ничего страшного — попробуй ещё раз" : null} />
        </>
      )}
    </div>
  );
}


// ── Новые игры для вариантов макета 2 и 3 (согласование 2026-11-10): «прям игровые», не тесты. ──
// Каждая — на станции прежней механики с тем же навыком: прогресс и наклейки работают как раньше.

const BALLOON = ["var(--plush-a, #A9CBEC)", "var(--plush-b, #EDB8CB)", "var(--plush-c, #C5B4E8)", "var(--plush-d, #F5DE8A)"];

// Лопни шарики (вместо «Найди жест»): жест на видео — лопни шарик с той же картинкой. Шарики плывут вверх по кругу,
// медленно и без таймера: по движущейся цели легко попасть, а мимо — шарик просто уплывёт и вернётся.
function BalloonsGame({ signs, rand, onFinish, small }: Game) {
  const list = useMemo(() => rounds(signs, rand, small ? 3 : 4, small), [signs, rand, small]);
  const [at, setAt] = useState(0);
  const [popped, setPopped] = useState<string | null>(null);
  const { pick, state, missed, misses } = useChoice(() => { setPopped(null); if (at + 1 < list.length) setAt(at + 1); else onFinish(); });
  const r = list[at];
  return (
    <div className="grid gap-8">
      <Dots total={list.length} at={at} />
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)] md:gap-10">
        <div className="mx-auto w-full max-w-[190px] sm:max-w-[300px] md:max-w-none"><KidVideo key={at} sign={r.answer} label="Какой шарик лопнуть" replay={misses} /></div>
        <div key={at} className="balloon-sky relative h-[clamp(340px,50svh,560px)] overflow-hidden rounded-[32px] bg-linear-to-b from-[#DCE7F6] to-[#F6F1F7] [container-type:size]">
          <span aria-hidden="true" className="absolute top-[14%] left-[8%] h-10 w-28 rounded-full bg-white/80 blur-[2px]" />
          <span aria-hidden="true" className="absolute top-[34%] right-[6%] h-8 w-24 rounded-full bg-white/70 blur-[2px]" />
          {r.options.map((o, i) => {
            const st = state(o.slug);
            return (
              <div key={o.slug} className="balloon absolute" style={{ left: `${((i + 0.5) * 100) / r.options.length}%`, "--dur": `${9 + i * 1.4}s`, "--delay": `${-(i * 3.1 + 1.5)}s` } as React.CSSProperties}>
                <div className="balloon-sway grid -translate-x-1/2 justify-items-center">
                  <button type="button" aria-label={o.title} disabled={popped !== null}
                    onClick={() => { if (o.slug === r.answer.slug) setPopped(o.slug); void pick(o.slug, r.answer.slug); }}
                    className={`grid size-[clamp(112px,13vw,150px)] place-items-center rounded-[50%_50%_47%_47%/56%_56%_44%_44%] shadow-[inset_-10px_-14px_24px_rgb(29_28_26/0.14),0_18px_30px_-18px_rgb(29_28_26/0.5)] ${popped === o.slug ? "balloon-pop" : st === "wrong" ? "anim-nudge opacity-60" : ""}`}
                    style={{ background: `radial-gradient(circle at 32% 26%, rgb(255 255 255 / .75) 0 7%, transparent 8%), ${BALLOON[(at + i) % BALLOON.length]}` }}>
                    <img src={pic(o)} alt="" width={84} height={84} className="size-[56%]" />
                  </button>
                  <svg width="22" height="74" viewBox="0 0 22 74" aria-hidden="true" className={popped === o.slug ? "opacity-0" : ""}>
                    <path d="M8 0l3 6 3-6z" fill="currentColor" className="text-ink/30" />
                    <path d="M11 6c-7 14 7 24 0 38s6 20 0 30" fill="none" stroke="#9A948A" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Hint text={missed ? "Посмотри ещё раз на руки" : null} />
    </div>
  );
}

// Мемори (вместо «Собери пару»): карточки рубашкой вверх, пара — жест на видео и его картинка. Тренирует память на жест.
function MemoryGame({ signs, rand, onFinish, small }: Game) {
  const cards = useMemo(() => shuffle(shuffle(signs, rand).slice(0, small ? 2 : 3)
    .flatMap((s) => [{ id: `${s.slug}-v`, sign: s, video: true }, { id: `${s.slug}-p`, sign: s, video: false }]), rand), [signs, rand, small]);
  const [up, setUp] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [miss, setMiss] = useState(0);
  async function flip(id: string) {
    const card = cards.find((c) => c.id === id)!;
    if (up.length === 2 || up.includes(id) || found.includes(card.sign.slug)) return;
    const next = [...up, id];
    setUp(next);
    if (next.length < 2) return;
    const [a, b] = next.map((x) => cards.find((c) => c.id === x)!);
    if (a.sign.slug !== b.sign.slug) { setMiss((m) => m + 1); await wait(1500); setUp([]); return; }
    await wait(450);
    const done = [...found, a.sign.slug];
    setFound(done); setUp([]);
    if (done.length * 2 === cards.length) { await wait(CORRECT_PAUSE); onFinish(); }
  }
  return (
    <div className="grid gap-8">
      <ol aria-label={`Пар найдено: ${found.length} из ${cards.length / 2}`} className="m-0 flex list-none gap-1.5 p-0">
        {Array.from({ length: cards.length / 2 }, (_, i) => <li key={i} className={`size-3 rounded-full transition-colors duration-300 ${i < found.length ? "bg-accent" : "bg-line"}`} />)}
      </ol>
      <div className={`mx-auto grid w-full gap-[clamp(10px,2vw,20px)] ${small ? "max-w-xl grid-cols-2" : "max-w-4xl grid-cols-2 sm:grid-cols-3"}`}>
        {cards.map((c, i) => {
          const isFound = found.includes(c.sign.slug);
          const isUp = isFound || up.includes(c.id);
          return (
            <button key={c.id} type="button" onClick={() => flip(c.id)} data-open={isUp}
              aria-label={!isUp ? `Карточка ${i + 1}` : `${c.video ? "Жест" : c.sign.title}${isFound ? ", пара найдена" : ""}`}
              className="memory-card relative aspect-[5/6] w-full rounded-[24px] [perspective:1000px]">
              <span aria-hidden="true" className="memory-face plush-pad absolute inset-0 grid place-content-center rounded-[24px] bg-accent-soft" style={{ "--pad": BALLOON[i % BALLOON.length] } as React.CSSProperties}>
                <img src="/kids/friend.png" alt="" width={72} height={72} className="size-[clamp(48px,7vw,72px)] opacity-90" />
              </span>
              <span className={`memory-face memory-front kid-card absolute inset-0 grid place-items-center overflow-hidden rounded-[24px] border-[3px] bg-surface ${isFound ? "border-accent" : "border-transparent"}`}>
                {c.video ? (
                  isUp && (c.sign.videoUrl
                    ? <video src={c.sign.videoUrl} autoPlay muted loop playsInline aria-hidden="true" className="absolute inset-0 h-full w-full signer" />
                    : <span className="p-3 text-center text-sm text-ink-2">Видео появится после съёмки</span>)
                ) : (
                  <img src={pic(c.sign)} alt="" width={120} height={120} className="sticker size-[62%]" />
                )}
                {isFound && <span className="absolute top-2 right-2 grid size-8 place-content-center rounded-full bg-accent text-white"><Icon name="check" size={18} /></span>}
              </span>
            </button>
          );
        })}
      </div>
      <Hint text={up.length === 2 && miss ? "Не пара — запомни, где что лежит" : found.length === 0 && up.length === 0 ? "Найди жест и его картинку" : null} />
    </div>
  );
}

// Найди в комнате (вместо «Накорми друга»): жест на видео — найди предмет среди игрушек в комнате. Жест в обстановке, а не в списке.
const SLOTS = [
  { x: 14, y: 27, s: 14, r: -8 }, { x: 37, y: 28, s: 12, r: 6 }, { x: 78, y: 30, s: 13, r: -4 },
  { x: 18, y: 66, s: 17, r: 4 }, { x: 52, y: 70, s: 15, r: -6 }, { x: 84, y: 72, s: 15, r: 8 },
];
function RoomGame({ signs, rand, onFinish, small }: Game) {
  // Одним вызовом: генератор общий, порядок вызовов должен совпасть на сервере и в браузере.
  const { items, targets } = useMemo(() => {
    const items = shuffle(signs, rand).slice(0, small ? 4 : 6);
    return { items, targets: shuffle(items, rand).slice(0, small ? 3 : 4) };
  }, [signs, rand, small]);
  const slots = small ? [SLOTS[0], SLOTS[2], SLOTS[3], SLOTS[5]] : SLOTS;
  const [at, setAt] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const { pick, state, missed, misses } = useChoice(() => { setFound((f) => [...f, targets[at].slug]); if (at + 1 < targets.length) setAt(at + 1); else onFinish(); });
  const target = targets[at];
  return (
    <div className="grid gap-8">
      <Dots total={targets.length} at={at} />
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:gap-10">
        <div className="mx-auto w-full max-w-[190px] sm:max-w-[280px] md:max-w-none"><KidVideo key={at} sign={target} label="Что найти в комнате" replay={misses} /></div>
        {/* Комната с игрушками: стена, окно, полка, ковёр, кресло — предметы стоят на своих местах. */}
        <div className="relative aspect-square overflow-hidden rounded-[32px] bg-[var(--plush-base,#F3ECE4)] md:aspect-[4/3]">
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[58%] bg-[color-mix(in_oklab,var(--plush-c,#C5B4E8)_35%,white)]" />
          <span aria-hidden="true" className="absolute top-[8%] right-[6%] h-[34%] w-[26%] rounded-[18px] border-[6px] border-white bg-linear-to-b from-[#CFE2F5] to-[#EEF4FB] shadow-[0_10px_20px_-14px_rgb(29_28_26/0.5)]">
            <span className="absolute inset-y-0 left-1/2 w-1.5 -translate-x-1/2 bg-white" /><span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 bg-white" />
          </span>
          <span aria-hidden="true" className="absolute top-[37%] left-[4%] h-3 w-[46%] rounded-full bg-[color-mix(in_oklab,var(--plush-spot,#5E2E6B)_30%,#C9B9A6)] shadow-[0_8px_12px_-6px_rgb(29_28_26/0.45)]" />
          <span aria-hidden="true" className="absolute bottom-[6%] left-[22%] h-[22%] w-[56%] rounded-[50%] bg-[color-mix(in_oklab,var(--plush-b,#EDB8CB)_70%,white)]" />
          <span aria-hidden="true" className="absolute right-[-6%] bottom-[8%] h-[30%] w-[26%] rounded-t-[60px] rounded-b-[20px] shadow-[inset_0_14px_0_rgb(255_255_255/0.25)] bg-[color-mix(in_oklab,var(--plush-a,#A9CBEC)_80%,#7d8aa8)]" />
          {items.map((it, i) => {
            const sl = slots[i];
            const done = found.includes(it.slug);
            const st = state(it.slug);
            return (
              <button key={it.slug} type="button" aria-label={it.title} disabled={done} onClick={() => pick(it.slug, target.slug)}
                className={`absolute grid aspect-square -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-transform hover:scale-110 ${st === "right" ? "anim-bump" : st === "wrong" ? "anim-nudge" : ""}`}
                style={{ left: `${sl.x}%`, top: `${sl.y}%`, width: `max(60px, ${sl.s}%)`, rotate: `${sl.r}deg` }}>
                <img src={pic(it)} alt="" width={96} height={96} className={`sticker h-auto w-full ${done ? "opacity-40" : ""}`} />
                {(done || st === "right") && <span className="absolute -top-1 -right-1 grid size-8 place-content-center rounded-full bg-accent text-white"><Icon name="check" size={18} /></span>}
              </button>
            );
          })}
        </div>
      </div>
      <Hint text={missed ? "Это не то — посмотри на руки ещё раз" : null} />
    </div>
  );
}

// История с другом (вместо «Пройди маршрут»): мишка идёт в гости; на каждой остановке он говорит жестом,
// ребёнок даёт нужное — мишка кладёт это в рюкзак и шагает дальше. Серия с сюжетом.
function StoryGame({ signs, rand, onFinish, small }: Game) {
  const list = useMemo(() => rounds(signs, rand, small ? 3 : 4, small), [signs, rand, small]);
  const [at, setAt] = useState(0);
  const [bag, setBag] = useState<KidSign[]>([]);
  const { pick, state, missed, misses } = useChoice(() => {
    setBag((b) => [...b, list[at].answer]);
    if (at + 1 < list.length) setAt(at + 1); else { setAt(list.length); void wait(1100).then(() => onFinish()); }
  });
  const r = list[Math.min(at, list.length - 1)];
  const stop = (i: number) => 8 + (i * 80) / list.length;
  return (
    <div className="grid gap-8">
      {/* Сцена: холмы, дорожка с остановками, домик друга в конце. */}
      <div className="relative h-[clamp(150px,24vw,250px)] overflow-hidden rounded-[32px] bg-linear-to-b from-[#DCE7F6] to-[#F6F1F7]">
        <span aria-hidden="true" className="absolute -bottom-[60%] -left-[10%] h-full w-[70%] rounded-[50%] bg-[color-mix(in_oklab,var(--plush-c,#C5B4E8)_45%,white)]" />
        <span aria-hidden="true" className="absolute -right-[10%] -bottom-[55%] h-full w-[70%] rounded-[50%] bg-[color-mix(in_oklab,var(--plush-a,#A9CBEC)_50%,white)]" />
        <span aria-hidden="true" className="absolute inset-x-[6%] bottom-[22%] h-2 rounded-full bg-white/80" />
        {Array.from({ length: list.length }, (_, i) => (
          <span key={i} aria-hidden="true" className={`absolute bottom-[22%] size-5 -translate-x-1/2 translate-y-1.5 rounded-full border-4 border-white ${i < bag.length ? "bg-accent" : "bg-[var(--plush-d,#F5DE8A)]"}`} style={{ left: `${stop(i)}%` }} />
        ))}
        <span aria-hidden="true" className="absolute right-[3%] bottom-[22%] h-[46%] w-[11%] min-w-14">
          <span className="absolute inset-x-0 bottom-0 h-[60%] rounded-b-[10px] bg-[var(--plush-b,#EDB8CB)]" />
          <span className="absolute inset-x-[-12%] top-0 h-[44%] bg-[var(--plush-spot,#5E2E6B)] [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
        </span>
        <img key={bag.length} src="/kids/friend.png" alt="Мишка" width={120} height={120}
          className={`story-walk sticker absolute bottom-[20%] w-[clamp(72px,10vw,110px)] -translate-x-1/2 ${missed ? "anim-nudge" : "anim-bump"}`} style={{ left: `${at >= list.length ? 90 : stop(at)}%` }} />
        {bag.length > 0 && (
          <ul aria-label="В рюкзаке" className="absolute top-3 left-3 m-0 flex list-none gap-1 rounded-full bg-white/80 p-1.5 pr-3">
            {bag.map((b) => <li key={b.slug}><img src={pic(b)} alt={b.title} width={36} height={36} className="anim-pop size-9" /></li>)}
          </ul>
        )}
      </div>
      {at < list.length && (
        <div key={at} className="grid items-start gap-6 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:gap-10">
          {/* Видео — в облачке речи мишки: хвостик смотрит вверх, на сцену. */}
          <div className="relative mx-auto w-full max-w-[190px] rounded-[28px] bg-surface p-2.5 sm:max-w-[300px] shadow-[0_18px_40px_-28px_rgb(29_28_26/0.55)] md:max-w-none">
            <span aria-hidden="true" className="absolute -top-3 left-12 size-7 rotate-45 rounded-[6px] bg-surface" />
            <KidVideo sign={r.answer} label="Что говорит мишка" replay={misses} />
          </div>
          <div className={`grid gap-3 ${cols(small)}`}>
            {r.options.map((o) => <PictureButton key={o.slug} sign={o} state={state(o.slug)} onClick={() => pick(o.slug, r.answer.slug)} />)}
          </div>
        </div>
      )}
      <Hint text={missed ? "Мишка показал другое — посмотри ещё раз" : null} />
    </div>
  );
}

const GAMES: Record<string, (g: Game) => React.ReactNode> = {
  find: FindGame, pair: PairGame, feed: FeedGame, route: RouteGame, diff: DiffGame, exam: ExamGame,
  trace: TraceGame, choose: ChooseGame, show: ShowGame,
  balloons: BalloonsGame, memory: MemoryGame, room: RoomGame, story: StoryGame,
};

export function KidsGame({ kind, title, signs, seed, topic, station, reward, templates = null, small = false }: {
  kind: string;
  title: string;
  signs: KidSign[];
  seed: string;
  topic: { slug: string; title: string };
  station: string;
  reward: KidSign | null;
  templates?: Templates | null;
  small?: boolean;
}) {
  const rand = useMemo(() => rng(seed), [seed]);
  const router = useRouter();
  const [stars, setStars] = useState<number | null>(null);
  const [passed, setPassed] = useState<KidSign[]>([]);
  const [done, setDone] = useState(false);
  const Game = GAMES[kind] ?? FindGame;

  async function finish(result?: { correct: number; total: number; mistakes: string[] }) {
    setDone(true);
    if (result) {
      setStars(starsFor(result.correct, result.total));
      const ok = signs.filter((s) => !result.mistakes.includes(s.slug));
      setPassed(ok);
      // После сохранения — обновить серверную часть: копилка в шапке детского мира иначе показала бы старое число.
      void send("/exams", "POST", { lesson: station, total: result.total, correct: result.correct, mistakes: result.mistakes, passed: ok.map((s) => s.slug) })
        .then(() => router.refresh());
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
          <span className="plush-pad grid size-12 place-content-center rounded-full bg-accent-soft text-accent">
            <StationIcon kind={kind} />
          </span>
          <PlushText text={title} small />
        </h1>
      </header>

      {!done ? (
        <Game signs={signs} rand={rand} onFinish={finish} templates={templates} small={small} />
      ) : (
        <section aria-live="polite" className="grid justify-items-center gap-6 py-10 text-center">
          {kind === "exam" || kind === "show" ? (
            <>
              <StarBurst n={stars ?? 3} />
              <h2 className="m-0 font-display text-[clamp(32px,4vw,48px)] font-semibold tracking-[-0.03em]">{stars === 10 ? "Отлично!" : stars === 5 ? "Хорошо!" : "Получилось!"}</h2>
            </>
          ) : !reward ? (
            <h2 className="anim-pop m-0 font-display text-[clamp(32px,4vw,48px)] font-semibold tracking-[-0.03em]">Готово!</h2>
          ) : null}
          {/* Верно показанные буквы ложатся в альбом наклейками. */}
          {kind === "show" && passed.length > 0 && (
            <ul aria-label="Новые наклейки" className="m-0 flex list-none flex-wrap justify-center gap-4 p-0">
              {passed.map((s, i) => <li key={s.slug}><LetterGlyph title={s.title} sticker className={`sticker-land text-[clamp(48px,6vw,72px)] ${i % 2 ? "rotate-3" : "-rotate-3"}`} /></li>)}
            </ul>
          )}
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
