import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SignGrid } from "@/components/sign-grid";
import { Arrow, ButtonLink, Icon } from "@/components/ui";
import { currentDevice } from "@/lib/device-server";
import { getCategory } from "@/lib/directions";
import { canExam } from "@/lib/exam";
import { plural } from "@/lib/plural";

type Params = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const data = await getCategory(null, (await params).category);
  return { title: data?.category.title ?? "Категория" };
}

export default async function CategoryPage({ params }: Params) {
  const data = await getCategory(await currentDevice(), (await params).category);
  if (!data) notFound();
  const { category, signs, pool, last } = data;
  const learned = signs.filter((s) => s.state.learned).length;

  return (
    <div className="grid gap-12 pt-4">
      <header className="grid gap-6">
        <Link href="/adults" className="inline-flex min-h-11 w-fit items-center gap-2 font-medium text-ink-2 hover:text-ink"><Icon name="back" /> Взрослым</Link>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div className="grid gap-2">
            <h1 className="m-0 font-display text-[clamp(36px,5vw,64px)] leading-none font-semibold tracking-[-0.035em]">{category.title}</h1>
            <p className="m-0 text-ink-2 tabular-nums">{signs.length} {plural(signs.length, ["жест", "жеста", "жестов"])} · {learned} изучено
              {last && <> · последний экзамен {Math.round((last.correct / last.total) * 100)}%</>}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/adults/${category.slug}/practice`}>Практика <Arrow /></ButtonLink>
            {canExam(pool) && <ButtonLink href={`/adults/${category.slug}/exam`} variant="ghost">Экзамен</ButtonLink>}
          </div>
        </div>
      </header>
      <SignGrid signs={signs} showCategory={false} />
    </div>
  );
}
