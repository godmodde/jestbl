import type { NextRequest } from "next/server";

import { fail, slugFrom, type SlugContext } from "@/lib/api";
import { getSign } from "@/lib/data";
import { deviceFromRequest } from "@/lib/device";

export async function GET(req: NextRequest, ctx: SlugContext) {
  const slug = await slugFrom(ctx);
  const sign = slug && (await getSign(deviceFromRequest(req), slug));
  return sign ? Response.json(sign) : fail(404, "Жест не найден");
}
