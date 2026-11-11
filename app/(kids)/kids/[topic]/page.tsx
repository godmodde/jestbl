import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { KidsAlbum } from "@/components/kids-album";
import { KidsBoard } from "@/components/kids-board";
import { currentAge, currentDevice, currentVariant } from "@/lib/device-server";
import { getKidsAlbum } from "@/lib/directions";

type Props = { params: Promise<{ topic: string }>; searchParams: Promise<{ new?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = (await getKidsAlbum(null, slug))?.topics.find((t) => t.slug === slug);
  return { title: topic ? `${topic.title} · Детям` : "Детям" };
}

export default async function KidsTopicPage({ params, searchParams }: Props) {
  const [{ topic: slug }, { new: fresh }] = await Promise.all([params, searchParams]);
  // Тема или группа букв — у каждого альбома свои закладки.
  const small = (await currentAge()) === "small";
  const album = await getKidsAlbum(await currentDevice(), slug, small);
  const topic = album?.topics.find((t) => t.slug === slug);
  if (!album || !topic) notFound();
  if (small && album.world !== "kids") redirect("/kids");
  if (!topic.open) redirect(album.world === "kids" ? "/kids" : "/kids/alphabet");
  const props = { topics: album.topics, current: topic.slug, world: album.world, small, fresh: topic.stickers.some((s) => s.slug === fresh && s.earned) ? fresh : undefined };
  const v = await currentVariant();
  return v === 1 ? <KidsAlbum {...props} /> : <KidsBoard {...props} v={v} />;
}
