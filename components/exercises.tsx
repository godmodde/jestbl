"use client";

import { useRef, useState } from "react";

import { Icon } from "@/components/ui";
import { CaptionMask, VideoPlayer } from "@/components/video-player";
import { GRADES, type Grade } from "@/lib/srs";

// Три типа заданий первой версии (ТЗ, п. 19). Ошибка — обычная часть обучения: без красных экранов и наказаний.

export type Status = "idle" | "right" | "wrong";

export function Feedback({ status, onNext, onRetry, nextLabel = "Дальше" }: { status: Status; onNext: () => void; onRetry: () => void; nextLabel?: string }) {
  if (status === "idle") return <div aria-live="polite" />;
  return (
    <div aria-live="polite" className={`anim-pop flex flex-wrap items-center justify-between gap-3 rounded-md px-5 py-4 ${status === "right" ? "bg-accent-soft" : "bg-warn-soft"}`}>
      <p className="m-0 text-[17px] font-medium">
        {status === "right" ? "Верно." : "Пока не совсем. Посмотрите ещё раз на движение."}
      </p>
      {status === "right" ? (
        <button type="button" onClick={onNext} autoFocus className="press min-h-11 rounded-full bg-accent px-6 font-semibold text-white hover:bg-accent-strong">{nextLabel}</button>
      ) : (
        <button type="button" onClick={onRetry} autoFocus className="press min-h-11 rounded-full border-[1.5px] border-ink px-5 font-semibold hover:bg-ink hover:text-paper">Попробовать ещё раз</button>
      )}
    </div>
  );
}

export function optionClass(picked: boolean, status: Status, correct: boolean) {
  if (status === "right" && correct) return "border-accent bg-accent-soft";
  if (status === "wrong" && picked) return "border-line bg-warn-soft text-ink-2";
  return "border-line bg-surface hover:border-ink";
}

