import type { Metadata } from "next";

import { ExamRunner } from "@/components/exam-runner";
import { examProps } from "@/lib/exam-props";

export const metadata: Metadata = { title: "Экзамен" };

export default async function ExamPage({ params }: { params: Promise<{ category: string }> }) {
  return <ExamRunner mode="exam" {...await examProps((await params).category, false)} />;
}
