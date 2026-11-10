import { randomUUID } from "node:crypto";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExamRunner, type Card } from "@/components/exam-runner";
import { currentDevice } from "@/lib/device-server";
import { getAlphabet, KIND_TITLES } from "@/lib/directions";
import { buildQuestions } from "@/lib/exam";

export const metadata: Metadata = { title: "Тест по буквам" };

// Проверка группы без подсказок (ТЗ, п. 5): правильный ответ не показываем, итог — в конце.
export default async function LetterCheckPage({ params }: { params: Promise<{ group: string }> }) {
  const { group: slug } = await params;
  const groups = await getAlphabet(await currentDevice());
  const i = groups.findIndex((g) => g.slug === slug);
  if (i < 0) notFound();
  const letters = groups[i].letters.filter((l) => l.videoUrl);
  if (letters.length < 3) notFound();
  const cards: Record<string, Card> = Object.fromEntries(letters.map((l) => [l.slug, { title: l.title, meaning: l.meaning, videoUrl: l.videoUrl, kind: l.kind }]));
  const pool = letters.map((l) => ({ slug: l.slug, title: l.title, meaning: l.meaning, kind: l.kind, similar: [] }));
  const next = groups[i + 1];
  return (
    <ExamRunner mode="exam" title={`Тест · ${groups[i].title}`} cards={cards} kindTitles={KIND_TITLES}
      questions={buildQuestions(pool, randomUUID(), { types: ["recognize", "find"], size: letters.length })}
      save={{ lesson: slug }} back={{ href: "/alphabet", label: "Алфавит" }}
      next={next ? { href: `/alphabet/check/${next.slug}`, title: `Буквы ${next.title}` } : null} />
  );
}
