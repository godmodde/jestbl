import Link from "next/link";

import { Icon } from "@/components/ui";
import type { Sign, SignState } from "@/lib/data";

// Короткие карточки жестов: словарь и страница категории.
export function SignGrid({ signs, showCategory = true }: { signs: (Sign & { state: SignState })[]; showCategory?: boolean }) {
  return (
    <ul className="m-0 grid list-none gap-5 p-0 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
      {signs.map((s) => (
        <li key={s.slug}>
          <Link href={`/dictionary/${s.slug}`} className="grid h-full gap-1.5 rounded-md border border-line bg-surface p-4 transition-colors hover:border-ink">
            <span className="flex items-start justify-between gap-3">
              <span className="font-display text-xl font-semibold tracking-[-0.015em]">{s.title}</span>
              <span className="flex gap-1.5 text-accent">
                {s.state.favorite && <span title="В избранном"><Icon name="star-fill" size={16} /><span className="sr-only">В избранном</span></span>}
                {s.state.learned && <span title="Изучен"><Icon name="check" size={16} /><span className="sr-only">Изучен</span></span>}
              </span>
            </span>
            <span className="line-clamp-2 text-sm text-ink-2">{s.meaning}</span>
            {showCategory && <span className="mt-1 text-xs text-muted">{s.categoryTitle}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
