import type { Metadata } from "next";
import Link from "next/link";

import { Arrow, ButtonLink, Icon } from "@/components/ui";
import { getLearnHome } from "@/lib/data";
import { currentDevice } from "@/lib/device-server";
import { getAlphabet, getKids, getProgressExtras, type Status } from "@/lib/directions";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Прогресс" };

const LETTER: Record<Status, string> = {
  new: "border-[1.5px] border-line text-muted",
  learned: "bg-accent text-white",
  review: "bg-warn-soft text-ink ring-[1.5px] ring-ink ring-inset",
};

// Кабинет первой версии (ТЗ, п. 7): что пройдено, результаты экзаменов, слабые места. Всё — по этому устройству.
export default async function ProgressPage() {
  const device = await currentDevice();
  const [alphabet, { topics }, kids, { weak, exams }] = await Promise.all([
    getAlphabet(device), getLearnHome(device), getKids(device), getProgressExtras(device),
  ]);
  const letters = alphabet.flatMap((g) => g.letters);
  const course = topics.flatMap((t) => t.lessons);

  return (
    <div className="grid gap-16 pt-4 md:gap-20">
      <header className="grid gap-3">
        <h1 className="m-0 font-display text-[clamp(36px,5vw,64px)] leading-none font-semibold tracking-[-0.035em]">Прогресс</h1>
        <p className="m-0 max-w-[52ch] text-ink-2">Сохраняется на этом устройстве.</p>
      </header>

      <section aria-labelledby="letters" className="grid gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 id="letters" className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">Алфавит</h2>
          <span className="text-ink-2 tabular-nums">{letters.filter((l) => l.status !== "new").length} из {letters.length} букв</span>
        </div>
        <ul aria-label="Буквы" className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-2 p-0">
          {letters.map((l) => (
            <li key={l.slug}>
              <Link href={`/alphabet/${l.slug}`} title={l.status === "review" ? "Пора повторить" : l.status === "learned" ? "Изучена" : "Не изучена"}
                className={`grid aspect-square place-content-center rounded-md font-display text-xl font-semibold transition-transform hover:-translate-y-0.5 ${LETTER[l.status]}`}>
                {l.title}
              </Link>
            </li>
          ))}
        </ul>
        <p className="m-0 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-2">
          <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-accent" />изучена</span>
          <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-warn-soft ring-[1.5px] ring-ink ring-inset" />пора повторить</span>
          <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm border-[1.5px] border-line" />не изучена</span>
        </p>
      </section>

      <div className="grid gap-16 md:gap-20 xl:grid-cols-2 xl:gap-x-20">
        <section aria-labelledby="adults" className="grid content-start gap-5">
          <h2 id="adults" className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">Взрослым</h2>
          <p className="m-0 text-ink-2 tabular-nums">{course.filter((l) => l.completed).length} из {course.length} {plural(course.length, ["урока", "уроков", "уроков"])} пройдено</p>
          {exams.length > 0 ? (
            <dl className="m-0 grid gap-2">
              {exams.map((e) => (
                <div key={e.slug} className="flex items-baseline justify-between gap-6 border-b border-line pb-2">
                  <dt><Link href={`/adults/${e.slug}`} className="underline-offset-4 hover:underline">{e.title}</Link></dt>
                  <dd className="m-0 font-semibold tabular-nums">{Math.round((e.correct / e.total) * 100)}%</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="m-0 text-muted">Результаты экзаменов появятся здесь.</p>
          )}
        </section>

        <section aria-labelledby="kids" className="grid content-start gap-5">
          <h2 id="kids" className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">Детям</h2>
          <ul className="m-0 grid list-none gap-2 p-0">
            {kids.filter((t) => t.status === "open").map((t) => (
              <li key={t.slug} className="flex items-center justify-between gap-6 border-b border-line pb-2">
                <Link href={`/kids/${t.slug}`} className="underline-offset-4 hover:underline">{t.title}</Link>
                <span className="flex items-center gap-4 tabular-nums">
                  <span className="text-ink-2">{t.stickers.filter((s) => s.earned).length} из {t.stickers.length}</span>
                  <span aria-label={`${t.stars} из 3 звёзд`} className="flex text-star">
                    {[1, 2, 3].map((n) => <Icon key={n} name={n <= t.stars ? "star-fill" : "star"} size={16} />)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="weak" className="grid gap-5">
        <h2 id="weak" className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em]">Слабые места</h2>
        {weak.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {weak.map((w) => (
                <li key={w.slug}>
                  <Link href={`/dictionary/${w.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 hover:border-ink">
                    {w.title} <span className="text-sm text-muted tabular-nums">×{w.misses}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <ButtonLink href="/review" variant="ghost">Повторить <Arrow /></ButtonLink>
          </div>
        ) : (
          <p className="m-0 text-muted">Ошибок пока нет.</p>
        )}
      </section>
    </div>
  );
}
