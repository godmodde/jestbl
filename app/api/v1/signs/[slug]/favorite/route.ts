import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, readBody, requireDevice, slugFrom, type SlugContext } from "@/lib/api";
import { setFavorite } from "@/lib/state";

const Body = z.object({ favorite: z.boolean() });

export async function PUT(req: NextRequest, ctx: SlugContext) {
  const device = requireDevice(req);
  if (!device) return fail(400, "Нет id устройства");
  const slug = await slugFrom(ctx);
  const body = await readBody(req, Body);
  if (!slug || !body) return fail(400, "Неверный запрос");
  return (await setFavorite(device, slug, body.favorite)) ? Response.json({ ok: true }) : fail(404, "Жест не найден");
}
