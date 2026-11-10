"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { ExerciseRecall, ExerciseRecognize, Feedback, optionClass, VideoChoice, type Status } from "@/components/exercises";
import { Arrow, btn, Icon } from "@/components/ui";
import { VideoPlayer } from "@/components/video-player";
import { send } from "@/lib/client-api";
import { explanation, recommend, scoreExam, targets, type ExamResult, type Question } from "@/lib/exam";
import { plural } from "@/lib/plural";

// Практика и экзамен по категории (ТЗ, п. 5). Практика сразу объясняет ошибку и даёт попробовать снова;
// экзамен правильный ответ не показывает и подводит итог в конце, без таймера.

export type Card = { title: string; meaning: string; videoUrl: string | null; kind: string };
type Mode = "exam" | "practice";

const heading = "step-heading m-0 font-display text-[28px] leading-tight font-semibold tracking-[-0.02em] outline-none";
const split = "grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-8 2xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]";

/** Экзамен: ответ можно поменять до «Дальше», верный не подсвечивается. */
function Accepted({ ready, onNext, last }: { ready: boolean; onNext: () => void; last: boolean }) {
  return (
    <div aria-live="polite" className="flex min-h-14 flex-wrap items-center justify-between gap-3">
      <span className="text-ink-2">{ready ? "Ответ можно поменять до перехода дальше." : "Выберите ответ."}</span>
      <button type="button" disabled={!ready} onClick={onNext} className={`${btn.primarySm} disabled:bg-line disabled:text-muted`}>
        {last ? "Завершить" : "Дальше"} <Arrow />
      </button>
    </div>
  );
}

