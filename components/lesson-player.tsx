"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ExerciseFindVideo, ExerciseRecall, ExerciseRecognize } from "@/components/exercises";
import { SignActions } from "@/components/sign-actions";
import { SignCard } from "@/components/sign-card";
import { Arrow, Icon, btn } from "@/components/ui";
import { VideoPlayer } from "@/components/video-player";
import { send } from "@/lib/client-api";
import type { LessonSign } from "@/lib/data";
import { STAGE, type Step } from "@/lib/lesson-plan";
import type { Grade } from "@/lib/srs";

type Props = {
  lesson: { slug: string; title: string; position: number; topicTitle: string };
  signs: LessonSign[];
  pool: Record<string, { title: string; videoUrl: string | null }>;
  steps: Step[];
  initialStep: number;
  next: { slug: string; title: string } | null;
};

const STAGES = [
  { n: 1, label: "Смотрим" },
  { n: 2, label: "Разбираем" },
  { n: 3, label: "Пробуем" },
];

// Урок — одно занятие из трёх этапов, а не три страницы (ТЗ, ч. III): видео и данные жеста остаются под рукой.
export function LessonPlayer({ lesson, signs, pool, steps, initialStep, next }: Props) {
  const [index, setIndex] = useState(initialStep);
  const [finished, setFinished] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  // Сохранения идут строго по очереди: иначе сервер может принять их не по порядку и записать более ранний шаг.
  const saving = useRef<Promise<unknown>>(Promise.resolve());

  const step = steps[index];
  const sign = signs[step.sign];
  const practiceStart = signs.length * 3;

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    root.current?.scrollIntoView({ block: "start" });
    root.current?.querySelector<HTMLElement>(".step-heading")?.focus({ preventScroll: true });
  }, [index, finished]);

  function save(stepNumber: number, completed = false) {
    saving.current = saving.current.then(async () =>
      setSaveError(!(await send(`/lessons/${lesson.slug}/progress`, "PUT", { step: stepNumber, completed }))));
  }

  function go(to: number) {
    if (to >= steps.length) {
      setFinished(true);
      save(steps.length, true);
      return;
    }
    setIndex(to);
    save(to);
  }

  const grade = (slug: string, g: Grade) => send(`/signs/${slug}/review`, "POST", { grade: g });

  async function onRecallGrade(g: Grade) {
    setBusy(true);
    await grade(sign.slug, g);
    setBusy(false);
    go(index + 1);
  }

  const stage = finished ? 4 : STAGE[step.kind];
  const where = finished ? "" : index < practiceStart ? `Жест ${step.sign + 1} из ${signs.length}` : `Практика ${index - practiceStart + 1} из ${signs.length}`;
  const progress = finished ? 1 : index / steps.length;

  return (
    <div ref={root} className="grid scroll-mt-4 gap-12 pb-16">
      <header className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/learn" className="inline-flex min-h-11 items-center gap-2 font-medium hover:text-accent">
            <Icon name="back" /> К обучению
          </Link>
          <span className="text-sm text-muted">{lesson.topicTitle} · урок {lesson.position}</span>
        </div>
        <div className="grid gap-5">
          <h1 className="m-0 font-display text-[clamp(28px,4vw,40px)] leading-[1.08] font-semibold tracking-[-0.03em]">{lesson.title}</h1>
          <div className="h-1 overflow-hidden rounded-sm bg-line" role="progressbar" aria-label="Прогресс урока" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
            <span className="block h-full bg-accent transition-[width] duration-300 ease-out" style={{ width: `${progress * 100}%` }} />
          </div>
          <ol className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 text-sm">
            {STAGES.map((s) => (
              <li key={s.n} aria-current={stage === s.n ? "step" : undefined}
                className={stage === s.n ? "font-semibold text-ink" : stage > s.n ? "text-ink-2" : "text-muted"}>
                <span className="tabular-nums">0{s.n}</span> — {s.label}
              </li>
            ))}
            {where && <li className="ml-auto text-muted tabular-nums">{where}</li>}
          </ol>
        </div>
      </header>

      {finished ? (
        <section className="anim-pop grid max-w-2xl gap-6">
          <h2 tabIndex={-1} className="step-heading m-0 font-display text-[32px] leading-tight font-semibold tracking-[-0.02em] outline-none">Урок пройден</h2>
          <p className="m-0 text-[17px] text-ink-2">
            Жесты урока добавлены в повторение. Те, что запомнились хуже, вернутся раньше — платформа сама напомнит.
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {signs.map((s) => (
              <li key={s.slug}>
                <Link href={`/dictionary/${s.slug}`} className="inline-flex min-h-11 items-center rounded-full bg-surface px-4 font-medium hover:bg-track">{s.title}</Link>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            {next ? (
              <Link href={`/learn/${next.slug}`} className={`${btn.primary} group`}>Следующий урок: {next.title} <Arrow /></Link>
            ) : (
              <Link href="/review" className={`${btn.primary} group`}>Перейти к повторению <Arrow /></Link>
            )}
            <Link href="/learn" className={btn.ghost}>К обучению</Link>
          </div>
        </section>
      ) : (
        <section key={index} className="anim-pop grid gap-10">
          {step.kind === "watch" && (
            <div className="grid gap-4">
              <h2 tabIndex={-1} className="step-heading m-0 font-display text-[28px] leading-tight font-semibold tracking-[-0.02em] outline-none">
                Посмотрите жест «{sign.title}»
              </h2>
              <VideoPlayer key={sign.slug} src={sign.videoUrl} label={`Жест «${sign.title}»`} autoPlay framed bleed source={sign.sourceUrl}
                className="w-full lg:max-w-[min(100%,calc((100svh-370px)*16/9))]"
                caption={<p className="m-0 text-ink-2">Если быстро — включите 0,5×.</p>} />
            </div>
          )}

          {step.kind === "analyze" && (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:items-start 2xl:grid-cols-[minmax(0,1fr)_minmax(0,600px)]">
              <VideoPlayer key={sign.slug} src={sign.videoUrl} label={`Жест «${sign.title}»`} bleed source={sign.sourceUrl} className="lg:max-w-[min(100%,calc((100svh-370px)*16/9))]" />
              <div className="grid gap-2">
                <span tabIndex={-1} className="step-heading sr-only">Разбираем жест «{sign.title}»</span>
                <SignCard sign={sign} similar={sign.similar}
                  actions={<SignActions key={sign.slug} slug={sign.slug} favorite={sign.state.favorite} inReview={sign.state.inReview} />} />
              </div>
            </div>
          )}

          {step.kind === "check" && (
            <ExerciseRecognize
              videoUrl={sign.videoUrl}
              answer={sign.slug}
              options={step.options.map((slug) => ({ slug, title: pool[slug]?.title ?? slug }))}
              onDone={() => go(index + 1)}
              onMistake={() => grade(sign.slug, "again")}
            />
          )}

          {step.kind === "find" && (
            <ExerciseFindVideo
              title={sign.title}
              meaning={sign.meaning}
              answer={sign.slug}
              options={step.options.map((slug) => ({ slug, videoUrl: pool[slug]?.videoUrl ?? null }))}
              onDone={() => go(index + 1)}
              onMistake={() => grade(sign.slug, "again")}
            />
          )}

          {step.kind === "recall" && (
            <ExerciseRecall key={sign.slug} videoUrl={sign.videoUrl} title={sign.title} meaning={sign.meaning} onGrade={onRecallGrade} busy={busy} />
          )}

          <nav aria-label="Шаги урока" className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <button type="button" onClick={() => go(Math.max(0, index - 1))} disabled={index === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-medium hover:text-accent disabled:invisible">
              <Icon name="back" /> Назад
            </button>
            {step.kind === "watch" && (
              <button type="button" onClick={() => go(index + 1)} className={`${btn.primarySm} group`}>Разобрать жест <Arrow /></button>
            )}
            {step.kind === "analyze" && (
              <button type="button" onClick={() => go(index + 1)} className={`${btn.primarySm} group`}>Проверить себя <Arrow /></button>
            )}
          </nav>
        </section>
      )}

      {saveError && (
        <p role="status" className="m-0 rounded-md bg-warn-soft px-4 py-3 text-sm">
          Прогресс не сохранился — проверьте соединение. Урок можно продолжать: сохраним на следующем шаге.
        </p>
      )}
    </div>
  );
}
