import type { Metadata } from "next";

import { ExamRunner } from "@/components/exam-runner";
import { examProps } from "@/lib/exam-props";

export const metadata: Metadata = { title: "Практика" };

// Практика: все пять типов заданий и «вспомнить до раскрытия», ошибку объясняем сразу, без итоговой оценки.
export default async function PracticePage({ params }: { params: Promise<{ category: string }> }) {
  return <ExamRunner mode="practice" {...await examProps((await params).category, true)} />;
}
