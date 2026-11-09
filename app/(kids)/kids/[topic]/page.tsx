import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { KidsAlbum } from "@/components/kids-album";
import { currentDevice } from "@/lib/device-server";
import { getKids } from "@/lib/directions";

type Props = { params: Promise<{ topic: string }>; searchParams: Promise<{ new?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = (await getKids(null)).find((t) => t.slug === slug);
  return { title: topic ? `${topic.title} · Детям` : "Детям" };
}

export default async function KidsTopicPage({ params, searchParams }: Props) {
  const [{ topic: slug }, { new: fresh }] = await Promise.all([params, searchParams]);
  const topics = await getKids(await currentDevice());
  const topic = topics.find((t) => t.slug === slug);
  if (!topic) notFound();
  if (!topic.open) redirect("/kids");
  return <KidsAlbum topics={topics} current={topic.slug} fresh={topic.stickers.some((s) => s.slug === fresh && s.earned) ? fresh : undefined} />;
}
