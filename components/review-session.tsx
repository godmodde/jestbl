"use client";

import Link from "next/link";
import { useState } from "react";

import { ExerciseRecall } from "@/components/exercises";
import { Arrow, btn } from "@/components/ui";
import { send } from "@/lib/client-api";
import { plural } from "@/lib/plural";
import { GRADES, type Grade } from "@/lib/srs";

type Card = { slug: string; title: string; meaning: string; videoUrl: string | null };

// Повторение одним действием (ТЗ, п. 22): без серий, наград и давления.
export function ReviewSession({ cards }: { cards: Card[] }) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [tally, setTally] = useState<Record<Grade, number>>({ again: 0, hard: 0, good: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  if (cards.length === 0) {
    return (
      <div className="grid max-w-2xl gap-5">
        <h1 className="m-0 font-display text-[clamp(32px,4vw,48px)] leading-[1.05] font-semibold tracking-[-0.03em]">На сегодня всё</h1>
        <p className="m-0 text-[17px] text-ink-2">Жесты из уроков вернутся сюда сами.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/learn" className={`${btn.primary} group`}>К обучению <Arrow /></Link>
          <Link href="/dictionary?tab=learned" className={btn.ghost}>Изученные жесты</Link>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="grid max-w-2xl gap-5">
        <div className="grid gap-2">
          <span className="text-[13px] font-semibold tracking-[0.08em] text-muted uppercase">Сегодня стоит повторить</span>
          <h1 className="m-0 font-display text-[clamp(36px,5vw,56px)] leading-none font-semibold tracking-[-0.03em] tabular-nums">
            {cards.length} {plural(cards.length, ["жест", "жеста", "жестов"])}
          </h1>
        </div>
        <p className="m-0 text-[17px] text-ink-2">Вспомните значение, потом откройте ответ.</p>
        <button type="button" onClick={() => setStarted(true)} className={`${btn.primary} group w-fit`}>Начать повторение <Arrow /></button>
      </div>
    );
  }

  if (index >= cards.length) {
    return (
      <div className="anim-pop grid max-w-2xl gap-5">
        <h1 className="m-0 font-display text-[clamp(32px,4vw,48px)] leading-[1.05] font-semibold tracking-[-0.03em]">Повторение закончено</h1>
        <ul className="m-0 grid list-none gap-1 p-0 text-[17px]">
          {GRADES.map((g) => <li key={g.grade}>{g.label}: <span className="font-semibold tabular-nums">{tally[g.grade]}</span></li>)}
        </ul>
        <p className="m-0 text-ink-2">Забытые жесты вернутся через несколько минут, остальные — через несколько дней.</p>
        <Link href="/learn" className={`${btn.primary} group w-fit`}>К обучению <Arrow /></Link>
      </div>
    );
  }

  const card = cards[index];
  async function onGrade(grade: Grade) {
    setBusy(true);
    const ok = await send(`/signs/${card.slug}/review`, "POST", { grade });
    setBusy(false);
    setError(!ok);
    if (!ok) return;
    setTally((t) => ({ ...t, [grade]: t[grade] + 1 }));
    setIndex((i) => i + 1);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm text-muted tabular-nums">Карточка {index + 1} из {cards.length}</span>
        <div className="h-1 w-40 overflow-hidden rounded-sm bg-line" aria-hidden="true"><span className="block h-full bg-accent" style={{ width: `${(index / cards.length) * 100}%` }} /></div>
      </div>
      <ExerciseRecall key={card.slug} videoUrl={card.videoUrl} title={card.title} meaning={card.meaning} onGrade={onGrade} busy={busy} />
      {error && <p role="status" className="m-0 rounded-md bg-warn-soft px-4 py-3 text-sm">Оценка не сохранилась — проверьте соединение и нажмите ещё раз.</p>}
    </div>
  );
}
