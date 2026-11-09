// Образцы дактильных букв для проверки камерой: точки руки с демо-видео surdo.media → признаки (lib/handshape.ts).
// Только для локального демо: разрешения правообладателя нет, поэтому файл лежит в content/, а не в public/,
// и страница получает его только при DEMO_VIDEOS=surdo (lib/handshape-templates.ts).
// Ролики не сохраняются на диск: скачиваются в память и отдаются Chromium через page.route (у surdo нет CORS-заголовка).
// Запуск: pnpm dactyl:templates → content/dactyl-templates.json
import { readFile, writeFile } from "node:fs/promises";

import { chromium } from "@playwright/test";
import type { HandLandmarker } from "@mediapipe/tasks-vision";

import { features, normalize, TEMPLATE_HAND, type Point } from "../lib/handshape.ts";

// Слаги сверены со страницей https://surdo.media/topics/alfavit/ (2026-10-10). Ё на сайте нет.
const LETTERS: Record<string, string> = {
  А: "a", Б: "b", В: "v", Г: "g", Д: "d", Е: "e", Ж: "zh", З: "z", И: "i", Й: "iy", К: "k", Л: "l", М: "m", Н: "n", О: "o", П: "p",
  Р: "r", С: "s", Т: "t", У: "u", Ф: "f", Х: "h", Ц: "c", Ч: "ch", Ш: "sh", Щ: "shch", Ъ: "j", Ы: "yu", Ь: "_", Э: "ae", Ю: "y", Я: "ya",
};
const videoUrl = (slug: string) => `https://surdo.media/wp-content/uploads/2023/07/${slug}.mp4`;
const PAUSE_MS = 2500; // surdo.media режет частые запросы
const STEP_S = 1 / 15;
// В ролике сначала анфас, потом склейка на 3/4. Склейку видно по скачку миниатюры 32×18: между соседними кадрами
// движение руки даёт до ~10 единиц яркости, склейка — больше 60.
const CUT = 30;
const PER_LETTER = 8;
const ROOT = new URL("..", import.meta.url).pathname;
const OUT = `${ROOT}content/dactyl-templates.json`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function download(url: string) {
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (vidno dactyl templates)" }, signal: AbortSignal.timeout(60_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) {
      if (attempt === 4) throw new Error(`${url}: ${(e as Error).message}`);
      console.log(`  повтор через ${attempt * 10} с: ${(e as Error).message}`);
      await sleep(attempt * 10_000);
    }
  }
}

type Frame = { t: number; world: Point[]; label: string };

const browser = await chromium.launch({ args: ["--disable-gpu"] });
try {
  const page = await browser.newPage();
  let video: Buffer | null = null;
  await page.route("https://surdo.media/**", (route) =>
    video ? route.fulfill({ headers: { "access-control-allow-origin": "*", "content-type": "video/mp4" }, body: video }) : route.abort());
  await page.route("http://dactyl.local/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/") {
      return route.fulfill({ contentType: "text/html", body: `<video crossorigin="anonymous" muted></video><script type="module">
        import { FilesetResolver, HandLandmarker } from "/vision.mjs";
        const files = await FilesetResolver.forVisionTasks("/mediapipe");
        window.hands = await HandLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: "/mediapipe/hand_landmarker.task", delegate: "CPU" }, runningMode: "IMAGE", numHands: 1 });
      </script>` });
    }
    const file = path === "/vision.mjs" ? `${ROOT}node_modules/@mediapipe/tasks-vision/vision_bundle.mjs`
      : path.startsWith("/mediapipe/") ? `${ROOT}public${path}` : null;
    if (!file) return route.fulfill({ status: 404 });
    return route.fulfill({ body: await readFile(file), contentType: path.endsWith(".wasm") ? "application/wasm" : "text/javascript" });
  });
  await page.goto("http://dactyl.local/");
  await page.waitForFunction(() => "hands" in window, null, { timeout: 60_000 });

  const out: Record<string, number[][]> = {};
  for (const [letter, slug] of Object.entries(LETTERS)) {
    video = await download(videoUrl(slug));
    const frames = await page.evaluate(async ({ url, step, cut }) => {
      const hands = (window as unknown as { hands: HandLandmarker }).hands;
      const v = document.querySelector("video")!;
      // Целиком в память страницы: перемотка по blob не ходит в сеть за каждым кадром.
      URL.revokeObjectURL(v.src);
      v.src = URL.createObjectURL(await (await fetch(url)).blob());
      await new Promise((ok, fail) => { v.onloadeddata = ok; v.onerror = () => fail(new Error("видео не открылось")); });
      const ctx = Object.assign(document.createElement("canvas"), { width: 32, height: 18 }).getContext("2d", { willReadFrequently: true })!;
      const thumb = () => { ctx.drawImage(v, 0, 0, 32, 18); return ctx.getImageData(0, 0, 32, 18).data; };
      const found: { t: number; world: { x: number; y: number; z: number }[]; label: string }[] = [];
      let prev: Uint8ClampedArray | null = null;
      for (let t = 0; t < v.duration; t += step) {
        await new Promise((ok) => { v.onseeked = ok; v.currentTime = t; });
        const now = thumb();
        if (prev && now.reduce((s, x, i) => s + Math.abs(x - prev![i]), 0) / now.length > cut) break;
        prev = now;
        const r = hands.detect(v);
        if (r.worldLandmarks[0]) found.push({ t, world: r.worldLandmarks[0].map(({ x, y, z }) => ({ x, y, z })), label: r.handedness[0][0].categoryName });
      }
      return found;
    }, { url: videoUrl(slug), step: STEP_S, cut: CUT });
    video = null;

    // Края серии — рука поднимается и опускается; буква держится в середине.
    const core: Frame[] = frames.slice(Math.round(frames.length * 0.2), Math.round(frames.length * 0.8));
    const n = Math.min(PER_LETTER, core.length);
    const picked = Array.from({ length: n }, (_, i) => core[Math.floor((i * core.length) / n)]);
    if (n < 6) throw new Error(`${letter}: рука найдена только в ${frames.length} кадрах анфаса`);
    out[letter] = picked.map((f) => features(normalize(f.world, TEMPLATE_HAND)).map((x) => Math.round(x * 1000) / 1000));
    const other = frames.filter((f) => f.label !== TEMPLATE_HAND).length;
    console.log(`${letter} (${slug}): ${n} кадров, ${picked[0].t.toFixed(2)}–${picked[n - 1].t.toFixed(2)} с` + (other ? `; MediaPipe пометил другой рукой ${other} из ${frames.length}` : ""));
    await sleep(PAUSE_MS);
  }

  await writeFile(OUT, JSON.stringify(out, null, 0).replace(/\],"/g, '],\n"') + "\n");
  console.log(`Готово, букв: ${Object.keys(out).length} → ${OUT}`);
} finally {
  await browser.close();
}
