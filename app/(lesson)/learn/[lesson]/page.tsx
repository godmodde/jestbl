import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LessonPlayer } from "@/components/lesson-player";
import { getLesson } from "@/lib/data";
import { currentDevice } from "@/lib/device-server";

type Props = { params: Promise<{ lesson: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getLesson(null, (await params).lesson);
  return { title: data ? `Урок «${data.lesson.title}»` : "Урок не найден" };
}

export default async function LessonPage({ params }: Props) {
  const data = await getLesson(await currentDevice(), (await params).lesson);
  if (!data) notFound();
  return <LessonPlayer lesson={data.lesson} signs={data.signs} pool={data.pool} steps={data.steps} initialStep={data.initialStep} next={data.next} />;
}
