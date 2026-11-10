import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { KidsAlbum } from "@/components/kids-album";
import { currentAge, currentDevice } from "@/lib/device-server";
import { getKids } from "@/lib/directions";

export const metadata: Metadata = { title: "Буквы · Детям" };

// Детский алфавит (решение заказчика 2026-11-10): альбом открывается на группе букв, где ребёнок остановился.
export default async function KidsAlphabetPage() {
  // Малышам 3–5 буквы рано (сверка с заказчиком 2026-11-10).
  if ((await currentAge()) === "small") redirect("/kids");
  const groups = await getKids(await currentDevice(), "kids-alphabet");
  const open = groups.filter((g) => g.open);
  if (!open.length) return <p className="m-0 py-20 text-center text-ink-2">Буквы готовятся.</p>;
  const current = open.find((g) => g.stations.some((s) => !s.completed)) ?? open.at(-1)!;
  return <KidsAlbum topics={groups} current={current.slug} world="kids-alphabet" />;
}
