import type { Metadata } from "next";
import Link from "next/link";

import { Icon } from "@/components/ui";
import { getLearnHome } from "@/lib/data";
import { currentDevice } from "@/lib/device-server";
import { getLibrary, KIND_TITLES } from "@/lib/directions";

export const metadata: Metadata = { title: "Взрослым" };

// Направление «Взрослым» (ТЗ, п. 5): курс по порядку и библиотека категорий — по сферам, по типу, по алфавиту.
export default async function AdultsPage() {
  const device = await currentDevice();
  const [{ topics }, { categories, kinds, all }] = await Promise.all([getLearnHome(device), getLibrary(device)]);
  const topic = topics.find((t) => t.status === "open") ?? topics[0];
  const later = topics.filter((t) => t.status === "soon");
  // Первая — «Все слова А–Я», дальше сферы жизни (сверка с заказчиком 2026-11-10): кому как удобнее учить.
  const spheres = [all, ...categories.filter((c) => c.slug !== "alfavit")];

  return (
    <div className="grid gap-16 pt-4 md:gap-20">
      <header className="grid gap-3">
        <h1 className="m-0 font-display text-[clamp(36px,5vw,64px)] leading-none font-semibold tracking-[-0.035em]">Взрослым</h1>
        <p className="m-0 max-w-[48ch] text-[17px] text-ink-2">От первых жестов к фразам и разговору.</p>
      </header>

      <section aria-labelledby="course" className="grid gap-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 id="course" className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">Курс «{topic.title}»</h2>
          {later.length > 0 && <p className="m-0 text-sm text-muted">Дальше готовятся: {later.map((t) => t.title).join(" · ")}</p>}
        </div>
        <ol className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 xl:grid-cols-4">
          {topic.lessons.map((l) => (
            <li key={l.slug}>
              <Link href={`/learn/${l.slug}`}
                className={`grid h-full content-start gap-3 rounded-md p-4 transition-colors ${l.completed ? "bg-accent-soft hover:bg-stage-deep" : "bg-surface hover:bg-track"}`}>
                <span className={`grid size-10 place-content-center rounded-full font-semibold tabular-nums ${l.completed ? "bg-accent text-white" : "border-[1.5px] border-line"}`}>
                  {l.completed ? <Icon name="check" /> : l.position}
                </span>
                <span className="grid gap-1">
                  <span className="font-display text-xl font-semibold tracking-[-0.015em]">{l.title}</span>
                  <span className="text-sm text-ink-2">{l.completed ? "Пройден" : l.step > 0 ? `Шаг ${l.step + 1} из ${l.totalSteps}` : `${l.signCount} жестов`}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="library" className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <h2 id="library" className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">Библиотека</h2>
          <nav aria-label="Как искать" className="flex flex-wrap gap-1 text-[15px]">
            <Link href={`/adults/${all.slug}`} className="inline-flex min-h-11 items-center rounded-full px-4 font-medium hover:bg-track">А–Я</Link>
            <span aria-current="page" className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 font-medium text-paper">По сферам</span>
            {kinds.slice(0, 3).map((k) => (
              <Link key={k.kind} href={`/dictionary?kind=${k.kind}`} className="inline-flex min-h-11 items-center rounded-full px-4 font-medium hover:bg-track">{KIND_TITLES[k.kind]}</Link>
            ))}
          </nav>
        </div>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,210px),1fr))] gap-5 p-0">
          {spheres.map((c) => (
            <li key={c.slug}>
              <Link href={`/adults/${c.slug}`} className="grid h-full content-start gap-3 rounded-md border border-line bg-surface p-4 transition-colors hover:border-ink">
                <span className="font-display text-xl leading-tight font-semibold tracking-[-0.015em]">{c.title}</span>
                <span className="grid gap-2">
                  <span className="h-1 overflow-hidden rounded-full bg-track"><span className="block h-full bg-accent" style={{ width: `${(c.learned / c.total) * 100}%` }} /></span>
                  <span className="text-sm text-muted tabular-nums">{c.learned} из {c.total} изучено</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