/** Тип 1. Узнать жест: видео → «Что означает этот жест?» → один из вариантов. */
export function ExerciseRecognize({ videoUrl, answer, options, onDone, onMistake, onRight, nextLabel, stacked = false, portrait = false, clip }: {
  videoUrl: string | null;
  answer: string;
  options: { slug: string; title: string }[];
  onDone: () => void;
  onMistake?: () => void;
  /** Сразу при верном ответе, до «Дальше»: на главной от него оживает прогресс. */
  onRight?: () => void;
  nextLabel?: string;
  /** Видео над вариантами, а не рядом: для узкой колонки. */
  stacked?: boolean;
  /** Портретный кадр под человека (как на первом экране): вшитая подпись демо-ролика уходит за край, размытие не нужно. */
  portrait?: boolean;
  /** Зациклить один вариант жеста (секунды) — в демо-роликах их несколько подряд. */
  clip?: [number, number];
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const status: Status = picked === null ? "idle" : picked === answer ? "right" : "wrong";
  const reported = useRef(false);

  function pick(slug: string) {
    if (status !== "idle") return;
    setPicked(slug);
    if (slug === answer) onRight?.();
    if (slug !== answer && !reported.current) { reported.current = true; onMistake?.(); }
  }

  return (
    <div className={`grid gap-6 [&>*]:min-w-0 ${portrait ? "sm:grid-cols-2 sm:items-center" : stacked ? "" : "lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-8 2xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]"}`}>
      {portrait ? (
        <VideoPlayer key={attempt} src={videoUrl} label="Жест для задания" autoPlay showProgress={false} slowToggle clip={clip}
          frameClass="aspect-[5/6]" videoClass="signer" className="mx-auto w-full" />
      ) : (
        <VideoPlayer key={attempt} src={videoUrl} label="Жест для задания" autoPlay bleed maskCaption className="lg:max-w-[min(100%,calc((100svh-370px)*16/9))]" />
      )}
      <div className="grid gap-4">
        <h2 tabIndex={-1} className="step-heading m-0 font-display text-[28px] leading-tight font-semibold tracking-[-0.02em] outline-none">Что означает этот жест?</h2>
        <div role="group" aria-label="Варианты ответа" className="grid gap-2.5">
          {options.map((o) => (
            <button key={o.slug} type="button" aria-pressed={picked === o.slug} onClick={() => pick(o.slug)} disabled={status === "right"}
              className={`press flex min-h-14 items-center justify-between rounded-md border-[1.5px] px-5 text-left text-[17px] font-medium ${status === "wrong" && picked === o.slug ? "anim-nudge" : ""} ${optionClass(picked === o.slug, status, o.slug === answer)}`}>
              {o.title}
              {status === "right" && o.slug === answer && <span className="anim-bump grid size-7 place-content-center rounded-full bg-accent text-white"><Icon name="check" size={16} /></span>}
            </button>
          ))}
        </div>
        <Feedback status={status} onNext={onDone} nextLabel={nextLabel} onRetry={() => { setPicked(null); setAttempt((a) => a + 1); }} />
      </div>
    </div>
  );
}

export function VideoChoice({ index, src, picked, status, correct, onPick, label }: {
  index: number; src: string | null; picked: boolean; status: Status; correct: boolean; onPick: () => void;
  /** Подпись кнопки выбора вместо «Вариант N». */
  label?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => (video.current?.paused ? video.current.play().catch(() => {}) : video.current?.pause());
  return (
    <div className={`grid gap-2.5 rounded-md border-[1.5px] p-2.5 transition-colors ${optionClass(picked, status, correct)}`}>
      <div className="relative aspect-video overflow-hidden rounded bg-frame">
        {src ? (
          <video ref={video} src={`${src}#t=0.6`} muted loop playsInline preload="metadata" aria-label={`Вариант ${index + 1}`}
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onClick={toggle}
            className="absolute inset-0 h-full w-full object-contain" />
        ) : null}
        {src && <CaptionMask />}
        {!src && (
          <p className="absolute inset-0 m-0 grid place-content-center p-3 text-center text-sm text-ink-2">Видео появится после съёмки</p>
        )}
      </div>
      <div className="flex gap-2">
        {src && (
          <button type="button" onClick={toggle} aria-label={playing ? `Пауза, вариант ${index + 1}` : `Смотреть вариант ${index + 1}`}
            className="press inline-flex size-11 flex-none items-center justify-center rounded-full border-[1.5px] border-ink hover:bg-ink hover:text-paper">
            <Icon name={playing ? "pause" : "play"} />
          </button>
        )}
        <button type="button" onClick={onPick} aria-pressed={picked} disabled={status === "right"}
          className="press min-h-11 flex-1 rounded-full bg-ink px-4 font-semibold text-paper hover:bg-accent disabled:bg-line disabled:text-muted">
          {label ?? `Вариант ${index + 1}`}
        </button>
      </div>
    </div>
  );
}

/** Тип 2. Найти жест по значению: слово → выбрать правильное видео из нескольких. */
export function ExerciseFindVideo({ title, meaning, answer, options, onDone, onMistake }: {
  title: string;
  meaning: string;
  answer: string;
  options: { slug: string; videoUrl: string | null }[];
  onDone: () => void;
  onMistake?: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const status: Status = picked === null ? "idle" : picked === answer ? "right" : "wrong";
  const reported = useRef(false);
  function pick(slug: string) {
    if (status !== "idle") return;
    setPicked(slug);
    if (slug !== answer && !reported.current) { reported.current = true; onMistake?.(); }
  }
  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5">
        <h2 tabIndex={-1} className="step-heading m-0 font-display text-[28px] leading-tight font-semibold tracking-[-0.02em] outline-none">Найдите жест «{title}»</h2>
        <p className="m-0 text-ink-2">{meaning} Посмотрите варианты и выберите подходящий.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {options.map((o, i) => (
          <VideoChoice key={o.slug} index={i} src={o.videoUrl} picked={picked === o.slug} status={status} correct={o.slug === answer} onPick={() => pick(o.slug)} />
        ))}
      </div>
      <Feedback status={status} onNext={onDone} onRetry={() => setPicked(null)} />
    </div>
  );
}

/** Тип 5. Повторить карточку: вспомнить → открыть ответ → оценить, насколько запомнилось. */
export function ExerciseRecall({ videoUrl, title, meaning, onGrade, busy = false }: {
  videoUrl: string | null;
  title: string;
  meaning: string;
  onGrade: (grade: Grade) => void;
  busy?: boolean;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-8 2xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
      <VideoPlayer src={videoUrl} label="Жест для повторения" autoPlay bleed maskCaption className="lg:max-w-[min(100%,calc((100svh-370px)*16/9))]" />
      <div className="grid gap-4">
        <h2 tabIndex={-1} className="step-heading m-0 font-display text-[28px] leading-tight font-semibold tracking-[-0.02em] outline-none">Вспомните, что означает этот жест</h2>
        {!shown ? (
          <button type="button" onClick={() => setShown(true)} className="press min-h-14 rounded-full bg-ink px-6 text-[17px] font-semibold text-paper hover:bg-accent">
            Показать ответ
          </button>
        ) : (
          <div className="anim-pop grid gap-6">
            <div className="grid gap-1 rounded-md bg-surface px-5 py-4">
              <span className="font-display text-2xl font-semibold tracking-[-0.02em]">{title}</span>
              <span className="text-ink-2">{meaning}</span>
            </div>
            <div className="grid gap-2">
              <p className="m-0 text-sm text-muted">Насколько вы помнили жест?</p>
              <div role="group" aria-label="Оценка" className="grid grid-cols-3 gap-2">
                {GRADES.map((g) => (
                  <button key={g.grade} type="button" disabled={busy} onClick={() => onGrade(g.grade)}
                    className="press min-h-14 rounded-md border-[1.5px] border-line bg-surface px-2 font-semibold hover:border-ink disabled:opacity-60">
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
