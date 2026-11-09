/* eslint-disable @next/next/no-img-element -- наклейки: готовые PNG 256 px с заданным размером, оптимизатор не нужен */
import type { Metadata } from "next";
import Link from "next/link";

import { Arrow, ButtonLink, Icon } from "@/components/ui";
import { getLearnHome } from "@/lib/data";
import { currentDevice } from "@/lib/device-server";
import { getContinue, getDirectionsSummary, getLibrary } from "@/lib/directions";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Обучение" };

const DIRECTION_TITLES: Record<string, string> = { alphabet: "Алфавит", adults: "Взрослым", kids: "Детям" };

// Главный экран платформы (ТЗ, п. 5): сразу видно, где остановился и что делать дальше.
// Продолжение — главное действие; направления, повторение и словарь — ниже и тише.
export default async function LearnPage() {
  const device = await currentDevice();
  const [{ topics, dueCount }, last, summary, { categories }] = await Promise.all([
    getLearnHome(device), getContinue(device), getDirectionsSummary(device), getLibrary(device),
  ]);
  const course = (topics.find((t) => t.status === "open") ?? topics[0]).lessons;
  const nextLesson = course.find((l) => !l.completed);
  const lessonsDone = course.filter((l) => l.completed).length;
  const fresh = !last && lessonsDone === 0 && summary.alphabet.learned === 0 && summary.kids.stickers === 0;

  const resume = last
    ? {
        title: last.title,
        where: `${DIRECTION_TITLES[last.direction]} · ${last.topic_title}`,
        href: last.direction === "kids" ? `/kids/${last.topic_slug}/${last.slug}` : `/learn/${last.slug}`,
      }
    : nextLesson
      ? { title: nextLesson.title, where: `Взрослым · урок ${nextLesson.position}`, href: `/learn/${nextLesson.slug}` }
      : null;

  return (
    <div className="grid gap-14 pt-4 md:gap-20">
      <section aria-labelledby="now" className="grid gap-6 rounded-[28px] bg-linear-to-b from-stage to-stage-deep p-[clamp(24px,4vw,56px)] md:grid-cols-[minmax(0,1fr)_auto] md:gap-8 md:items-end">
        <div className="grid gap-3">
          <p className="m-0 text-ink-2">{resume ? resume.where : "Курс «Знакомство» пройден"}</p>
          <h1 id="now" className="m-0 font-display text-[clamp(36px,5.2vw,72px)] leading-[0.98] font-semibold tracking-[-0.035em]">
            {resume ? <>{fresh ? "Начните" : "Продолжить"}: <span className="type-gloss">{resume.title}</span></> : "Время повторить"}
          </h1>
        </div>
        <ButtonLink href={resume?.href ?? "/review"}>{resume ? (fresh ? "Начать урок" : "Продолжить") : "К повторению"} <Arrow /></ButtonLink>
      </section>

      <section aria-labelledby="directions" className="grid gap-8">
        <h2 id="directions" className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">Направления</h2>
        <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-3">
          <li>
            <Link href="/alphabet" className="group grid h-full grid-rows-[1fr_auto] gap-5 rounded-md bg-surface p-5 transition-colors hover:bg-track [&>:first-child]:self-end">
              <span aria-hidden="true" className="font-display text-[88px] leading-[0.8] font-semibold tracking-[-0.04em] text-accent transition-transform duration-300 group-hover:-translate-y-1">Аа</span>
              <span className="grid gap-1">
                <span className="font-display text-2xl font-semibold tracking-[-0.02em]">Алфавит</span>
                <span className="text-ink-2 tabular-nums">{summary.alphabet.learned} из {summary.alphabet.total} букв</span>
              </span>
            </Link>
          </li>
          <li>
            <Link href="/adults" className="group grid h-full grid-rows-[1fr_auto] gap-5 rounded-md bg-surface p-5 transition-colors hover:bg-track [&>:first-child]:self-end">
              <span aria-hidden="true" className="flex gap-1.5">
                {course.map((l) => (
                  <span key={l.slug} className={`grid size-11 place-content-center rounded-full font-semibold tabular-nums ${l.completed ? "bg-accent text-white" : "border-[1.5px] border-line"}`}>
                    {l.completed ? <Icon name="check" /> : l.position}
                  </span>
                ))}
              </span>
              <span className="grid gap-1">
                <span className="font-display text-2xl font-semibold tracking-[-0.02em]">Взрослым</span>
                <span className="text-ink-2 tabular-nums">{lessonsDone} из {course.length} {plural(course.length, ["урока", "уроков", "уроков"])} · {categories.length} категорий</span>
              </span>
            </Link>
          </li>
          <li>
            <Link href="/kids" className="group grid h-full grid-rows-[1fr_auto] gap-5 rounded-md bg-surface p-5 transition-colors hover:bg-track [&>:first-child]:self-end">
              <span aria-hidden="true" className="flex -space-x-3">
                {summary.kids.pictures.map((p, i) => (
                  <img key={p} src={`/pictures/${p}`} alt="" width={64} height={64}
                    className={`sticker size-16 transition-transform duration-300 ${["-rotate-6", "rotate-3", "-rotate-2"][i]} group-hover:rotate-0`} />
                ))}
              </span>
              <span className="grid gap-1">
                <span className="font-display text-2xl font-semibold tracking-[-0.02em]">Детям</span>
                <span className="text-ink-2 tabular-nums">{summary.kids.stickers} из {summary.kids.total} наклеек · {summary.kids.stars} {plural(summary.kids.stars, ["звезда", "звезды", "звёзд"])}</span>
              </span>
            </Link>
          </li>
        </ul>
      </section>

      <div className="grid gap-14 md:gap-20 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:gap-x-20">
        <section aria-labelledby="review" className="grid content-start gap-5">
          <h2 id="review" className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">Повторение</h2>
          {dueCount > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-line p-4">
              <span className="font-display text-[32px] font-semibold tracking-[-0.02em] tabular-nums">{dueCount} {plural(dueCount, ["жест", "жеста", "жестов"])}</span>
              <ButtonLink href="/review" variant="ghost">Повторить</ButtonLink>
            </div>
          ) : (
            <p className="m-0 max-w-[44ch] text-ink-2">На сегодня всё.</p>
          )}
        </section>

        <section aria-labelledby="find" className="grid content-start gap-5">
          <h2 id="find" className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">Словарь</h2>
          <form action="/dictionary" role="search" className="flex gap-2.5">
            <label htmlFor="q" className="sr-only">Найти жест</label>
            <input id="q" name="q" type="search" placeholder="Найти жест" autoComplete="off"
              className="min-h-14 w-0 min-w-0 flex-1 rounded-full border-[1.5px] border-line bg-surface px-6 text-[17px] outline-none placeholder:text-muted focus:border-ink" />
            <button type="submit" className="inline-flex min-h-14 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-paper hover:bg-accent">
              <Icon name="book" /> <span className="max-sm:sr-only">Найти</span>
            </button>
          </form>
          <nav aria-label="Категории" className="flex flex-wrap gap-2">
            {categories.filter((c) => c.slug !== "alfavit").map((c) => (
              <Link key={c.slug} href={`/adults/${c.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-[15px] transition-colors hover:border-ink">
                {c.title}
              </Link>
            ))}
          </nav>
        </section>
      </div>
    </div>
  );
}
