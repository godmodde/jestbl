import { randomUUID } from "node:crypto";

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { KidsGame } from "@/components/kids-games";
import { currentAge, currentDevice, currentVariant } from "@/lib/device-server";
import { getKidsStation } from "@/lib/directions";
import { getDactylTemplates } from "@/lib/handshape-templates";
import { gameFor } from "@/lib/variant";

export const metadata: Metadata = { title: "Игра · Детям" };

type Props = { params: Promise<{ topic: string; station: string }> };

export default async function StationPage({ params }: Props) {
  const { topic: topicSlug, station: stationSlug } = await params;
  const small = (await currentAge()) === "small";
  const data = await getKidsStation(await currentDevice(), topicSlug, stationSlug, small);
  // У малышей нет «Найди отличие» — старая ссылка ведёт обратно в тему.
  if (!data) return small ? redirect(`/kids/${topicSlug}`) : notFound();
  if (!data.station.open) redirect(`/kids/${topicSlug}`);
  const { world, topic, station, signs } = data;
  // «Накорми» подходит еде; в остальных темах мишка просит принести предмет — механика та же.
  // В вариантах макета 2 и 3 на станциях четырёх механик — новые игры с тем же навыком.
  const game = gameFor(station.kind, station.kind === "feed" && !topic.slug.endsWith("eda") ? "Принеси другу" : station.title, await currentVariant());
  // В темах первая пройденная игра вклеивает следующую наклейку; буквы вклеивает только тест — их покажет итог теста.
  const reward = world === "kids" && !station.completed ? topic.stickers.find((s) => !s.earned) ?? null : null;
  const templates = station.kind === "show" ? await getDactylTemplates() : null;
  return (
    <KidsGame kind={game.kind} title={game.title} seed={randomUUID()} topic={{ slug: topic.slug, title: topic.title }} station={station.slug}
      signs={signs.map((s) => ({ slug: s.slug, title: s.title, picture: s.picture, videoUrl: s.videoUrl }))}
      reward={reward && { slug: reward.slug, title: reward.title, picture: reward.picture, videoUrl: reward.videoUrl }} templates={templates} small={small} />
  );
}
