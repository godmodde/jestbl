"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui";

// «Учиться» объединяет главный экран и направления: алфавит и взрослые — его разделы.
const ITEMS = [
  { href: "/learn", label: "Учиться", icon: "learn" as const, also: ["/alphabet", "/adults"] },
  { href: "/dictionary", label: "Словарь", icon: "book" as const, also: [] },
  { href: "/review", label: "Повторение", icon: "cards" as const, also: [] },
  { href: "/progress", label: "Прогресс", icon: "progress" as const, also: [] },
];

function useActive() {
  const pathname = usePathname();
  return (item: (typeof ITEMS)[number]) => [item.href, ...item.also].some((h) => pathname === h || pathname.startsWith(h + "/"));
}

function Count({ n }: { n: number }) {
  if (!n) return null;
  return <span className="ml-1.5 inline-grid min-w-6 place-content-center rounded-full bg-accent px-1.5 text-xs font-semibold text-white tabular-nums">{n}</span>;
}

// «Избранное» — вкладка словаря (docs/DESIGN.md, п. 1).
export function PlatformNav({ dueCount }: { dueCount: number }) {
  const active = useActive();
  return (
    <nav aria-label="Разделы" className="flex items-center gap-1 text-[15px] font-medium max-md:hidden">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} aria-current={active(i) ? "page" : undefined}
          className="inline-flex min-h-11 items-center rounded-full px-4 transition-colors hover:bg-track aria-[current=page]:bg-ink aria-[current=page]:text-paper">
          {i.label}
          {i.href === "/review" && <Count n={dueCount} />}
        </Link>
      ))}
    </nav>
  );
}

export function TabBar({ dueCount }: { dueCount: number }) {
  const active = useActive();
  return (
    <nav aria-label="Разделы" className="tabbar fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} aria-current={active(i) ? "page" : undefined}
          className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted aria-[current=page]:text-ink">
          <span className="relative">
            <Icon name={i.icon} size={22} />
            {i.href === "/review" && dueCount > 0 && (
              <span className="absolute -top-1.5 -right-3 grid min-w-5 place-content-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white tabular-nums">{dueCount}</span>
            )}
          </span>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
