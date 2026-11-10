import Link from "next/link";

import { AgeChip, AgePicker } from "@/components/kids-age";
import { Icon } from "@/components/ui";
import { currentAge, currentDevice } from "@/lib/device-server";
import { getStarBank } from "@/lib/directions";
import { plural } from "@/lib/plural";

// Детский мир — своя шапка без взрослого меню (решение заказчика 2026-10-10): ребёнок не потеряется, взрослый выйдет одной кнопкой.
// Возраст выбирается при первом входе (сверка с заказчиком 2026-11-10); копилка звёзд — в шапке.
export default async function KidsLayout({ children }: { children: React.ReactNode }) {
  const [age, device] = await Promise.all([currentAge(), currentDevice()]);
  const bank = age ? await getStarBank(device) : 0;
  return (
    <>
      <header className="shell flex min-h-[76px] items-center justify-between gap-3 max-md:min-h-[64px] sm:gap-6">
        <Link href="/kids" className="flex items-baseline gap-2.5" aria-label="Детский альбом">
          <span className="font-display text-2xl leading-none font-bold tracking-[-0.02em]">Видно</span>
          <span className="rounded-full bg-track px-2.5 py-1 text-[13px] leading-none font-semibold text-ink max-sm:hidden">Детям</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {age && (
            <>
              <span aria-label={`В копилке ${bank} ${plural(bank, ["звезда", "звезды", "звёзд"])}`} className="inline-flex min-h-14 items-center gap-1.5 px-2 font-display text-xl font-semibold text-star tabular-nums">
                <Icon name="star-fill" size={22} />{bank}
              </span>
              <AgeChip age={age} />
            </>
          )}
          <Link href="/learn" aria-label="Выйти" className="inline-flex min-h-14 items-center gap-2 rounded-full px-3 font-medium text-ink-2 transition-colors hover:bg-track hover:text-ink sm:px-4">
            <Icon name="back" /> <span className="max-sm:sr-only">Выйти</span>
          </Link>
        </div>
      </header>
      <main className="shell pt-2 pb-20">{age ? children : <AgePicker />}</main>
    </>
  );
}
