"use client";

import { useEffect, useRef, useState } from "react";
import type { HandLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";

import { btn, Icon } from "@/components/ui";
import { features, isLetter, normalize, SAME_SHAPE, type Hand, type Templates } from "@/lib/handshape";

// Проверка дактильной буквы камерой. Кадры разбираются в браузере (MediaPipe, файлы в public/mediapipe) — видео никуда не уходит.

const HOLD_MS = 800; // столько буква должна держаться, чтобы случайный кадр не засчитался
const GIVE_UP_MS = 20_000;
const ASSETS = "/mediapipe";

type Phase = "idle" | "loading" | "asking" | "live" | "done" | "stuck" | "blocked";

type Props = {
  letter: string;
  templates: Templates;
  /** true — буква показана; false — 20 с без успеха. Камера к этому моменту уже выключена. */
  onResult: (ok: boolean) => void;
  /** Камеры нет, доступ запрещён или пользователь сам выбрал проверку без камеры. */
  onNoCamera: () => void;
  /** Включить камеру сразу, без кнопки: в тесте со второй буквы, когда доступ уже дан. */
  autoStart?: boolean;
};

// Модель грузится один раз на страницу: в тесте камера включается заново на каждую букву.
let shared: Promise<HandLandmarker> | null = null;
const getHands = () => (shared ??= loadHands().catch((e) => { shared = null; throw e; }));

async function loadHands() {
  const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
  const files = await FilesetResolver.forVisionTasks(ASSETS);
  const make = (delegate: "GPU" | "CPU") => HandLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: `${ASSETS}/hand_landmarker.task`, delegate }, runningMode: "VIDEO", numHands: 1,
  });
  // Без WebGL (старые планшеты, выключенное ускорение) GPU не создаётся — тогда процессор, медленнее, но работает.
  return make("GPU").catch(() => make("CPU"));
}

function problemText(e: unknown) {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Нет доступа к камере. Его можно разрешить в настройках браузера.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Камера не найдена.";
  if (name === "NotReadableError" || name === "AbortError") return "Камера занята другой программой.";
  return "Не получилось запустить проверку камерой.";
}

// Точки руки поверх зеркального кадра. Видео вписано через object-cover — повторяем то же кадрирование.
function drawPoints(canvas: HTMLCanvasElement, video: HTMLVideoElement, points: NormalizedLandmark[] | undefined, colors: [string, string]) {
  const dpr = devicePixelRatio || 1;
  const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  if (!points || !video.videoWidth) return;
  const s = Math.max(w / video.videoWidth, h / video.videoHeight);
  const ox = (w - video.videoWidth * s) / 2, oy = (h - video.videoHeight * s) / 2;
  [ctx.fillStyle, ctx.strokeStyle] = colors;
  ctx.lineWidth = dpr;
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(ox + p.x * video.videoWidth * s, oy + p.y * video.videoHeight * s, 2.5 * dpr, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }
}

