"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import type { Card } from "@/components/exam-runner";
import { Arrow, btn, Icon } from "@/components/ui";
import { VideoPlayer } from "@/components/video-player";
import { buildQuestions, type ExamSign, type Question } from "@/lib/exam";
import { plural } from "@/lib/plural";

// На скорость (сверка с заказчиком 2026-11-10): минута на часах, вопросы подряд, счёт — верные ответы.
// Обычный экзамен от таймера не зависит (ТЗ, п. 5).
// ponytail: рекорд хранится в браузере; таблица лидеров (этап 2) — только с проверкой ответов на сервере.

const SECONDS = 60;
const FLASH_MS = 350; // столько видно, верно ли ответили и какой ответ правильный
const QUEUE = 120; // за минуту столько не ответить — вопросов хватит
type Quick = Extract<Question, { type: "recognize" | "truefalse" }>;

const recordKey = (slug: string) => `vidno-speed:${slug}`;
const noSubscribe = () => () => {};
function readRecord(slug: string) {
  try { return Number(localStorage.getItem(recordKey(slug))) || 0; } catch { return 0; }
}

const heading = "m-0 font-display text-[28px] leading-tight font-semibold tracking-[-0.02em]";
const option = "press flex min-h-14 items-center rounded-md border-[1.5px] px-5 text-left text-[17px] font-medium";

