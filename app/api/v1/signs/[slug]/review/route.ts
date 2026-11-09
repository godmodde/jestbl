import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, readBody, requireDevice, slugFrom, type SlugContext } from "@/lib/api";
import { addToReview, gradeSign } from "@/lib/state";

// Без оценки — добавить жест в повторение; с оценкой — запланировать следующий показ.
const Body = z.object({ grade: z.enum(["again", "hard", "good"]).optional() });

export async function POST(req: NextRequest, ctx: SlugContext) {
  const device = requireDevice(req);
  if (!device) return fail(400, "Нет id устройства");
  const slug = await slugFrom(ctx);
  const body = await readBody(req, Body);
  if (!slug || !body) return fail(400, "Неверный запрос");
  const ok = body.grade ? await gradeSign(device, slug, body.grade) : await addToReview(device, slug);
  return ok ? Response.json({ ok: true }) : fail(404, "Жест не найден");
}
