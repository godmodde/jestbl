import type { Metadata } from "next";

import { ReviewSession } from "@/components/review-session";
import { getReviewQueue } from "@/lib/data";
import { currentDevice } from "@/lib/device-server";

export const metadata: Metadata = { title: "Повторение" };

export default async function ReviewPage() {
  const queue = await getReviewQueue(await currentDevice());
  return <ReviewSession cards={queue.map(({ slug, title, meaning, videoUrl }) => ({ slug, title, meaning, videoUrl }))} />;
}
