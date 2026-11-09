import type { NextRequest } from "next/server";

import { fail, slugFrom, type SlugContext } from "@/lib/api";
import { getLesson } from "@/lib/data";
import { deviceFromRequest } from "@/lib/device";

export async function GET(req: NextRequest, ctx: SlugContext) {
  const slug = await slugFrom(ctx);
  const lesson = slug && (await getLesson(deviceFromRequest(req), slug));
  return lesson ? Response.json(lesson) : fail(404, "Урок не найден");
}
