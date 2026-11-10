import type { Metadata } from "next";

import { SpeedRunner } from "@/components/speed-runner";
import { speedProps } from "@/lib/exam-props";

export const metadata: Metadata = { title: "На скорость" };

export default async function SpeedPage({ params }: { params: Promise<{ category: string }> }) {
  return <SpeedRunner {...await speedProps((await params).category)} />;
}
