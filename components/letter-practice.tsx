"use client";

import Link from "next/link";
import { useState } from "react";

import { CameraCheck } from "@/components/camera-check";
import { ExerciseFindVideo } from "@/components/exercises";
import { TraceCanvas } from "@/components/trace-canvas";
import { Arrow, btn, Icon } from "@/components/ui";
import { send } from "@/lib/client-api";
import type { Templates } from "@/lib/handshape";

// Практика и проверка буквы (ТЗ, п. 5): обведение печатной буквы — отдельная задача, проверка жеста — камерой
// или выбором видео без подсказки. Задачи не смешиваем.

type Tab = "trace" | "check";

export function LetterPractice({ letter, slug, options, templates, next }: {
  letter: string;
  slug: string;
  /** Видео для проверки без камеры: эта буква и соседние из группы. */
  options: { slug: string; videoUrl: string | null }[];
  templates: Templates | null;
  next: { slug: string; title: string } | null;
}) {
  const [tab, setTab] = useState<Tab>("trace");
  const [upper, setUpper] = useState(true);
  const [traced, setTraced] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<"camera" | "choice">(templates ? "camera" : "choice");
  const [passed, setPassed] = useState(false);
  const [round, setRound] = useState(0);
  const glyph = upper ? letter : letter.toLowerCase();

  const grade = (ok: boolean) => void send(`/signs/${slug}/review`, "POST", { grade: ok ? "good" : "again" });
  const tabClass = "inline-flex min-h-12 items-center gap-2 rounded-full px-5 font-semibold transition-colors aria-selected:bg-ink aria-selected:text-paper hover:bg-track aria-selected:hover:bg-ink";

  return (
    <div className="grid gap-6">
      <div role="tablist" aria-label="Что делаем" className="flex w-fit gap-1 rounded-full bg-track p-1">
        <button type="button" role="tab" aria-selected={tab === "trace"} onClick={() => setTab("trace")} className={tabClass}>Обвести</button>
        <button type="button" role="tab" aria-selected={tab === "check"} onClick={() => setTab("check")} className={tabClass}>Проверить себя</button>
      </div>

      {tab === "trace" ? (
        <div role="tabpanel" aria-label="Обвести" className="grid gap-5">
          <div role="group" aria-label="Заглавная или строчная" className="flex gap-2">
            {[true, false].map((u) => (
              <button key={String(u)} type="button" aria-pressed={upper === u} onClick={() => setUpper(u)}
                className="grid size-14 place-content-center rounded-full border-[1.5px] border-line font-display text-2xl font-semibold transition-colors hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper">
                {u ? letter : letter.toLowerCase()}
                {traced[u ? letter : letter.toLowerCase()] && <span className="sr-only"> — обведена</span>}
              </button>
            ))}
          </div>
          <div className="w-full max-w-[min(100%,calc((100svh-330px)*100/140))]">
            <TraceCanvas key={glyph} letter={glyph} onDone={() => setTraced((t) => ({ ...t, [glyph]: true }))}
              onSkip={() => setTraced((t) => ({ ...t, [glyph]: true }))} />
          </div>
          {traced[glyph] && (
            <div aria-live="polite" className="anim-pop flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 font-semibold text-accent"><Icon name="check" /> Получилось</span>
              {upper && !traced[letter.toLowerCase()]
                ? <button type="button" onClick={() => setUpper(false)} className={btn.ghost}>Теперь строчную {letter.toLowerCase()}</button>
                : <button type="button" onClick={() => setTab("check")} className={btn.primarySm}>Проверить жест <Arrow /></button>}
            </div>
          )}
        </div>
      ) : !options.length ? (
        <p role="tabpanel" aria-label="Проверить себя" className="m-0 max-w-[48ch] rounded-md bg-surface p-5 text-ink-2">Проверка появится вместе с видео буквы.</p>
      ) : passed ? (
        <div role="tabpanel" aria-label="Проверить себя" aria-live="polite" className="anim-pop grid content-start gap-4 rounded-md bg-accent-soft p-5">
          <p className="m-0 flex items-center gap-3 font-display text-[28px] font-semibold tracking-[-0.02em]"><Icon name="check" size={28} /> Буква {letter} изучена</p>
          <div className="flex flex-wrap gap-3">
            {next && <Link href={`/alphabet/${next.slug}`} className={btn.primary}>Буква {next.title} <Arrow /></Link>}
            <button type="button" onClick={() => { setPassed(false); setRound((r) => r + 1); }} className={btn.ghost}>Ещё раз</button>
          </div>
        </div>
      ) : (
        <div role="tabpanel" aria-label="Проверить себя" className="grid gap-5">
          {templates && (
            <div role="group" aria-label="Как проверяем" className="flex gap-2">
              {(["camera", "choice"] as const).map((m) => (
                <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
                  className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-line px-4 font-medium transition-colors hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper">
                  {m === "camera" ? "Камерой" : "Без камеры"}
                </button>
              ))}
            </div>
          )}
          {mode === "camera" && templates ? (
            <CameraCheck key={round} letter={letter} templates={templates} onNoCamera={() => setMode("choice")}
              onResult={(ok) => { grade(ok); if (ok) setPassed(true); }} />
          ) : (
            <>
              <ExerciseFindVideo key={round} title={letter} meaning="Какое видео показывает эту букву?" answer={slug} options={options}
                onMistake={() => grade(false)} onDone={() => { grade(true); setPassed(true); }} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
