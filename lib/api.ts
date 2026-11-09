import "server-only";

import type { NextRequest } from "next/server";
import { z } from "zod";

import { deviceFromRequest } from "@/lib/device";

// Общие куски для /api/v1: им пользуется и сайт, и будущее приложение.
export const slugSchema = z.string().regex(/^[a-z0-9-]{1,80}$/);

export type SlugContext = { params: Promise<{ slug: string }> };

export const fail = (status: number, error: string) => Response.json({ error }, { status });

export async function slugFrom(ctx: SlugContext) {
  const parsed = slugSchema.safeParse((await ctx.params).slug);
  return parsed.success ? parsed.data : null;
}

/** Устройство обязательно для записи: cookie от сайта или заголовок X-Device-Id от приложения. */
export function requireDevice(req: NextRequest) {
  return deviceFromRequest(req);
}

export async function readBody<T extends z.ZodType>(req: NextRequest, schema: T): Promise<z.infer<T> | null> {
  const parsed = schema.safeParse(await req.json().catch(() => undefined));
  return parsed.success ? parsed.data : null;
}
