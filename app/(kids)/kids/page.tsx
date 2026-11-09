import type { Metadata } from "next";

import { KidsAlbum } from "@/components/kids-album";
import { currentDevice } from "@/lib/device-server";
import { getKids } from "@/lib/directions";

export const metadata: Metadata = { title: "Детям" };

// Альбом открывается на теме, где ребёнок остановился.
export default async function KidsPage() {
  const topics = await getKids(await currentDevice());
  const open = topics.filter((t) => t.open);
  if (!open.length) return <p className="m-0 py-20 text-center text-ink-2">Темы готовятся.</p>;
  const current = open.find((t) => t.stations.some((s) => !s.completed)) ?? open.at(-1)!;
  return <KidsAlbum topics={topics} current={current.slug} />;
}
