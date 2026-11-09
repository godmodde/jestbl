import { randomUUID } from "node:crypto";

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { KidsGame } from "@/components/kids-games";
import { currentDevice } from "@/lib/device-server";
import { getKidsStation } from "@/lib/directions";

export const metadata: Metadata = { title: "Игра · Детям" };

type Props = { params: Promise<{ topic: string; station: string }> };

export default async function StationPage({ params }: Props) {
  const { topic: topicSlug, station: stationSlug } = await params;
  const data = await getKidsStation(await currentDevice(), topicSlug, stationSlug);
  if (!data) notFound();
  if (!data.station.open) redirect(`/kids/${topicSlug}`);
  const { topic, station, index, signs } = data;
  // «Накорми» подходит еде; в остальных темах мишка просит принести предмет — механика та же.
  const title = station.kind === "feed" && !topic.slug.endsWith("eda") ? "Принеси другу" : station.title;
  const reward = topic.stickers[index] ?? null;
  return (
    <KidsGame kind={station.kind} title={title} seed={randomUUID()} topic={{ slug: topic.slug, title: topic.title }} station={station.slug}
      signs={signs.map((s) => ({ slug: s.slug, title: s.title, picture: s.picture, videoUrl: s.videoUrl }))}
      reward={reward && { slug: reward.slug, title: reward.title, picture: reward.picture, videoUrl: reward.videoUrl }} />
  );
}
