import type { Metadata } from "next";

import { KidsAlbum } from "@/components/kids-album";
import { KidsBoard } from "@/components/kids-board";
import { currentAge, currentDevice, currentVariant } from "@/lib/device-server";
import { getKids } from "@/lib/directions";

export const metadata: Metadata = { title: "Детям" };

// Альбом открывается на теме, где ребёнок остановился.
export default async function KidsPage() {
  const small = (await currentAge()) === "small";
  const topics = await getKids(await currentDevice(), "kids", small);
  const open = topics.filter((t) => t.open);
  if (!open.length) return <p className="m-0 py-20 text-center text-ink-2">Темы готовятся.</p>;
  const current = open.find((t) => t.stations.some((s) => !s.completed)) ?? open.at(-1)!;
  // Варианты макета 2 и 3 — альбом по наброску Леры.
  const v = await currentVariant();
  return v === 1 ? <KidsAlbum topics={topics} current={current.slug} small={small} /> : <KidsBoard topics={topics} current={current.slug} small={small} v={v} />;
}