export function SpeedRunner({ title, slug, pool, cards, seed, back }: {
  title: string; slug: string; pool: ExamSign[]; cards: Record<string, Card>; seed: string;
  back: { href: string; label: string };
}) {
  const stored = useSyncExternalStore(noSubscribe, () => readRecord(slug), () => 0);
  const [best, setBest] = useState<number | null>(null);
  const record = best ?? stored;
  const [phase, setPhase] = useState<"idle" | "run" | "done">("idle");
  const [round, setRound] = useState(0);
  const [at, setAt] = useState(0);
  const [left, setLeft] = useState(SECONDS);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [flash, setFlash] = useState<{ pick: string } | null>(null);
  const [fresh, setFresh] = useState(false);
  const end = useRef(0);
  const tally = useRef({ right: 0, total: 0 });

  // Новый заход — новое зерно: вопросы и их порядок не повторяются.
  const questions = useMemo(() => {
    const list: Quick[] = [];
    for (let b = 0; list.length < QUEUE; b++) {
      list.push(...(buildQuestions(pool, `${seed}-${round}-${b}`, { types: ["recognize", "truefalse"], size: pool.length }) as Quick[]));
    }
    return list;
  }, [pool, seed, round]);

  useEffect(() => {
    if (phase !== "run") return;
    const id = setInterval(() => {
      const s = Math.max(0, Math.ceil((end.current - Date.now()) / 1000));
      setLeft(s);
      if (s > 0) return;
      clearInterval(id);
      const { right } = tally.current;
      const isRecord = right > readRecord(slug);
      if (isRecord) {
        try { localStorage.setItem(recordKey(slug), String(right)); } catch {}
        setBest(right);
      }
      setFresh(isRecord);
      setPhase("done");
    }, 200);
    return () => clearInterval(id);
  }, [phase, slug]);

  function start() {
    tally.current = { right: 0, total: 0 };
    setScore(tally.current);
    setAt(0);
    setFlash(null);
    setLeft(SECONDS);
    if (phase === "done") setRound((r) => r + 1);
    end.current = Date.now() + SECONDS * 1000;
    setPhase("run");
  }

  function answer(ok: boolean, pick: string) {
    if (flash || phase !== "run") return;
    tally.current = { right: tally.current.right + (ok ? 1 : 0), total: tally.current.total + 1 };
    setScore(tally.current);
    setFlash({ pick });
    setTimeout(() => { setFlash(null); setAt((a) => a + 1); }, FLASH_MS);
  }

  const q = questions[at % questions.length];
  // Подсветка после ответа: верный вариант — акцентом, выбранный неверный — тёплым.
  const tone = (value: string, correct: boolean) =>
    !flash ? "border-line bg-surface hover:border-ink" : correct ? "border-accent bg-accent-soft" : flash.pick === value ? "border-line bg-warn-soft" : "border-line bg-surface opacity-60";

  return (
    <div className="grid gap-10 pb-16">
      <header className="grid gap-3">
        <Link href={back.href} className="mb-1 inline-flex min-h-11 w-fit items-center gap-2 font-medium text-ink-2 hover:text-ink">
          <Icon name="back" /> {back.label}
        </Link>
        <h1 className="m-0 font-display text-[clamp(22px,2.4vw,28px)] font-semibold tracking-[-0.02em]">{title}</h1>
      </header>

      {phase === "idle" && (
        <section className="grid max-w-xl justify-items-start gap-6">
          <p className="m-0 font-display text-[clamp(72px,10vw,128px)] leading-[0.9] font-semibold tracking-[-0.04em] tabular-nums">
            {SECONDS}<span className="text-[0.38em] tracking-normal text-muted"> секунд</span>
          </p>
          <p className="m-0 text-[17px] text-ink-2">Жест — слово и «верно или нет». Отвечайте подряд, сколько успеете.</p>
          {record > 0 && <p className="m-0 font-semibold tabular-nums">Рекорд: {record}</p>}
          <button type="button" onClick={start} className={`${btn.primary} group`}>Начать <Arrow /></button>
        </section>
      )}

      {phase === "run" && (
        <div className="grid gap-8">
          <div className="grid gap-3">
            <div className="flex items-baseline justify-between gap-6">
              <span role="timer" aria-label={`Осталось ${left} с`} className="font-display text-[40px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
              </span>
              <span aria-live="polite" className="text-lg font-semibold tabular-nums">Верно: {score.right}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
              <span className="block h-full origin-left bg-accent transition-transform duration-200 ease-linear" style={{ transform: `scaleX(${left / SECONDS})` }} />
            </div>
          </div>

          <div key={at} className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-8">
            <VideoPlayer src={cards[q.sign].videoUrl} label="Жест для вопроса" autoPlay bleed maskCaption showProgress={false}
              className="lg:max-w-[min(100%,calc((100svh-400px)*16/9))]" />
            {q.type === "recognize" ? (
              <div className="grid gap-4">
                <h2 className={heading}>Что означает этот жест?</h2>
                <div role="group" aria-label="Варианты ответа" className="grid gap-2.5">
                  {q.options.map((o) => (
                    <button key={o} type="button" onClick={() => answer(o === q.sign, o)} className={`${option} ${tone(o, o === q.sign)}`}>{cards[o].title}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <h2 className={heading}>Это «{cards[q.shown].title}»?</h2>
                <div role="group" aria-label="Варианты ответа" className="grid grid-cols-2 gap-2.5">
                  {[true, false].map((v) => (
                    <button key={String(v)} type="button" onClick={() => answer(v === (q.shown === q.sign), String(v))}
                      className={`${option} justify-center ${tone(String(v), v === (q.shown === q.sign))}`}>{v ? "Верно" : "Неверно"}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {phase === "done" && (
        <section aria-live="polite" className="grid max-w-xl justify-items-start gap-6">
          <p className="anim-rise m-0 font-display text-[clamp(72px,10vw,128px)] leading-[0.9] font-semibold tracking-[-0.04em] tabular-nums">
            {score.right}<span className="text-[0.38em] tracking-normal text-muted"> верно</span>
          </p>
          <p className="m-0 text-[17px] text-ink-2 tabular-nums">
            {score.total} {plural(score.total, ["ответ", "ответа", "ответов"])} за минуту · {fresh ? <strong className="text-accent">Новый рекорд!</strong> : `Рекорд: ${record}`}
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={start} className={`${btn.primary} group`}>Ещё раз <Arrow /></button>
            <Link href={back.href} className={btn.ghost}>К категории</Link>
          </div>
        </section>
      )}
    </div>
  );
}
