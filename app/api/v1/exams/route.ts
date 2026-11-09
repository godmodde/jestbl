import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, readBody, requireDevice, slugSchema } from "@/lib/api";
import { saveExamAttempt } from "@/lib/state";

// ponytail: итог считает клиент. Для таблицы лидеров (этап 2) сервер должен пересобирать экзамен по зерну и проверять ответы сам.
const Body = z.object({
  category: slugSchema.optional(),
  lesson: slugSchema.optional(),
  total: z.number().int().min(1).max(100),
  correct: z.number().int().min(0).max(100),
  mistakes: z.array(slugSchema).max(100),
  passed: z.array(slugSchema).max(100),
}).refine((b) => !!b.category !== !!b.lesson && b.correct <= b.total);

export async function POST(req: NextRequest) {
  const device = requireDevice(req);
  if (!device) return fail(400, "Нет id устройства");
  const body = await readBody(req, Body);
  if (!body) return fail(400, "Неверный запрос");
  const saved = await saveExamAttempt(device, body);
  return saved ? Response.json({ ok: true, stars: saved.stars }) : fail(404, "Экзамен не найден");
}
