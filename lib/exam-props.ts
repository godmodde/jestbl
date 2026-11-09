import "server-only";

import { randomUUID } from "node:crypto";

import { notFound } from "next/navigation";

import type { Card } from "@/components/exam-runner";
import { currentDevice } from "@/lib/device-server";
import { getCategory, KIND_TITLES } from "@/lib/directions";
import { buildQuestions, canExam } from "@/lib/exam";

// Новый набор вопросов при каждом открытии (ТЗ, п. 5): зерно случайное, вопросы только из этой категории.
export async function examProps(slug: string, practice: boolean) {
  const data = await getCategory(await currentDevice(), slug);
  if (!data || (!practice && !canExam(data.pool)) || !data.pool.length) notFound();
  const cards: Record<string, Card> = Object.fromEntries(data.signs.map((s) => [s.slug, { title: s.title, meaning: s.meaning, videoUrl: s.videoUrl, kind: s.kind }]));
  return {
    title: `${practice ? "Практика" : "Экзамен"} · ${data.category.title}`,
    questions: buildQuestions(data.pool, randomUUID(), { practice, size: practice ? 8 : undefined }),
    cards,
    back: { href: `/adults/${slug}`, label: data.category.title },
    next: data.next ? { href: `/adults/${data.next.slug}`, title: data.next.title } : null,
    kindTitles: KIND_TITLES,
    save: practice ? null : { category: slug },
  };
}
