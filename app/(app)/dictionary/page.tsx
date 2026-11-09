import type { Metadata } from "next";
import Link from "next/link";

import { SignGrid } from "@/components/sign-grid";
import { Icon } from "@/components/ui";
import { KIND_TITLES } from "@/lib/directions";
import { getCategories, searchSigns, type DictionaryTab } from "@/lib/data";
import { currentDevice } from "@/lib/device-server";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Словарь" };

const TABS: { tab: DictionaryTab; label: string; empty: string }[] = [
  { tab: "all", label: "Все", empty: "Ничего не нашлось. Проверьте написание или выберите другую категорию." },
  { tab: "learned", label: "Изученные", empty: "Здесь появятся жесты из пройденных уроков." },
  { tab: "favorites", label: "Избранное", empty: "Здесь появятся избранные жесты." },
  { tab: "review", label: "К повторению", empty: "Здесь появятся жесты на повторении." },
];

type Search = { q?: string; category?: string; tab?: string; kind?: string; sort?: string };

// Библиотека «по типу материала» и «по алфавиту» (ТЗ, п. 5) — фильтры того же словаря, а не отдельные страницы.
const KINDS = ["object", "action", "interaction", "phrase"];

function href(current: Search, patch: Search) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...patch })) if (v && v !== "all") params.set(k, v);
  const s = params.toString();
  return s ? `/dictionary?${s}` : "/dictionary";
}

// Словарь (ТЗ, п. 21): в центре — поиск и результаты, без лишних фильтров. Работает и без JavaScript.
export default async function DictionaryPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const tab = TABS.find((t) => t.tab === sp.tab)?.tab ?? "all";
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === sp.category)?.slug;
  const kind = KINDS.find((k) => k === sp.kind);
  const sort = sp.sort === "az" ? "az" : undefined;
  const current: Search = { q: q || undefined, category, tab, kind, sort };
  const results = await searchSigns(await currentDevice(), { q, category, tab, kind, sort });

  return (
    <div className="grid gap-10 [&>*]:min-w-0">
      <div className="grid gap-5 [&>*]:min-w-0">
        <h1 className="m-0 font-display text-[clamp(32px,4vw,48px)] leading-[1.05] font-semibold tracking-[-0.03em]">Словарь</h1>
        <form action="/dictionary" role="search" className="flex max-w-2xl gap-2.5">
          {category && <input type="hidden" name="category" value={category} />}
          {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
          {kind && <input type="hidden" name="kind" value={kind} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          <label htmlFor="q" className="sr-only">Найти жест</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Найти жест: например, «спасибо»" autoComplete="off"
            className="min-h-14 w-0 min-w-0 flex-1 rounded-full border-[1.5px] border-line bg-surface px-6 text-[17px] outline-none placeholder:text-muted focus:border-ink" />
          <button type="submit" className="inline-flex min-h-14 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-paper hover:bg-accent">
            <Icon name="book" /> <span className="max-sm:sr-only">Найти</span>
          </button>
        </form>
      </div>

      <nav aria-label="Разделы словаря" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <Link key={t.tab} href={href(current, { tab: t.tab })} aria-current={t.tab === tab ? "page" : undefined}
            className="inline-flex min-h-11 items-center rounded-full px-4 font-medium whitespace-nowrap transition-colors hover:bg-track aria-[current=page]:bg-ink aria-[current=page]:text-paper">
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] [&>*]:min-w-0">
        <nav aria-label="Категории" className="flex gap-2 lg:gap-4 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          <Link href={href(current, { category: undefined })} aria-current={!category ? "page" : undefined}
            className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-sm whitespace-nowrap hover:border-ink aria-[current=page]:border-accent aria-[current=page]:bg-accent-soft aria-[current=page]:font-semibold lg:rounded-md">
            Все категории
          </Link>
          {categories.map((c) => (
            <Link key={c.slug} href={href(current, { category: c.slug })} aria-current={c.slug === category ? "page" : undefined}
              className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-sm whitespace-nowrap hover:border-ink aria-[current=page]:border-accent aria-[current=page]:bg-accent-soft aria-[current=page]:font-semibold lg:rounded-md">
              {c.title}
            </Link>
          ))}
        </nav>

        <section aria-live="polite" className="grid content-start gap-6">
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
            {[undefined, ...KINDS].map((k) => (
              <Link key={k ?? "all"} href={href(current, { kind: k })} aria-current={k === kind ? "page" : undefined}
                className="inline-flex min-h-11 items-center rounded-full px-3.5 font-medium text-ink-2 transition-colors hover:bg-track aria-[current=page]:bg-track aria-[current=page]:text-ink">
                {k ? KIND_TITLES[k] : "Любой тип"}
              </Link>
            ))}
            <Link href={href(current, { sort: sort ? undefined : "az" })} aria-pressed={!!sort}
              className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 font-medium transition-colors hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper">
              А–Я
            </Link>
          </div>
          {/* Пусто — без счётчика «0 жестов»: плашка сама объясняет. Счётчик — подпись сетки, ближе к ней, чем к фильтрам. */}
          {results.length === 0 ? (
            <p className="m-0 max-w-[52ch] rounded-md bg-surface p-5 text-ink-2">{TABS.find((t) => t.tab === tab)!.empty}</p>
          ) : (
            <div className="grid gap-3">
              <p className="m-0 text-sm text-muted tabular-nums">
                {q ? `По запросу «${q}»: ` : "Показано: "}{results.length} {plural(results.length, ["жест", "жеста", "жестов"])}
              </p>
              <SignGrid signs={results} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