export function CameraCheck({ letter, templates, onResult, onNoCamera, autoStart = false }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [problem, setProblem] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const hands = useRef<HandLandmarker | null>(null);
  const alive = useRef(false);
  const report = useRef(onResult);
  useEffect(() => { report.current = onResult; });

  const stopCamera = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  };

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopCamera();
    };
  }, []);

  const block = (text: string) => { setProblem(text); setPhase("blocked"); };

  async function start() {
    if (!templates[letter]?.length && !templates[SAME_SHAPE[letter]]?.length) return block("Для этой буквы проверки камерой пока нет.");
    if (!navigator.mediaDevices?.getUserMedia) return block("Этот браузер не даёт доступа к камере.");
    try {
      setPhase("loading");
      if (!hands.current) {
        hands.current = await getHands();
        if (!alive.current) return;
      }
      setPhase("asking");
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      // Пока спрашивали разрешение, компонент могли убрать со страницы — камеру не оставляем включённой.
      if (!alive.current) return s.getTracks().forEach((t) => t.stop());
      stream.current = s;
      video.current!.srcObject = s;
      await video.current!.play();
      setPhase("live");
    } catch (e) {
      stopCamera();
      if (alive.current) block(problemText(e));
    }
  }

  // Один раз при появлении — следующая буква теста.
  useEffect(() => {
    if (!autoStart) return;
    const t = setTimeout(start);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== "live") return;
    const v = video.current!, c = canvas.current!, h = hands.current!, b = bar.current!;
    const css = getComputedStyle(document.documentElement);
    const colors: [string, string] = [css.getPropertyValue("--color-surface"), css.getPropertyValue("--color-ink")];
    let raf = 0, lastFrame = -1, held = 0, prev = performance.now(), finished = false;

    const finish = (ok: boolean) => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      stopCamera();
      setPhase(ok ? "done" : "stuck");
      report.current(ok);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (v.currentTime === lastFrame) return; // новый кадр камеры ещё не пришёл
      lastFrame = v.currentTime;
      const r = h.detectForVideo(v, now);
      const world = r.worldLandmarks[0];
      const ok = !!world && isLetter(features(normalize(world, r.handedness[0][0].categoryName as Hand)), templates, letter).ok;
      // Полоска растёт, пока буква держится, и убывает без неё: один неудачный кадр не сбрасывает удержание.
      held = Math.min(HOLD_MS, Math.max(0, held + (ok ? 1 : -1) * (now - prev)));
      prev = now;
      b.style.transform = `scaleX(${held / HOLD_MS})`;
      drawPoints(c, v, r.landmarks[0], colors);
      if (held >= HOLD_MS) finish(true);
    };
    raf = requestAnimationFrame(tick);
    const timer = setTimeout(() => finish(false), GIVE_UP_MS);
    return () => {
      finished = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      b.style.transform = "scaleX(0)";
    };
  }, [phase, letter, templates]);

  const live = phase === "live";
  const noCamera = (
    <button type="button" onClick={onNoCamera} autoFocus className={btn.ghost}>Проверить без камеры</button>
  );

  return (
    <div className="grid content-start gap-3">
      <div className="relative aspect-video max-w-full overflow-hidden rounded bg-frame">
        <video ref={video} muted playsInline aria-label="Изображение с вашей камеры"
          className={`absolute inset-0 h-full w-full -scale-x-100 object-cover ${live ? "" : "hidden"}`} />
        <canvas ref={canvas} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full -scale-x-100 ${live ? "" : "hidden"}`} />
        {!live && (
          <div aria-hidden="true" className="absolute inset-0 grid place-content-center justify-items-center gap-2 text-ink-2">
            {phase === "done" ? (
              <span className="anim-pop grid size-24 place-content-center rounded-full bg-accent-soft text-accent"><Icon name="check" size={44} /></span>
            ) : (
              <span className="font-display text-[clamp(96px,18vw,180px)] leading-none font-semibold opacity-40">{letter}</span>
            )}
          </div>
        )}
      </div>

      <div className="h-1 overflow-hidden rounded-sm bg-line" aria-hidden="true">
        <span ref={bar} className="block h-full origin-left bg-accent" style={{ transform: "scaleX(0)" }} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p role="status" aria-live="polite" className={`m-0 ${live || phase === "done" ? "font-display text-2xl font-semibold tracking-[-0.02em]" : "text-[17px]"}`}>
          {phase === "idle" && "Видео остаётся на вашем устройстве"}
          {phase === "loading" && "Загружаем распознавание жестов…"}
          {phase === "asking" && "Разрешите доступ к камере в окне браузера"}
          {phase === "live" && `Покажи букву ${letter}`}
          {phase === "done" && "Верно!"}
          {phase === "stuck" && "Не получилось — попробуй ещё раз"}
          {phase === "blocked" && problem}
        </p>
        {phase === "idle" && <button type="button" onClick={start} className={btn.primary}>Включить камеру</button>}
        {phase === "blocked" && noCamera}
        {phase === "stuck" && (
          <div className="flex flex-wrap gap-2.5">
            {noCamera}
            <button type="button" onClick={start} className={btn.soft}>Ещё раз</button>
          </div>
        )}
      </div>
    </div>
  );
}
