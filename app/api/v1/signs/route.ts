import type { NextRequest } from "next/server";
import { z } from "zod";

import { slugSchema } from "@/lib/api";
import { searchSigns } from "@/lib/data";
import { deviceFromRequest } from "@/lib/device";

const Query = z.object({
  q: z.string().max(100).optional(),
  category: slugSchema.optional(),
  tab: z.enum(["all", "learned", "favorites", "review"]).optional(),
});

export async function GET(req: NextRequest) {
  const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return Response.json({ error: "Неверный запрос" }, { status: 400 });
  return Response.json(await searchSigns(deviceFromRequest(req), parsed.data));
}
