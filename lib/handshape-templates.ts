import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { demoVideos } from "@/lib/data";
import type { Templates } from "@/lib/handshape";

// Образцы букв сняты с демо-видео surdo.media (scripts/dactyl-templates.mts) — отдаём их только в локальном демо, как и сами видео.
export async function getDactylTemplates(): Promise<Templates | null> {
  if (!demoVideos) return null;
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), "content/dactyl-templates.json"), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}