function ExamChoice({ q, cards, onAnswer, last }: { q: Extract<Question, { options: string[] }>; cards: Record<string, Card>; onAnswer: (ok: boolean) => void; last: boolean }) {
  const [picked, setPicked] = useState<string | null>(null);
  const card = cards[q.sign];
  const next = () => onAnswer(picked === q.sign);
  if (q.type === "recognize" || q.type === "explain") {
    return (
      <div className={split}>
        <VideoPlayer src={card.videoUrl} label="Жест для вопроса" autoPlay bleed maskCaption className="lg:max-w-[min(100%,calc((100svh-370px)*16/9))]" />
        <div className="grid gap-4">
          <h2 tabIndex={-1} className={heading}>Что означает этот жест?</h2>
          <div role="group" aria-label="Варианты ответа" className="grid gap-2.5">
            {q.options.map((o) => (
              <button key={o} type="button" aria-pressed={picked === o} onClick={() => setPicked(o)}
                className="flex min-h-14 items-center rounded-md border-[1.5px] border-line bg-surface px-5 text-left text-[17px] font-medium transition-colors hover:border-ink aria-pressed:border-ink aria-pressed:bg-track">
                {q.type === "explain" ? explanation(cards[o]) : cards[o].title}
              </button>
            ))}
          </div>
          <Accepted ready={!!picked} onNext={next} last={last} />
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-6">
      <VideoPrompt q={q} card={card} />
      <div className="grid gap-4 md:grid-cols-3">
        {q.options.map((o, i) => (
          <VideoChoice key={o} index={i} src={cards[o].videoUrl} picked={picked === o} status="idle" correct={false} onPick={() => setPicked(o)} />
        ))}
      </div>
      <Accepted ready={!!picked} onNext={next} last={last} />
    </div>
  );
}

/** «Верно или нет»: под жестом слово — правильно ли подписан жест. Экзамен ответ не показывает, практика разбирает сразу. */
function TrueFalse({ q, cards, mode, onAnswer, onMistake, last }: {
  q: Extract<Question, { type: "truefalse" }>; cards: Record<string, Card>; mode: Mode;
  onAnswer: (ok: boolean) => void; onMistake: () => void; last: boolean;
}) {
  const [picked, setPicked] = useState<boolean | null>(null);
  const truth = q.shown === q.sign;
  const status: Status = mode === "exam" || picked === null ? "idle" : picked === truth ? "right" : "wrong";
  const reported = useRef(false);
  function pick(v: boolean) {
    if (mode === "practice" && status !== "idle") return;
    setPicked(v);
    if (mode === "practice" && v !== truth && !reported.current) { reported.current = true; onMistake(); }
  }
  return (
    <div className={split}>
      <VideoPlayer src={cards[q.sign].videoUrl} label="Жест для вопроса" autoPlay bleed maskCaption className="lg:max-w-[min(100%,calc((100svh-370px)*16/9))]" />
      <div className="grid gap-4">
        <h2 tabIndex={-1} className={heading}>Это «{cards[q.shown].title}»?</h2>
        <div role="group" aria-label="Варианты ответа" className="grid grid-cols-2 gap-2.5">
          {[true, false].map((v) => (
            <button key={String(v)} type="button" aria-pressed={picked === v} onClick={() => pick(v)} disabled={status === "right"}
              className={`press flex min-h-14 items-center justify-center rounded-md border-[1.5px] px-5 text-[17px] font-medium ${mode === "exam"
                ? "border-line bg-surface hover:border-ink aria-pressed:border-ink aria-pressed:bg-track" : optionClass(picked === v, status, v === truth)}`}>
              {v ? "Верно" : "Неверно"}
            </button>
          ))}
        </div>
        {mode === "exam"
          ? <Accepted ready={picked !== null} onNext={() => onAnswer(picked === truth)} last={last} />
          : <Feedback status={status} onNext={() => onAnswer(true)} onRetry={() => setPicked(null)} nextLabel={last ? "Завершить" : "Дальше"} />}
      </div>
    </div>
  );
}

function VideoPrompt({ q, card }: { q: Question; card: Card }) {
  if (q.type === "meaning") {
    return (
      <div className="grid gap-1.5">
        <h2 tabIndex={-1} className={heading}>Какой жест это означает?</h2>
        <p className="m-0 max-w-[60ch] text-[17px] text-ink-2">«{card.meaning}»</p>
      </div>
    );
  }
  return (
    <div className="grid gap-1.5">
      <h2 tabIndex={-1} className={heading}>Найдите жест «{card.title}»</h2>
      {q.type === "similar" && <p className="m-0 text-ink-2">Среди вариантов есть похожий жест.</p>}
    </div>
  );
}

function PracticeFind({ q, cards, onDone, onMistake }: { q: Extract<Question, { options: string[] }>; cards: Record<string, Card>; onDone: () => void; onMistake: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const status: Status = picked === null ? "idle" : picked === q.sign ? "right" : "wrong";
  const reported = useRef(false);
  const pick = (o: string) => {
    if (status !== "idle") return;
    setPicked(o);
    if (o !== q.sign && !reported.current) { reported.current = true; onMistake(); }
  };
  return (
    <div className="grid gap-6">
      <VideoPrompt q={q} card={cards[q.sign]} />
      <div className="grid gap-4 md:grid-cols-3">
        {q.options.map((o, i) => (
          <VideoChoice key={o} index={i} src={cards[o].videoUrl} picked={picked === o} status={status} correct={o === q.sign} onPick={() => pick(o)} />
        ))}
      </div>
      <Feedback status={status} onNext={onDone} onRetry={() => setPicked(null)} />
    </div>
  );
}

/** Сопоставление: у каждого видео — свой выбор из трёх слов. Без перетаскивания: работает пальцем и с клавиатуры. */
function Match({ q, cards, mode, onDone, onMistake, last }: {
  q: Extract<Question, { type: "match" }>; cards: Record<string, Card>; mode: Mode;
  onDone: (wrong: string[]) => void; onMistake: () => void; last: boolean;
}) {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const wrong = q.signs.filter((s) => picks[s] !== s);
  const complete = q.signs.every((s) => picks[s]);
  const reported = useRef(false);
  function check() {
    if (mode === "exam") return onDone(wrong);
    setChecked(true);
    if (wrong.length && !reported.current) { reported.current = true; onMistake(); }
  }
  const status: Status = !checked ? "idle" : wrong.length ? "wrong" : "right";
  return (
    <div className="grid gap-6">
      <h2 tabIndex={-1} className={heading}>Соедините жесты со словами</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {q.signs.map((s, i) => {
          const verdict = checked ? (picks[s] === s ? "right" : "wrong") : "idle";
          return (
            <div key={s} className={`grid gap-3 rounded-md border-[1.5px] p-3 transition-colors ${optionClass(verdict === "wrong", verdict === "right" ? "right" : verdict === "wrong" ? "wrong" : "idle", verdict === "right")}`}>
              <VideoPlayer src={cards[s].videoUrl} label={`Видео ${i + 1}`} maskCaption showProgress={false} />
              <div role="radiogroup" aria-label={`Что показывает видео ${i + 1}`} className="grid gap-1.5">
                {q.order.map((w) => (
                  <button key={w} type="button" role="radio" aria-checked={picks[s] === w} disabled={status === "right"}
                    onClick={() => { setPicks((p) => ({ ...p, [s]: w })); setChecked(false); }}
                    className="min-h-11 rounded-full border-[1.5px] border-line px-4 text-left font-medium transition-colors hover:border-ink aria-checked:border-ink aria-checked:bg-ink aria-checked:text-paper">
                    {cards[w].title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {mode === "practice" && checked ? (
        <Feedback status={status} onNext={() => onDone([])} onRetry={() => { setChecked(false); setPicks((p) => Object.fromEntries(Object.entries(p).filter(([k, v]) => k === v))); }} />
      ) : mode === "practice" ? (
        <button type="button" disabled={!complete} onClick={check} className={`${btn.primarySm} w-fit disabled:bg-line disabled:text-muted`}>Проверить</button>
      ) : (
        <Accepted ready={complete} onNext={check} last={last} />
      )}
    </div>
  );
}

function Segments({ total, at }: { total: number; at: number }) {
  return (
    <div className="grid gap-2">
      <ol aria-hidden="true" className="m-0 flex list-none gap-1 p-0">
        {Array.from({ length: total }, (_, i) => (
          <li key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < at ? "bg-accent" : i === at ? "bg-ink" : "bg-line"}`} />
        ))}
      </ol>
      <span className="text-sm text-muted tabular-nums">Вопрос {Math.min(at + 1, total)} из {total}</span>
    </div>
  );
}

export function ExamRunner({ title, mode, questions, cards, save, back, next, kindTitles }: {
  title: string;
  mode: Mode;
  questions: Question[];
  cards: Record<string, Card>;
  save: { category: string } | { lesson: string } | null;
  back: { href: string; label: string };
  next: { href: string; title: string } | null;
  kindTitles: Record<string, string>;
}) {
  const [at, setAt] = useState(0);
  const [result, setResult] = useState<ExamResult | null>(null);
  const wrong = useRef(new Set<string>());

  function advance() {
    if (at + 1 < questions.length) return setAt(at + 1);
    const kinds = Object.fromEntries(Object.entries(cards).map(([slug, c]) => [slug, c.kind]));
    const r = scoreExam(questions, wrong.current, kinds);
    setResult(r);
    if (save) {
      const passed = questions.flatMap(targets).filter((s) => !wrong.current.has(s));
      void send("/exams", "POST", { ...save, total: r.total, correct: r.correct, mistakes: r.mistakes, passed });
    }
  }
  const miss = (slugs: string[]) => slugs.forEach((s) => wrong.current.add(s));

  if (result) return <Result title={title} result={result} cards={cards} mode={mode} back={back} next={next} kindTitles={kindTitles} />;

  const q = questions[at];
  const last = at + 1 === questions.length;
  return (
    <div className="grid gap-10 pb-16">
      <header className="grid gap-3">
        <Link href={back.href} className="mb-1 inline-flex min-h-11 w-fit items-center gap-2 font-medium text-ink-2 hover:text-ink">
          <Icon name="back" /> {back.label}
        </Link>
        <h1 className="m-0 font-display text-[clamp(22px,2.4vw,28px)] font-semibold tracking-[-0.02em]">{title}</h1>
        <Segments total={questions.length} at={at} />
      </header>
      <div key={at} className="anim-pop">
        {q.type === "match" ? (
          <Match q={q} cards={cards} mode={mode} last={last} onMistake={() => miss(q.signs)} onDone={(w) => { miss(w); advance(); }} />
        ) : q.type === "recall" ? (
          <ExerciseRecall videoUrl={cards[q.sign].videoUrl} title={cards[q.sign].title} meaning={cards[q.sign].meaning}
            onGrade={(g) => { if (g === "again") miss([q.sign]); void send(`/signs/${q.sign}/review`, "POST", { grade: g }); advance(); }} />
        ) : q.type === "truefalse" ? (
          <TrueFalse q={q} cards={cards} mode={mode} last={last} onMistake={() => miss([q.sign])} onAnswer={(ok) => { if (!ok) miss([q.sign]); advance(); }} />
        ) : mode === "exam" ? (
          <ExamChoice q={q} cards={cards} last={last} onAnswer={(ok) => { if (!ok) miss([q.sign]); advance(); }} />
        ) : q.type === "recognize" || q.type === "explain" ? (
          <ExerciseRecognize videoUrl={cards[q.sign].videoUrl} answer={q.sign}
            options={q.options.map((o) => ({ slug: o, title: q.type === "explain" ? explanation(cards[o]) : cards[o].title }))}
            onMistake={() => miss([q.sign])} onDone={advance} nextLabel={last ? "Завершить" : "Дальше"} />
        ) : (
          <PracticeFind q={q} cards={cards} onMistake={() => miss([q.sign])} onDone={advance} />
        )}
      </div>
    </div>
  );
}

function Result({ title, result, cards, mode, back, next, kindTitles }: {
  title: string; result: ExamResult; cards: Record<string, Card>; mode: Mode;
  back: { href: string; label: string }; next: { href: string; title: string } | null; kindTitles: Record<string, string>;
}) {
  const score = Math.round((result.correct / result.total) * 100);
  const advice = recommend(result, next ? { slug: next.href, title: next.title } : null);
  return (
    <section aria-labelledby="result" className="grid gap-12 pb-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-20">
      <div className="anim-rise grid content-start gap-4">
        <p className="m-0 text-ink-2">{title}</p>
        <h1 id="result" className="m-0 font-display text-[clamp(72px,10vw,128px)] leading-[0.9] font-semibold tracking-[-0.04em] tabular-nums">
          {score}<span className="text-[0.45em] tracking-normal text-muted">%</span>
        </h1>
        <p className="m-0 text-[20px] tabular-nums">{result.correct} из {result.total} верно</p>
        {result.byKind.length > 0 && (
          <dl className="m-0 mt-4 grid gap-2">
            {result.byKind.map((k) => (
              <div key={k.kind} className="flex max-w-sm items-baseline justify-between gap-6 border-b border-line pb-2">
                <dt>{kindTitles[k.kind] ?? kindTitles.other}</dt>
                <dd className="m-0 text-ink-2 tabular-nums">{k.wrong} {plural(k.wrong, ["ошибка", "ошибки", "ошибок"])} из {k.total}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="anim-rise delay-1 grid content-start gap-8">
        <div className="grid gap-4 rounded-md bg-surface p-[clamp(20px,2.5vw,32px)]">
          {advice.kind === "review" ? (
            <>
              <h2 className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">Стоит повторить</h2>
              {mode === "exam" && <p className="m-0 text-ink-2">Жесты с ошибками уже в повторении.</p>}
              <Link href="/review" className={`${btn.primary} w-fit`}>Повторить {advice.count} {plural(advice.count, ["жест", "жеста", "жестов"])} <Arrow /></Link>
            </>
          ) : advice.kind === "next" ? (
            <>
              <h2 className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">Можно двигаться дальше</h2>
              <p className="m-0 text-ink-2">Категория освоена. Попробуйте «{advice.title}».</p>
              <Link href={advice.slug} className={`${btn.primary} w-fit`}>{advice.title} <Arrow /></Link>
            </>
          ) : (
            <>
              <h2 className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">Категория освоена</h2>
              <Link href={back.href} className={`${btn.primary} w-fit`}>{back.label}</Link>
            </>
          )}
        </div>

        {result.mistakes.length > 0 && (
          <div className="grid gap-4">
            <h2 className="m-0 text-[17px] font-semibold">Где были ошибки</h2>
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 p-0">
              {result.mistakes.map((s) => (
                <li key={s}>
                  {/* Кадр-заставка и название: полный плеер со скоростью — в карточке словаря. */}
                  <Link href={`/dictionary/${s}`} className="group grid gap-2 font-semibold">
                    <span className="relative block aspect-video overflow-hidden rounded bg-frame">
                      {cards[s].videoUrl && <video src={`${cards[s].videoUrl}#t=1.2`} muted playsInline preload="metadata" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />}
                    </span>
                    <span className="underline-offset-4 group-hover:underline">{cards[s].title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => location.reload()} className={btn.ghost}>{mode === "exam" ? "Пройти экзамен ещё раз" : "Ещё практика"}</button>
          <Link href={back.href} className={btn.soft}>{back.label}</Link>
        </div>
      </div>
    </section>
  );
}
