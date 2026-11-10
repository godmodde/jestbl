import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Arrow, ButtonLink, Icon } from "@/components/ui";
import { VideoPlayer } from "@/components/video-player";
import { currentDevice } from "@/lib/device-server";
import { getLetter } from "@/lib/directions";

type Params = { params: Promise<{ letter: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const data = await getLetter(null, (await params).letter);
  return { title: data ? `Буква ${data.letter.title}` : "Алфавит" };
}

const STATUS = { new: "Не изучена", learned: "Изучена", review: "Пора повторить" };

export default async function LetterPage({ params }: Params) {
  const data = await getLetter(await currentDevice(), (await params).letter);
  if (!data) notFound();
  const { letter, group, prev, next } = data;
  const nav = "inline-flex size-12 items-center justify-center rounded-full border-[1.5px] border-line transition-colors hover:border-ink";

  return (
    <div className="grid gap-10 pt-4 lg:gap-14">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/alphabet" className="inline-flex min-h-11 items-center gap-2 font-medium text-ink-2 hover:text-ink"><Icon name="back" /> Алфавит · {group.title}</Link>
        <nav aria-label="Соседние буквы" className="flex gap-2">
          {prev ? <Link href={`/alphabet/${prev.slug}`} aria-label={`Буква ${prev.title}`} className={nav}><Icon name="back" /></Link> : null}
          {next ? <Link href={`/alphabet/${next.slug}`} aria-label={`Буква ${next.title}`} className={`${nav} [&_svg]:rotate-180`}><Icon name="back" /></Link> : null}
        </nav>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-start lg:gap-12">
        <div className="grid gap-6">
          <div className="flex items-end gap-4">
            <h1 className="m-0 font-display text-[clamp(96px,11vw,168px)] leading-[0.8] font-semibold tracking-[-0.05em]">
              {letter.title}<span className="text-[0.55em] text-muted">{letter.title.toLowerCase()}</span>
            </h1>
            <span className={`mb-2 rounded-full px-3 py-1 text-sm font-semibold ${letter.status === "learned" ? "bg-accent-soft text-accent" : letter.status === "review" ? "bg-warn-soft" : "bg-track text-ink-2"}`}>{STATUS[letter.status]}</span>
          </div>
          <VideoPlayer src={letter.videoUrl} label={`Буква ${letter.title} дактилем`} autoPlay source={letter.sourceUrl}
            className="lg:max-w-[min(100%,calc((100svh-420px)*16/9))]" />
        </div>
        {/* Взрослым — ролики и выбор ответа (решение заказчика 2026-11-10): проверка — тестом группы, без подсказок.
            Обводка и камера — в детском алфавите. */}
        <aside className="grid content-start gap-4 rounded-md bg-surface p-5">
          <h2 className="m-0 font-display text-2xl font-semibold tracking-[-0.02em]">Проверьте себя</h2>
          <p className="m-0 text-ink-2">Тест по группе «{group.title}»: жест — буква и буква — жест.</p>
          <ButtonLink href={`/alphabet/check/${group.slug}`} variant="primarySm" className="w-fit">Пройти тест <Arrow /></ButtonLink>
        </aside>
      </div>
    </div>
  );
}
