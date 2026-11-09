import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, readBody, requireDevice, slugFrom, type SlugContext } from "@/lib/api";
import { saveLessonProgress } from "@/lib/state";

const Body = z.object({ step: z.number().int().min(0).max(1000), completed: z.boolean().default(false) });

export async function PUT(req: NextRequest, ctx: SlugContext) {
  const device = requireDevice(req);
  if (!device) return fail(400, "Нет id устройства");
  const slug = await slugFrom(ctx);
  const body = await readBody(req, Body);
  if (!slug || !body) return fail(400, "Неверный запрос");
  return (await saveLessonProgress(device, slug, body.step, body.completed)) ? Response.json({ ok: true }) : fail(404, "Урок не найден");
}
