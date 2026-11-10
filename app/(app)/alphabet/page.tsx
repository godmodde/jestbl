import type { Metadata } from "next";
import Link from "next/link";

import { Arrow, ButtonLink } from "@/components/ui";
import { currentDevice } from "@/lib/device-server";
import { getAlphabet, type Status } from "@/lib/directions";

export const metadata: Metadata = { title: "Алфавит" };

export const LETTER_TILE: Record<Status, string> = {
  new: "bg-surface hover:bg-track",
  learned: "bg-accent text-white hover:bg-accent-strong",
  review: "bg-warn-soft ring-[1.5px] ring-ink ring-inset hover:bg-track",
};
const STATUS_TITLE: Record<Status, string> = { new: "не изучена", learned: "изучена", review: "пора повторить" };

// Дактиль взрослым (решение заказчика 2026-11-10): ролики удобными группами и тест с выбором ответа. Обводка и камера — в детском алфавите.
export default async function AlphabetPage() {
  const groups = await getAlphabet(await currentDevice());
  const next = groups.flatMap((g) => g.letters).find((l) => l.status !== "learned");

  return (
    <div className="grid gap-14 pt-4 md:gap-16">
      <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div className="grid gap-3">
          <h1 className="m-0 font-display text-[clamp(36px,5vw,64px)] leading-none font-semibold tracking-[-0.035em]">Алфавит</h1>
          <p className="m-0 text-[17px] text-ink-2">33 буквы дактиля. Смотрим ролики и проходим тест по группам.</p>
        </div>
        {next && <ButtonLink href={`/alphabet/${next.slug}`}>{next.status === "review" ? "Повторить" : "Продолжить"}: {next.title} <Arrow /></ButtonLink>}
      </header>

      <div className="grid gap-12">
        {groups.map((g) => (
          <section key={g.slug} aria-labelledby={g.slug} className="grid gap-4 border-t border-line pt-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
            <div className="flex items-baseline justify-between gap-4 lg:grid lg:content-start lg:gap-3">
              <h2 id={g.slug} className="m-0 font-display text-2xl font-semibold tracking-[-0.02em]">{g.title}</h2>
              <Link href={`/alphabet/check/${g.slug}`} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border-[1.5px] border-line px-4 text-[15px] font-semibold transition-colors hover:border-ink">
                {g.check ? `Тест: ${g.check.correct} из ${g.check.total}` : "Пройти тест"}
              </Link>
            </div>
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 p-0">
              {g.letters.map((l) => (
                <li key={l.slug}>
                  <Link href={`/alphabet/${l.slug}`} aria-label={`Буква ${l.title}, ${STATUS_TITLE[l.status]}`}
                    className={`group grid aspect-square place-content-center rounded-[20px] transition-colors ${LETTER_TILE[l.status]}`}>
                    <span className="font-display text-[clamp(40px,3.4vw,52px)] leading-none font-semibold tracking-[-0.03em] transition-transform duration-300 group-hover:-translate-y-1">
                      {l.title}<span className="text-[0.6em] opacity-55">{l.title.toLowerCase()}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
